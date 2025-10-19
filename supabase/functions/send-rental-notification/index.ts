import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  notification_type: string;
  rental_date: string;
  contracts_count: number;
  contracts: any[];
  timestamp: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: NotificationRequest = await req.json();
    
    console.log('Sending rental notification:', {
      type: requestData.notification_type,
      date: requestData.rental_date,
      count: requestData.contracts_count
    });

    // Określ właściwy webhook URL na podstawie typu powiadomienia
    let webhookUrl = '';
    
    if (requestData.notification_type === 'rental_starting_3_days') {
      webhookUrl = 'https://hook.eu2.make.com/luarjrss1fx7b39bmr12fpkinx61sesk';
    } else if (requestData.notification_type === 'rental_starting_2_days') {
      webhookUrl = 'https://hook.eu2.make.com/g28f6wb4s5xyiul9kx82ydqgcpgkxxl2';
    } else {
      throw new Error(`Unknown notification type: ${requestData.notification_type}`);
    }

    // Wysyłanie webhooka do Make.com
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      console.error('Webhook error:', errorText);
      
      // Zwróć sukces mimo błędu webhooka, ale z informacją o problemie
      return new Response(
        JSON.stringify({ 
          success: true,
          warning: `Webhook returned status ${webhookResponse.status}. The webhook might not be active in Make.com.`,
          message: 'Notification attempted but webhook might not be configured',
          notification_type: requestData.notification_type,
          contracts_count: requestData.contracts_count
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    console.log('Notification sent successfully:', requestData.notification_type);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Notification sent successfully',
        notification_type: requestData.notification_type,
        contracts_count: requestData.contracts_count
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
    console.error('Error in send-rental-notification function:', error);
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
