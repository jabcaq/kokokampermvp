import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InvoiceFileNotification {
  invoice_id: string;
  contract_id: string;
  contract_number: string;
  tenant_name: string;
  invoice_type: string;
  amount: number;
  file_url: string;
  file_name: string;
  file_type: string;
  uploaded_at: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: InvoiceFileNotification = await req.json();
    
    console.log('Sending invoice file notification for invoice:', requestData.invoice_id);

    // Wysyłanie webhooka do Make.com z informacją o wgranym pliku faktury
    const webhookResponse = await fetch('https://hook.eu2.make.com/sp68wiwihrnr7gqcu83rsbchtmy4s82y', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...requestData,
        notification_type: 'invoice_file_uploaded'
      }),
    });

    if (!webhookResponse.ok) {
      console.error('Webhook error:', await webhookResponse.text());
      throw new Error(`Webhook failed with status: ${webhookResponse.status}`);
    }

    console.log('Invoice file notification sent successfully for invoice:', requestData.invoice_id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Powiadomienie o pliku faktury zostało wysłane',
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
    console.error('Error in send-invoice-file-notification function:', error);
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
