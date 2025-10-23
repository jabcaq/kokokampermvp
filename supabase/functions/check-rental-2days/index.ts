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

    console.log('Checking for rentals starting in 2 days:', {
      from: targetDate.toISOString(),
      to: nextDay.toISOString()
    });

    // Fetch contracts starting in 2 days
    const { data: contracts, error: contractsError } = await supabase
      .from('contracts')
      .select('*')
      .gte('start_date', targetDate.toISOString())
      .lt('start_date', nextDay.toISOString())
      .neq('status', 'cancelled');

    if (contractsError) {
      console.error('Error fetching contracts:', contractsError);
      throw contractsError;
    }

    if (!contracts || contracts.length === 0) {
      console.log('No contracts found starting in 2 days');
      return new Response(
        JSON.stringify({ message: 'No contracts found', count: 0 }),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    console.log(`Found ${contracts.length} contract(s) starting in 2 days`);

    let notificationsSent = 0;

    for (const contract of contracts) {
      try {
        console.log(`Processing contract: ${contract.contract_number}`);

        // Send webhook to Make.com for 2-day notification
        const webhookUrl = 'https://hook.eu2.make.com/6afw5psfv27jxfw7o94c00u5s7cw8d4j';
        
        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contract_id: contract.id,
            contract_number: contract.contract_number,
            tenant_name: contract.tenant_name,
            tenant_email: contract.tenant_email,
            vehicle_model: contract.vehicle_model,
            registration_number: contract.registration_number,
            start_date: contract.start_date,
            end_date: contract.end_date,
            notification_type: 'rental_2days_prior',
            timestamp: new Date().toISOString()
          }),
        });

        if (!webhookResponse.ok) {
          console.error(`Webhook failed for contract ${contract.contract_number}:`, await webhookResponse.text());
          continue;
        }

        console.log(`Webhook sent successfully for contract: ${contract.contract_number}`);

        // Create notification in database
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            type: 'rental_2days_prior',
            title: 'Wynajem za 2 dni',
            message: `Wynajem ${contract.vehicle_model} (${contract.registration_number}) dla ${contract.tenant_name} rozpoczyna się za 2 dni (${new Date(contract.start_date).toLocaleDateString('pl-PL')})`,
            link: `/contracts/${contract.id}`
          });

        if (notificationError) {
          console.error('Error creating notification:', notificationError);
        }

        // Log the notification
        const { error: logError } = await supabase
          .from('notification_logs')
          .insert({
            notification_type: 'rental_2days_prior',
            notification_title: 'Wynajem za 2 dni',
            action_description: `Wysłano powiadomienie o wynajmie za 2 dni dla umowy ${contract.contract_number}`,
            contract_id: contract.id,
            contract_number: contract.contract_number,
            metadata: {
              tenant_name: contract.tenant_name,
              vehicle_model: contract.vehicle_model,
              start_date: contract.start_date
            }
          });

        if (logError) {
          console.error('Error logging notification:', logError);
        }

        notificationsSent++;
      } catch (error) {
        console.error(`Error processing contract ${contract.contract_number}:`, error);
      }
    }

    return new Response(
      JSON.stringify({ 
        message: `Checked ${contracts.length} contract(s), sent ${notificationsSent} notification(s)`,
        contractsChecked: contracts.length,
        notificationsSent
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error: any) {
    console.error('Error in check-rental-2days function:', error);
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
