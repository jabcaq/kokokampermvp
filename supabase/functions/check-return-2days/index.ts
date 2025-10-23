import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Calculate date range for 2 days from now at 7 AM
    const now = new Date();
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + 2);
    targetDate.setHours(0, 0, 0, 0);
    
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    console.log('Checking for returns in 2 days:', {
      from: targetDate.toISOString(),
      to: nextDay.toISOString()
    });

    // Fetch vehicle returns scheduled in 2 days
    const { data: returns, error: returnsError } = await supabase
      .from('vehicle_returns')
      .select('*, contracts(*)')
      .gte('scheduled_return_date', targetDate.toISOString())
      .lt('scheduled_return_date', nextDay.toISOString())
      .eq('return_completed', false);

    if (returnsError) {
      console.error('Error fetching returns:', returnsError);
      throw returnsError;
    }

    if (!returns || returns.length === 0) {
      console.log('No returns found for 2 days from now');
      return new Response(
        JSON.stringify({ message: 'No returns found', count: 0 }),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    console.log(`Found ${returns.length} return(s) scheduled in 2 days`);

    let notificationsSent = 0;

    for (const returnRecord of returns) {
      try {
        const contract = returnRecord.contracts;
        
        if (!contract) {
          console.error(`No contract found for return ${returnRecord.id}`);
          continue;
        }

        console.log(`Processing return for contract: ${contract.contract_number}`);

        // Send webhook to Make.com for 2-day return notification
        const webhookUrl = 'https://hook.eu2.make.com/hk044wt625t33gs2qyvusatijdcrsa30';
        
        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            return_id: returnRecord.id,
            contract_id: contract.id,
            contract_number: contract.contract_number,
            tenant_name: contract.tenant_name,
            tenant_email: contract.tenant_email,
            vehicle_model: contract.vehicle_model,
            registration_number: contract.registration_number,
            scheduled_return_date: returnRecord.scheduled_return_date,
            scheduled_return_time: returnRecord.scheduled_return_time,
            employee_name: returnRecord.employee_name,
            notification_type: 'return_2days_prior',
            timestamp: new Date().toISOString()
          }),
        });

        if (!webhookResponse.ok) {
          console.error(`Webhook failed for return ${returnRecord.id}:`, await webhookResponse.text());
          continue;
        }

        console.log(`Webhook sent successfully for return: ${returnRecord.id}`);

        // Create notification in database
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            type: 'return_2days_prior',
            title: 'Zwrot za 2 dni',
            message: `Zwrot kampera ${contract.vehicle_model} (${contract.registration_number}) dla ${contract.tenant_name} zaplanowany za 2 dni (${new Date(returnRecord.scheduled_return_date).toLocaleDateString('pl-PL')} o ${returnRecord.scheduled_return_time})`,
            link: `/contracts/${contract.id}`
          });

        if (notificationError) {
          console.error('Error creating notification:', notificationError);
        }

        // Log the notification
        const { error: logError } = await supabase
          .from('notification_logs')
          .insert({
            notification_type: 'return_2days_prior',
            notification_title: 'Zwrot za 2 dni',
            action_description: `Wysłano powiadomienie o zwrocie za 2 dni dla umowy ${contract.contract_number}`,
            contract_id: contract.id,
            contract_number: contract.contract_number,
            metadata: {
              tenant_name: contract.tenant_name,
              vehicle_model: contract.vehicle_model,
              scheduled_return_date: returnRecord.scheduled_return_date,
              scheduled_return_time: returnRecord.scheduled_return_time,
              employee_name: returnRecord.employee_name
            }
          });

        if (logError) {
          console.error('Error logging notification:', logError);
        }

        notificationsSent++;
      } catch (error) {
        console.error(`Error processing return ${returnRecord.id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({ 
        message: `Checked ${returns.length} return(s), sent ${notificationsSent} notification(s)`,
        returnsChecked: returns.length,
        notificationsSent
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error: any) {
    console.error('Error in check-return-2days function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
};

serve(handler);
