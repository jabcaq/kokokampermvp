import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DepositNotificationRequest {
  contract_id: string;
  contract_number: string;
  tenant_name: string;
  timestamp: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: DepositNotificationRequest = await req.json();
    
    console.log('Sending deposit notification for contract:', requestData.contract_number);

    // Webhook do Make.com dla powiadomienia o kaucji
    const webhookResponse = await fetch('https://hook.eu2.make.com/8lb97jeybom44bgvdx8c5jsf2976yeex', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        notification_type: 'deposit_received',
        contract_id: requestData.contract_id,
        contract_number: requestData.contract_number,
        tenant_name: requestData.tenant_name,
        timestamp: requestData.timestamp,
      }),
    });

    if (!webhookResponse.ok) {
      console.error('Webhook error:', await webhookResponse.text());
      throw new Error(`Webhook failed with status: ${webhookResponse.status}`);
    }

    console.log('Deposit notification sent successfully for contract:', requestData.contract_number);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Wysłano powiadomienie o kaucji',
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
    console.error('Error in send-deposit-notification function:', error);
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
