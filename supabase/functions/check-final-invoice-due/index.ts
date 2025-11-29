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
  end_date: string;
  value: number;
}

interface ContractInvoice {
  id: string;
  invoice_type: string;
  amount: number;
  invoice_file_url: string;
  status: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if this is a test request with specific contract_id
    let contracts = [];
    const requestBody = req.method === 'POST' ? await req.json() : {};
    const testContractId = requestBody?.contract_id;

    if (testContractId) {
      console.log('TEST MODE: Checking specific contract:', testContractId);
      
      // Fetch the specific contract for testing
      const { data: contract, error } = await supabase
        .from('contracts')
        .select('id, contract_number, tenant_name, tenant_email, end_date, value')
        .eq('id', testContractId)
        .eq('is_archived', false)
        .single();

      if (error) {
        console.error('Error fetching test contract:', error);
        throw error;
      }

      contracts = contract ? [contract] : [];
    } else {
      // Production mode: Check contracts ending today
      const today = new Date().toISOString().split('T')[0];
      console.log('PRODUCTION MODE: Checking for contracts ending today (final invoice due):', today);

      // Fetch contracts ending today
      const { data: fetchedContracts, error } = await supabase
        .from('contracts')
        .select('id, contract_number, tenant_name, tenant_email, end_date, value')
        .eq('is_archived', false)
        .eq('status', 'active')
        .gte('end_date', `${today}T00:00:00`)
        .lt('end_date', `${today}T23:59:59`);

      if (error) {
        console.error('Error fetching contracts:', error);
        throw error;
      }

      contracts = fetchedContracts || [];
    }

    if (!contracts || contracts.length === 0) {
      const message = testContractId 
        ? 'Test contract not found or is archived' 
        : 'No contracts ending today';
      console.log(message);
      return new Response(
        JSON.stringify({ 
          message,
          checked: 0
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    let notificationsSent = 0;
    const webhookUrl = 'https://hook.eu2.make.com/g4hbumjfkgenjrv9x4431oslrcyciy72';

    // Process each contract
    for (const contract of contracts as Contract[]) {
      try {
        // Fetch advance invoices (reservation and main_payment types)
        const { data: invoices, error: invoicesError } = await supabase
          .from('contract_invoices')
          .select('id, invoice_type, amount, invoice_file_url, status')
          .eq('contract_id', contract.id)
          .in('invoice_type', ['reservation', 'main_payment'])
          .eq('is_archived', false);

        if (invoicesError) {
          console.error(`Error fetching invoices for contract ${contract.contract_number}:`, invoicesError);
          continue;
        }

        const advanceInvoices = (invoices || []).map((inv: ContractInvoice) => ({
          invoice_id: inv.id,
          invoice_type: inv.invoice_type,
          invoice_type_pl: inv.invoice_type === 'reservation' ? 'Zaliczka' : 'Płatność główna',
          amount: inv.amount,
          status: inv.status,
          has_file: !!inv.invoice_file_url,
        }));

        const totalAdvanceAmount = advanceInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);

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
            end_date: contract.end_date,
            contract_value: contract.value || 0,
            advance_invoices: advanceInvoices,
            total_advance_amount: totalAdvanceAmount,
            final_invoice_amount: (contract.value || 0) - totalAdvanceAmount,
            timestamp: new Date().toISOString(),
          }),
        });

        if (webhookResponse.ok) {
          console.log(`Final invoice reminder sent for contract ${contract.contract_number}`);
          notificationsSent++;
        } else {
          console.error(`Webhook failed for contract ${contract.contract_number}:`, await webhookResponse.text());
        }
      } catch (webhookError) {
        console.error(`Error processing contract ${contract.contract_number}:`, webhookError);
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Final invoice check completed',
        contracts_checked: contracts.length,
        notifications_sent: notificationsSent
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error('Error in check-final-invoice-due function:', error);
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
