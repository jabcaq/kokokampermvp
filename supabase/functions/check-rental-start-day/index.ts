import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting check-rental-start-day function');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get today's date
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    console.log('Checking for contracts starting today (date only):', todayStr);

    // Find all pending contracts that start today using DATE comparison
    const { data: contracts, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('status', 'pending')
      .eq('is_archived', false)
      .filter('start_date', 'gte', `${todayStr}T00:00:00`)
      .filter('start_date', 'lt', `${todayStr}T23:59:59`);

    if (error) {
      console.error('Error fetching contracts:', error);
      throw error;
    }

    console.log(`Found ${contracts?.length || 0} contracts to activate`);

    if (!contracts || contracts.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No contracts to activate today' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process each contract
    for (const contract of contracts) {
      console.log(`Activating contract: ${contract.contract_number}`);

      // Update contract status to active
      const { error: updateError } = await supabase
        .from('contracts')
        .update({ status: 'active' })
        .eq('id', contract.id);

      if (updateError) {
        console.error(`Error updating contract ${contract.contract_number}:`, updateError);
        continue;
      }

      // Log status change
      await supabase.from('contract_status_history').insert({
        contract_id: contract.id,
        old_status: 'pending',
        new_status: 'active',
        changed_by: 'system_date',
        notes: 'Automatyczna aktywacja w dniu rozpoczęcia wynajmu'
      });

      // Send notification to Make.com
      try {
        const { error: invokeError } = await supabase.functions.invoke('notify-contract-active', {
          body: {
            contractId: contract.id,
            contractNumber: contract.contract_number
          }
        });

        if (invokeError) {
          console.error(`Error invoking notify-contract-active for ${contract.contract_number}:`, invokeError);
        }
      } catch (invokeErr) {
        console.error('Error calling notify-contract-active:', invokeErr);
      }

      // Log notification
      await supabase.from('notification_logs').insert({
        notification_type: 'status_auto_change',
        notification_title: 'Automatyczna aktywacja umowy',
        action_description: `Umowa ${contract.contract_number} automatycznie aktywowana w dniu rozpoczęcia wynajmu`,
        contract_id: contract.id,
        contract_number: contract.contract_number
      });

      console.log(`Successfully activated contract: ${contract.contract_number}`);
    }

    return new Response(
      JSON.stringify({ 
        message: `Successfully activated ${contracts.length} contract(s)`,
        contracts: contracts.map(c => c.contract_number)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in check-rental-start-day function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
