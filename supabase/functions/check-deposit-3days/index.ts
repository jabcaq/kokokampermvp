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
  start_date: string;
  deposit_received: boolean;
  payments: any;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate target date (3 days from now)
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 3);
    const targetDateStr = targetDate.toISOString().split('T')[0];

    console.log('Checking contracts starting in 3 days (date only):', targetDateStr);

    // Fetch contracts starting in 3 days where deposit is not received
    // IMPORTANT: Also check that end_date has not passed (contract is still valid)
    const { data: contracts, error } = await supabase
      .from('contracts')
      .select('id, contract_number, tenant_name, start_date, deposit_received, payments')
      .eq('deposit_received', false)
      .eq('is_archived', false)
      .in('status', ['pending', 'active'])
      .gte('end_date', `${todayStr}T00:00:00`) // Exclude contracts that have already ended
      .filter('start_date', 'gte', `${targetDateStr}T00:00:00`)
      .filter('start_date', 'lt', `${targetDateStr}T23:59:59`);

    if (error) {
      console.error('Error fetching contracts:', error);
      throw error;
    }

    if (!contracts || contracts.length === 0) {
      console.log('No contracts found with unreceived deposits starting in 3 days');
      return new Response(
        JSON.stringify({ 
          message: 'No contracts found',
          checked: 0
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    console.log(`Found ${contracts.length} contract(s) with unreceived deposits`);

    let notificationsSent = 0;

    // Send webhook notification for each contract
    for (const contract of contracts as Contract[]) {
      try {
        const depositAmount = contract.payments?.kaucja?.wysokosc || 0;

        const webhookResponse = await fetch('https://hook.eu2.make.com/l85qhj1o29x7ie0kp4t83277i15l4f1b', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contract_id: contract.id,
            contract_number: contract.contract_number,
            tenant_name: contract.tenant_name,
            deposit_amount: depositAmount,
            start_date: contract.start_date,
            days_before: 3,
            timestamp: new Date().toISOString(),
          }),
        });

        if (!webhookResponse.ok) {
          console.error(`Webhook failed for contract ${contract.contract_number}:`, await webhookResponse.text());
        } else {
          console.log(`Webhook sent successfully for contract ${contract.contract_number}`);
          notificationsSent++;
        }
      } catch (webhookError) {
        console.error(`Error sending webhook for contract ${contract.contract_number}:`, webhookError);
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Deposit check completed',
        contracts_checked: contracts.length,
        notifications_sent: notificationsSent
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error('Error in check-deposit-3days function:', error);
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
