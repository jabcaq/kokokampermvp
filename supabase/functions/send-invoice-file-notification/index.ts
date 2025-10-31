import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
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

    // Upewnij się, że Make.com otrzyma URL możliwy do pobrania (podpisany, jeśli bucket jest prywatny)
    let deliverableUrl = requestData.file_url;
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      if (supabaseUrl && serviceRoleKey && requestData.file_url) {
        const supabase = createClient(supabaseUrl, serviceRoleKey);
        const match = requestData.file_url.match(/\/storage\/v1\/object\/(?:public\/)?([^\/]+)\/(.+)$/);
        if (match) {
          const bucket = match[1];
          const path = match[2];
          const { data: signedData, error: signError } = await supabase
            .storage
            .from(bucket)
            .createSignedUrl(path, 60 * 60 * 24 * 7); // 7 dni
          if (signError) {
            console.warn('Signing error:', (signError as any)?.message ?? signError);
          } else if (signedData?.signedUrl) {
            deliverableUrl = signedData.signedUrl;
          }
        }
      }
    } catch (signErr) {
      console.warn('Failed to create signed URL:', (signErr as any)?.message ?? signErr);
    }

    const payload = {
      ...requestData,
      original_file_url: requestData.file_url,
      file_url: deliverableUrl,
      notification_type: 'invoice_file_uploaded'
    };

    // Wysyłanie webhooka do Make.com z informacją o wgranym pliku faktury
    const webhookResponse = await fetch('https://hook.eu2.make.com/gtbg718kxoqvlwmtdneag7t36blgvghi', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
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
