import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DepositUpdateRequest {
  contract_id: string;
  deposit_received: boolean;
  telegram_user?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: DepositUpdateRequest = await req.json();
    
    // Walidacja
    if (!requestData.contract_id || requestData.deposit_received === undefined) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: contract_id and deposit_received' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Telegram deposit update:', requestData);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Pobierz dane umowy
    const { data: contract, error: fetchError } = await supabase
      .from('contracts')
      .select('contract_number, tenant_name, payments, status')
      .eq('id', requestData.contract_id)
      .single();

    if (fetchError || !contract) {
      console.error('Error fetching contract:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Contract not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Aktualizuj kaucję
    const updateData: any = {
      deposit_received: requestData.deposit_received
    };

    if (requestData.deposit_received) {
      updateData.deposit_received_at = new Date().toISOString();
    } else {
      updateData.deposit_received_at = null;
    }

    const { error: updateError } = await supabase
      .from('contracts')
      .update(updateData)
      .eq('id', requestData.contract_id);

    if (updateError) {
      console.error('Error updating contract:', updateError);
      throw updateError;
    }

    // Jeśli kaucja wpłacona - wyślij powiadomienie
    if (requestData.deposit_received) {
      const depositAmount = contract?.payments?.kaucja?.wysokosc || 0;
      
      // Webhook do Make.com - używamy istniejącego endpointu
      try {
        await fetch('https://hook.eu2.make.com/8lb97jeybom44bgvdx8c5jsf2976yeex', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            notification_type: 'deposit_received',
            contract_id: requestData.contract_id,
            contract_number: contract.contract_number,
            tenant_name: contract.tenant_name,
            deposit_amount: depositAmount,
            marked_by: 'telegram',
            telegram_user: requestData.telegram_user || 'unknown',
            timestamp: new Date().toISOString()
          })
        });
      } catch (webhookError) {
        console.error('Webhook error:', webhookError);
        // Nie przerywamy - kontynuujemy mimo błędu webhooka
      }
      
      // Log
      await supabase.from('notification_logs').insert({
        notification_type: 'deposit_received',
        notification_title: 'Kaucja przyjęta przez Telegram',
        action_description: `Kaucja dla umowy ${contract.contract_number} oznaczona jako wpłacona przez użytkownika Telegram: ${requestData.telegram_user || 'unknown'}`,
        contract_id: requestData.contract_id,
        contract_number: contract.contract_number,
        metadata: {
          telegram_user: requestData.telegram_user,
          deposit_amount: depositAmount
        }
      });

      console.log('Deposit marked as received via Telegram for contract:', contract.contract_number);
    } else {
      // Log odznaczenia kaucji
      await supabase.from('notification_logs').insert({
        notification_type: 'deposit_status_change',
        notification_title: 'Kaucja odznaczona przez Telegram',
        action_description: `Kaucja dla umowy ${contract.contract_number} została odznaczona przez użytkownika Telegram: ${requestData.telegram_user || 'unknown'}`,
        contract_id: requestData.contract_id,
        contract_number: contract.contract_number,
        metadata: {
          telegram_user: requestData.telegram_user
        }
      });

      console.log('Deposit unmarked via Telegram for contract:', contract.contract_number);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: requestData.deposit_received ? 'Kaucja oznaczona jako wpłacona' : 'Kaucja odznaczona',
        contract_number: contract.contract_number,
        new_status: contract.status === 'pending' && requestData.deposit_received ? 'active (automatycznie)' : contract.status
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
    console.error('Error in telegram-update-deposit function:', error);
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
