import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  contractId: string;
  contractNumber: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { contractId, contractNumber }: NotificationRequest = await req.json();

    console.log(`Sending driver submission webhook for contract: ${contractNumber}`);

    // Send webhook to Make.com
    const webhookUrl = 'https://hook.eu2.make.com/mrwzwecoht7kkxzs2w6edejw2e5lhx9b';
    
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contract_id: contractId,
        contract_number: contractNumber,
        event_type: 'driver_submission',
        timestamp: new Date().toISOString(),
      }),
    });

    if (!webhookResponse.ok) {
      console.error('Webhook error:', await webhookResponse.text());
      throw new Error(`Webhook failed with status: ${webhookResponse.status}`);
    }

    console.log('Webhook sent successfully');

    // Create notification log (service role bypasses RLS)
    const { error: logError } = await supabase.from('notification_logs').insert({
      notification_type: 'driver_submission_webhook',
      notification_title: 'Wypełniono formularz kierowców',
      action_description: `Wysłano webhook dla umowy ${contractNumber}`,
      contract_id: contractId,
      contract_number: contractNumber,
      user_id: null, // System action, no specific user
      user_email: null,
      metadata: {
        webhook_url: webhookUrl,
        status: 'success',
      },
    });

    if (logError) {
      console.error('Error creating notification log:', logError);
      // Don't fail the whole request if logging fails
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Webhook sent successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
