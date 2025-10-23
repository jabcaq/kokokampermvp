import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Calculate date range for 30 days from now
    const now = new Date();
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + 30);
    targetDate.setHours(0, 0, 0, 0);
    
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    console.log('Checking for inspections expiring in 30 days:', {
      from: targetDate.toISOString().split('T')[0],
      to: nextDay.toISOString().split('T')[0]
    });

    // Fetch vehicles with inspection expiring in 30 days
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .select('*')
      .not('next_inspection_date', 'is', null)
      .gte('next_inspection_date', targetDate.toISOString().split('T')[0])
      .lt('next_inspection_date', nextDay.toISOString().split('T')[0]);

    if (vehiclesError) {
      console.error('Error fetching vehicles:', vehiclesError);
      throw vehiclesError;
    }

    if (!vehicles || vehicles.length === 0) {
      console.log('No vehicles found with inspection expiring in 30 days');
      return new Response(
        JSON.stringify({ message: 'No vehicles found', count: 0 }),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    console.log(`Found ${vehicles.length} vehicle(s) with inspection expiring in 30 days`);

    let notificationsSent = 0;

    for (const vehicle of vehicles) {
      try {
        console.log(`Processing vehicle: ${vehicle.registration_number}`);

        // Send webhook to Make.com for inspection expiry
        const webhookUrl = 'https://hook.eu2.make.com/5r9d2qp3aruuoe3qgk4kpbr67oa0hdzj';
        
        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            vehicle_id: vehicle.id,
            vehicle_model: vehicle.model,
            registration_number: vehicle.registration_number,
            next_inspection_date: vehicle.next_inspection_date,
            notification_type: 'inspection_expiring',
            days_until_expiry: 30,
            timestamp: new Date().toISOString()
          }),
        });

        if (!webhookResponse.ok) {
          console.error(`Webhook failed for vehicle ${vehicle.registration_number}:`, await webhookResponse.text());
          continue;
        }

        console.log(`Webhook sent successfully for vehicle: ${vehicle.registration_number}`);

        // Create notification in database
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            type: 'inspection_expiring',
            title: 'Wygasający przegląd techniczny',
            message: `Przegląd pojazdu ${vehicle.registration_number} (${vehicle.model}) wygasa za 30 dni (${new Date(vehicle.next_inspection_date).toLocaleDateString('pl-PL')})`,
            link: `/fleet/${vehicle.id}`
          });

        if (notificationError) {
          console.error('Error creating notification:', notificationError);
        }

        // Log the notification
        const { error: logError } = await supabase
          .from('notification_logs')
          .insert({
            notification_type: 'inspection_expiring',
            notification_title: 'Wygasający przegląd techniczny',
            action_description: `Wysłano powiadomienie o wygasającym przeglądzie dla pojazdu ${vehicle.registration_number}`,
            metadata: {
              vehicle_id: vehicle.id,
              vehicle_model: vehicle.model,
              registration_number: vehicle.registration_number,
              next_inspection_date: vehicle.next_inspection_date,
              days_until_expiry: 30
            }
          });

        if (logError) {
          console.error('Error logging notification:', logError);
        }

        notificationsSent++;
      } catch (error) {
        console.error(`Error processing vehicle ${vehicle.registration_number}:`, error);
      }
    }

    return new Response(
      JSON.stringify({ 
        message: `Checked ${vehicles.length} vehicle(s), sent ${notificationsSent} notification(s)`,
        vehiclesChecked: vehicles.length,
        notificationsSent
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error: any) {
    console.error('Error in check-expiring-inspection function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
};

serve(handler);
