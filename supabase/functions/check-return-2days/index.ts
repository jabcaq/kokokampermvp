import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting check-return-2days function...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get date 2 days from now (3 days before return)
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 2);
    const targetDateStr = targetDate.toISOString().split('T')[0];
    console.log('Checking for returns on:', targetDateStr);

    // Fetch all contracts ending in 2 days
    const { data: contracts, error: contractsError } = await supabase
      .from('contracts')
      .select('*')
      .gte('end_date', `${targetDateStr}T00:00:00`)
      .lt('end_date', `${targetDateStr}T23:59:59`)
      .not('is_archived', 'eq', true);

    if (contractsError) {
      console.error('Error fetching contracts:', contractsError);
      throw contractsError;
    }

    if (!contracts || contracts.length === 0) {
      console.log('No contracts ending in 2 days');
      return new Response(
        JSON.stringify({ message: 'No contracts ending in 2 days', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log(`Found ${contracts.length} contracts ending in 2 days`);

    // Prepare bundles for webhook
    const bundles = contracts.map((contract) => ({
      contract_id: contract.id,
      contract_number: contract.contract_number,
      tenant_name: contract.tenant_name,
      tenant_email: contract.tenant_email,
      tenant_phone: contract.tenant_phone,
      vehicle_model: contract.vehicle_model,
      registration_number: contract.registration_number,
      scheduled_return_date: contract.end_date,
      notification_type: 'return_2days_prior',
    }));

    // Send to webhook
    const webhookUrl = 'https://hook.eu2.make.com/zc6xrwhlvuzpx1h1vqxc0ipzls6g8khm';
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        date: targetDateStr,
        bundles: bundles,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!webhookResponse.ok) {
      console.error('Webhook failed:', await webhookResponse.text());
      throw new Error('Failed to send webhook notification');
    }

    console.log('Successfully sent notification for', contracts.length, 'contracts');

    // Create notification log
    await supabase.from('notification_logs').insert({
      notification_type: 'return_2days_prior',
      notification_title: 'Powiadomienia o zwrotach za 3 dni',
      action_description: `Wysłano powiadomienie dla ${contracts.length} umów kończących się za 3 dni`,
      metadata: { date: targetDateStr, count: contracts.length },
    });

    return new Response(
      JSON.stringify({ 
        message: 'Notification sent successfully', 
        count: contracts.length,
        contracts: bundles 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error in check-return-2days function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
