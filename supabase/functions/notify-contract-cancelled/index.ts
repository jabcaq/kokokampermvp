import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CancelNotificationRequest {
  contractId: string;
  contractNumber: string;
  tenantName: string;
  cancelledAt: string;
  previousStatus: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: CancelNotificationRequest = await req.json();
    
    console.log('Sending cancellation notification for contract:', requestData.contractNumber);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Webhook URL - placeholder, do uzupełnienia przez użytkownika
    const webhookUrl = 'WEBHOOK_URL_PLACEHOLDER';

    // Wysyłanie webhooka do Make.com (jeśli URL jest skonfigurowany)
    if (webhookUrl !== 'WEBHOOK_URL_PLACEHOLDER') {
      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notification_type: 'contract_cancelled',
          contract_id: requestData.contractId,
          contract_number: requestData.contractNumber,
          tenant_name: requestData.tenantName,
          cancelled_at: requestData.cancelledAt,
          previous_status: requestData.previousStatus,
          timestamp: new Date().toISOString()
        }),
      });

      if (!webhookResponse.ok) {
        console.error('Webhook error:', await webhookResponse.text());
      } else {
        console.log('Webhook sent successfully');
      }
    }

    // Log do notification_logs
    await supabase.from('notification_logs').insert({
      notification_type: 'contract_cancelled',
      notification_title: 'Anulowanie umowy',
      action_description: `Umowa ${requestData.contractNumber} została anulowana (poprzedni status: ${requestData.previousStatus})`,
      contract_id: requestData.contractId,
      contract_number: requestData.contractNumber,
      metadata: {
        tenant_name: requestData.tenantName,
        cancelled_at: requestData.cancelledAt,
        previous_status: requestData.previousStatus
      }
    });

    // Log do historii statusów
    await supabase.from('contract_status_history').insert({
      contract_id: requestData.contractId,
      old_status: requestData.previousStatus,
      new_status: 'cancelled',
      changed_by: 'user',
      notes: 'Anulowanie umowy przez użytkownika'
    });

    console.log('Cancellation notification processed for contract:', requestData.contractNumber);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Powiadomienie o anulowaniu wysłane',
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
    console.error('Error in notify-contract-cancelled function:', error);
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
