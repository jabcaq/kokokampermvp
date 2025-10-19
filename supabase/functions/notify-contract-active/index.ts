import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotifyRequest {
  contractId: string;
  contractNumber: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contractId, contractNumber }: NotifyRequest = await req.json();
    
    console.log('Sending webhook notification for contract:', contractNumber);

    // Link do wgrania faktur
    const invoiceUploadLink = `https://app.kokokamper.pl/contracts/${contractId}`;

    // Wysyłanie webhooka do Make.com
    const webhookResponse = await fetch('https://hook.eu2.make.com/h6d7ee9fb114su7n7hz3x8w5h4mfjr3b', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contract_id: contractId,
        contract_number: contractNumber,
        invoice_upload_link: invoiceUploadLink,
        timestamp: new Date().toISOString(),
        status: 'active'
      }),
    });

    if (!webhookResponse.ok) {
      console.error('Webhook error:', await webhookResponse.text());
      throw new Error(`Webhook failed with status: ${webhookResponse.status}`);
    }

    console.log('Webhook sent successfully for contract:', contractNumber);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Webhook notification sent successfully',
        invoiceUploadLink 
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
    console.error('Error in notify-contract-active function:', error);
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