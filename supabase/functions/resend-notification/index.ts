import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mapowanie typów powiadomień do webhooków
const webhookMapping: Record<string, string> = {
  deposit_received: 'https://hook.eu2.make.com/hg6o7ehx1b6nar2xsshlpmqkkkf11fkp',
  deposit_notification: 'https://hook.eu2.make.com/hg6o7ehx1b6nar2xsshlpmqkkkf11fkp',
  contract_active: 'https://hook.eu2.make.com/h6d7ee9fb114su7n7hz3x8w5h4mfjr3b',
  payment_reminder: 'https://hook.eu2.make.com/y6p65n7fg253wq5j1y0ryqxra1hsibxo',
  payment_overdue: 'https://hook.eu2.make.com/qnvmpalrn8bhuz7qjon7cknhzw7yz4mq',
  final_invoice_due: 'https://hook.eu2.make.com/g4hbumjfkgenjrv9x4431oslrcyciy72',
};

interface ResendRequest {
  notification_type: string;
  notification_title: string;
  action_description: string;
  contract_id?: string;
  contract_number?: string;
  inquiry_id?: string;
  inquiry_number?: string;
  metadata?: any;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: ResendRequest = await req.json();
    
    console.log('Resending notification:', requestData.notification_type);
    console.log('Notification data:', JSON.stringify(requestData));

    const webhookUrl = webhookMapping[requestData.notification_type];
    
    if (!webhookUrl) {
      console.log('No webhook configured for notification type:', requestData.notification_type);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `Brak skonfigurowanego webhooka dla typu: ${requestData.notification_type}`,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Przygotowanie payloadu w zależności od typu
    let payload: any = {
      notification_type: requestData.notification_type,
      contract_id: requestData.contract_id,
      contract_number: requestData.contract_number,
      timestamp: new Date().toISOString(),
      resent: true,
    };

    // Dodaj metadata jeśli istnieją
    if (requestData.metadata) {
      payload = { ...payload, ...requestData.metadata };
    }

    // Dodatkowe pola w zależności od typu
    if (requestData.contract_id) {
      payload.contract_link = `https://app.kokokamper.pl/contracts/${requestData.contract_id}`;
      payload.invoice_upload_link = `https://app.kokokamper.pl/contracts/${requestData.contract_id}`;
    }

    console.log('Sending to webhook:', webhookUrl);
    console.log('Payload:', JSON.stringify(payload));

    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      console.error('Webhook error:', errorText);
      throw new Error(`Webhook failed with status: ${webhookResponse.status}`);
    }

    console.log('Notification resent successfully:', requestData.notification_type);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Powiadomienie wysłane ponownie',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error('Error in resend-notification function:', error);
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
