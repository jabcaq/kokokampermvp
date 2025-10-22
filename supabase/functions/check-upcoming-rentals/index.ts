import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting check for upcoming rentals (3 days before start)');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Calculate the date 3 days from now (Warsaw timezone)
    const now = new Date();
    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    
    // Get start and end of that day in Warsaw time
    const startOfDay = new Date(threeDaysFromNow);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(threeDaysFromNow);
    endOfDay.setHours(23, 59, 59, 999);

    console.log('Checking for contracts starting between:', startOfDay.toISOString(), 'and', endOfDay.toISOString());

    // Find contracts starting in 3 days
    const { data: contracts, error } = await supabase
      .from('contracts')
      .select('*')
      .gte('start_date', startOfDay.toISOString())
      .lte('start_date', endOfDay.toISOString())
      .neq('status', 'cancelled');

    if (error) {
      console.error('Error fetching contracts:', error);
      throw error;
    }

    console.log(`Found ${contracts?.length || 0} contracts starting in 3 days`);

    if (!contracts || contracts.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No upcoming rentals found',
          contracts_checked: 0
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    // Send webhook notification for each contract
    const webhookUrl = 'https://hook.eu2.make.com/h6d7ee9fb114su7n7hz3x8w5h4mfjr3b';
    const results = [];

    for (const contract of contracts) {
      try {
        console.log('Sending 3-day reminder for contract:', contract.contract_number);

        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            notification_type: 'upcoming_rental_3days',
            contract_id: contract.id,
            contract_number: contract.contract_number,
            tenant_name: contract.tenant_name,
            tenant_email: contract.tenant_email,
            tenant_phone: contract.tenant_phone,
            vehicle_model: contract.vehicle_model,
            registration_number: contract.registration_number,
            start_date: contract.start_date,
            end_date: contract.end_date,
            contract_value: contract.value,
            contract_link: `https://app.kokokamper.pl/contracts/${contract.id}`,
            timestamp: new Date().toISOString(),
            days_until_rental: 3
          }),
        });

        if (!webhookResponse.ok) {
          console.error('Webhook error for contract', contract.contract_number, ':', await webhookResponse.text());
          results.push({ contract_number: contract.contract_number, success: false });
        } else {
          console.log('Webhook sent successfully for contract:', contract.contract_number);
          
          // Create notification in the database
          await supabase
            .from('notifications')
            .insert({
              type: 'upcoming_rental_3days',
              title: 'Nadchodzący wynajem za 3 dni',
              message: `Wynajem ${contract.contract_number} - ${contract.tenant_name || 'Klient'} rozpoczyna się za 3 dni (${new Date(contract.start_date).toLocaleDateString('pl-PL')})`,
              link: `/contracts/${contract.id}`
            });

          // Log the notification
          await supabase
            .from('notification_logs')
            .insert({
              notification_type: 'upcoming_rental_3days',
              notification_title: 'Nadchodzący wynajem za 3 dni',
              action_description: `Automatyczne powiadomienie o nadchodzącym wynajmie dla kontraktu ${contract.contract_number}`,
              contract_id: contract.id,
              contract_number: contract.contract_number,
              metadata: { 
                automatic: true, 
                days_before: 3,
                start_date: contract.start_date,
                webhook_sent: true
              }
            });

          results.push({ contract_number: contract.contract_number, success: true });
        }
      } catch (error: any) {
        console.error('Error processing contract', contract.contract_number, ':', error);
        results.push({ contract_number: contract.contract_number, success: false, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`Processed ${contracts.length} contracts, ${successCount} successful`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${contracts.length} upcoming rentals`,
        contracts_checked: contracts.length,
        notifications_sent: successCount,
        results
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error('Error in check-upcoming-rentals function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);
