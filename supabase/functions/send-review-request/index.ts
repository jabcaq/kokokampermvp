import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationData {
  notification_type: string;
  contract_id: string;
  contract_number: string;
  tenant_email: string;
  tenant_name: string;
  vehicle_model: string;
  timestamp: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting send-review-request function');

    // Get all vehicle returns that need review request sent
    // (deposit refunded and 8+ hours passed, but review not sent yet)
    const eightHoursAgo = new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString();
    
    const { data: returns, error: returnsError } = await supabase
      .from('vehicle_returns')
      .select(`
        id,
        contract_id,
        deposit_refund_timestamp,
        deposit_refunded_cash,
        deposit_refunded_transfer,
        review_request_sent
      `)
      .or('deposit_refunded_cash.eq.true,deposit_refunded_transfer.eq.true')
      .eq('review_request_sent', false)
      .not('deposit_refund_timestamp', 'is', null)
      .lte('deposit_refund_timestamp', eightHoursAgo);

    if (returnsError) {
      console.error('Error fetching returns:', returnsError);
      throw returnsError;
    }

    console.log(`Found ${returns?.length || 0} returns eligible for review request`);

    if (!returns || returns.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No returns eligible for review request' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Process each return
    const results = [];
    for (const returnRecord of returns) {
      try {
        // Get contract details
        const { data: contract, error: contractError } = await supabase
          .from('contracts')
          .select('contract_number, tenant_name, tenant_email, vehicle_model')
          .eq('id', returnRecord.contract_id)
          .single();

        if (contractError || !contract) {
          console.error(`Error fetching contract ${returnRecord.contract_id}:`, contractError);
          continue;
        }

        // Prepare notification data
        const notificationData: NotificationData = {
          notification_type: 'review_request',
          contract_id: returnRecord.contract_id,
          contract_number: contract.contract_number,
          tenant_email: contract.tenant_email || '',
          tenant_name: contract.tenant_name || '',
          vehicle_model: contract.vehicle_model || '',
          timestamp: new Date().toISOString(),
        };

        // Send webhook to Make.com
        const webhookUrl = 'https://hook.eu2.make.com/sl64c2jcq2el9cdeiq6boszjd0upunow';
        
        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(notificationData),
        });

        if (!webhookResponse.ok) {
          console.error(`Webhook failed for contract ${contract.contract_number}:`, await webhookResponse.text());
          continue;
        }

        console.log(`Webhook sent successfully for contract ${contract.contract_number}`);

        // Mark as sent in database
        const { error: updateError } = await supabase
          .from('vehicle_returns')
          .update({ review_request_sent: true })
          .eq('id', returnRecord.id);

        if (updateError) {
          console.error(`Error updating return record ${returnRecord.id}:`, updateError);
          continue;
        }

        // Log notification
        const { data: { user } } = await supabase.auth.getUser();
        
        await supabase
          .from('notification_logs')
          .insert({
            notification_type: 'review_request',
            notification_title: 'Prośba o opinię wysłana',
            action_description: `Wysłano prośbę o opinię do klienta ${contract.tenant_name} dla umowy ${contract.contract_number}`,
            contract_id: returnRecord.contract_id,
            contract_number: contract.contract_number,
            user_id: user?.id || null,
            user_email: user?.email || null,
            metadata: notificationData,
          });

        results.push({
          contract_number: contract.contract_number,
          status: 'success',
        });

      } catch (error) {
        console.error(`Error processing return ${returnRecord.id}:`, error);
        results.push({
          contract_id: returnRecord.contract_id,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Review requests processed',
        results,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Error in send-review-request function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);
