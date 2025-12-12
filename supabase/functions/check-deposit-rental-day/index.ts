import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Contract {
  id: string;
  contract_number: string;
  tenant_name: string;
  tenant_email: string | null;
  tenant_phone: string | null;
  start_date: string;
  end_date: string;
  deposit_received: boolean;
  deposit_received_at: string | null;
  payments: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting check-deposit-rental-day function');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get current time in Polish timezone (Europe/Warsaw)
    const now = new Date();
    const polandTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Warsaw' }));
    
    // Get today's date range in Poland
    const todayStart = new Date(polandTime);
    todayStart.setHours(0, 0, 0, 0);
    
    const todayEnd = new Date(polandTime);
    todayEnd.setHours(23, 59, 59, 999);

    console.log('Checking for contracts starting today in Poland:', todayStart.toISOString());

    // Find contracts that:
    // 1. Start today
    // 2. Have deposit received
    // 3. Are not archived
    // 4. Are pending or active
    // 5. End date has not passed (contract is still valid)
    const { data: contracts, error } = await supabase
      .from('contracts')
      .select('id, contract_number, tenant_name, tenant_email, tenant_phone, start_date, end_date, deposit_received, deposit_received_at, payments')
      .gte('start_date', todayStart.toISOString())
      .lte('start_date', todayEnd.toISOString())
      .gte('end_date', todayStart.toISOString()) // Exclude contracts that have already ended
      .eq('deposit_received', true)
      .eq('is_archived', false)
      .in('status', ['pending', 'active']);

    if (error) {
      console.error('Error fetching contracts:', error);
      throw error;
    }

    console.log(`Found ${contracts?.length || 0} contracts with paid deposit starting today`);

    if (!contracts || contracts.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No contracts with paid deposit starting today',
          checkedAt: polandTime.toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let sentCount = 0;

    // Send webhook for each contract
    for (const contract of contracts) {
      console.log(`Sending deposit notification for contract: ${contract.contract_number}`);

      const depositAmount = contract.payments?.kaucja?.wysokosc || 0;

      try {
        // Send webhook to Make.com
        const webhookResponse = await fetch('https://hook.eu2.make.com/8lb97jeybom44bgvdx8c5jsf2976yeex', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            notification_type: 'deposit_paid_rental_day',
            contract_id: contract.id,
            contract_number: contract.contract_number,
            tenant_name: contract.tenant_name,
            tenant_email: contract.tenant_email,
            tenant_phone: contract.tenant_phone,
            start_date: contract.start_date,
            end_date: contract.end_date,
            deposit_amount: depositAmount,
            deposit_received_at: contract.deposit_received_at,
            timestamp: new Date().toISOString(),
            poland_time: polandTime.toISOString()
          }),
        });

        if (!webhookResponse.ok) {
          console.error(`Webhook error for contract ${contract.contract_number}:`, await webhookResponse.text());
          continue;
        }

        sentCount++;

        // Log notification
        await supabase.from('notification_logs').insert({
          notification_type: 'deposit_paid_rental_day',
          notification_title: 'Powiadomienie o wpłaconej kaucji',
          action_description: `Powiadomienie wysłane dla umowy ${contract.contract_number} - kaucja wpłacona, wynajem rozpoczyna się dzisiaj`,
          contract_id: contract.id,
          contract_number: contract.contract_number,
          metadata: {
            tenant_name: contract.tenant_name,
            deposit_amount: depositAmount,
            poland_time: polandTime.toISOString()
          }
        });

        console.log(`Successfully sent notification for contract: ${contract.contract_number}`);
      } catch (webhookError) {
        console.error(`Error sending webhook for contract ${contract.contract_number}:`, webhookError);
      }
    }

    return new Response(
      JSON.stringify({ 
        message: `Checked ${contracts.length} contracts, sent ${sentCount} notifications`,
        contracts: contracts.map(c => ({
          number: c.contract_number,
          tenant: c.tenant_name
        })),
        checkedAt: polandTime.toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in check-deposit-rental-day function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
