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

    // Calculate date 5 days from now (not accounting moment, just rental start check)
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 5);
    targetDate.setHours(0, 0, 0, 0);
    
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    console.log('Checking contracts starting on (5 days ahead):', targetDate.toISOString());

    // Fetch contracts starting in 5 days where deposit is not received
    const { data: contracts, error } = await supabase
      .from('contracts')
      .select('id, contract_number, tenant_name, start_date, deposit_received, payments')
      .gte('start_date', targetDate.toISOString())
      .lt('start_date', nextDay.toISOString())
      .eq('deposit_received', false)
      .eq('is_archived', false)
      .in('status', ['pending', 'active']);

    if (error) {
      console.error('Error fetching contracts:', error);
      throw error;
    }

    if (!contracts || contracts.length === 0) {
      console.log('No contracts found with unreceived deposits starting in 5 days');
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

    console.log(`Found ${contracts.length} contract(s) with unreceived deposits (5 days ahead)`);

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
            days_before: 5,
            timestamp: new Date().toISOString(),
          }),
        });

        if (!webhookResponse.ok) {
          console.error(`Webhook failed for contract ${contract.contract_number}:`, await webhookResponse.text());
        } else {
          console.log(`Webhook sent successfully for contract ${contract.contract_number} (5 days before)`);
          notificationsSent++;
        }
      } catch (webhookError) {
        console.error(`Error sending webhook for contract ${contract.contract_number}:`, webhookError);
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Deposit check completed (5 days before)',
        contracts_checked: contracts.length,
        notifications_sent: notificationsSent
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error('Error in check-deposit-5days function:', error);
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
