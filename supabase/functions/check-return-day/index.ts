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
    console.log('Starting check-return-day function...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    console.log('Checking for returns on:', todayStr);

    // Fetch all contracts ending today
    const { data: contracts, error: contractsError } = await supabase
      .from('contracts')
      .select('*')
      .gte('end_date', `${todayStr}T00:00:00`)
      .lt('end_date', `${todayStr}T23:59:59`)
      .not('is_archived', 'eq', true)
      .in('status', ['pending', 'active']);

    if (contractsError) {
      console.error('Error fetching contracts:', contractsError);
      throw contractsError;
    }

    if (!contracts || contracts.length === 0) {
      console.log('No contracts ending today');
      return new Response(
        JSON.stringify({ message: 'No contracts ending today', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    console.log(`Found ${contracts.length} contracts ending today`);

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
      notification_type: 'return_day',
    }));

    // Send to webhook
    const webhookUrl = 'https://hook.eu2.make.com/rhqdyg51l54f3put8ssxxhy5s7u02ba9';
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        date: todayStr,
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
      notification_type: 'return_day',
      notification_title: 'Powiadomienia o zwrotach w dniu dzisiejszym',
      action_description: `Wysłano powiadomienie dla ${contracts.length} umów kończących się dzisiaj`,
      metadata: { date: todayStr, count: contracts.length },
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
    console.error('Error in check-return-day function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
