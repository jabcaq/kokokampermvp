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
  tenant_email: string;
  start_date: string;
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

    // Check if this is a test request with a specific contract
    const { testContractId } = await req.json().catch(() => ({}));

    // Calculate target date (7 days from now)
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 7);
    const targetDateStr = targetDate.toISOString().split('T')[0];

    console.log('Checking payments due in 7 days:', targetDateStr);

    // Fetch contracts (either specific test contract or all active contracts)
    let query = supabase
      .from('contracts')
      .select('id, contract_number, tenant_name, tenant_email, start_date, payments')
      .eq('is_archived', false);

    if (testContractId) {
      // Test mode: check specific contract regardless of date
      console.log('Test mode: checking contract', testContractId);
      query = query.eq('id', testContractId);
    } else {
      // Production mode: check active/pending contracts
      query = query.in('status', ['pending', 'active']);
    }

    const { data: contracts, error } = await query;

    if (error) {
      console.error('Error fetching contracts:', error);
      throw error;
    }

    if (!contracts || contracts.length === 0) {
      console.log('No contracts found');
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

    let notificationsSent = 0;
    const webhookUrl = 'https://hook.eu2.make.com/y6p65n7fg253wq5j1y0ryqxra1hsibxo';

    // Check each contract for payments due in 7 days
    for (const contract of contracts as Contract[]) {
      try {
        const payments = contract.payments || {};
        
        // Check reservation payment (zaliczka)
        if (payments.zaliczka?.termin) {
          const paymentDate = new Date(payments.zaliczka.termin).toISOString().split('T')[0];
          // In test mode, send notification regardless of date; in production, check if date matches
          if (testContractId || paymentDate === targetDateStr) {
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
                payment_type: 'reservation',
                payment_type_pl: 'Opłata rezerwacyjna',
                payment_amount: payments.zaliczka.wysokosc || 0,
                payment_due_date: payments.zaliczka.termin,
                contract_link: `/contracts/${contract.id}`,
                days_before: 7,
                timestamp: new Date().toISOString(),
              }),
            });

            if (webhookResponse.ok) {
              console.log(`Payment reminder sent for reservation payment - contract ${contract.contract_number}`);
              notificationsSent++;
            }
          }
        }

        // Check main payment (zasadnicza)
        if (payments.zasadnicza?.termin) {
          const paymentDate = new Date(payments.zasadnicza.termin).toISOString().split('T')[0];
          // In test mode, send notification regardless of date; in production, check if date matches
          if (testContractId || paymentDate === targetDateStr) {
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
                payment_type: 'main_payment',
                payment_type_pl: 'Płatność zasadnicza',
                payment_amount: payments.zasadnicza.wysokosc || 0,
                payment_due_date: payments.zasadnicza.termin,
                contract_link: `/contracts/${contract.id}`,
                days_before: 7,
                timestamp: new Date().toISOString(),
              }),
            });

            if (webhookResponse.ok) {
              console.log(`Payment reminder sent for main payment - contract ${contract.contract_number}`);
              notificationsSent++;
            }
          }
        }
      } catch (webhookError) {
        console.error(`Error processing contract ${contract.contract_number}:`, webhookError);
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Payment due check completed',
        contracts_checked: contracts.length,
        notifications_sent: notificationsSent
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error('Error in check-payment-due-7days function:', error);
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
