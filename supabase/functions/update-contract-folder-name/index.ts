import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FolderUpdateRequest {
  contract_id: string;
  suffix: string; // np. ' [ANULOWANA]'
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: FolderUpdateRequest = await req.json();
    
    if (!requestData.contract_id || !requestData.suffix) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: contract_id and suffix' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Updating folder name for contract:', requestData.contract_id);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Pobierz dane folderu z documents
    const { data: documents, error: fetchError } = await supabase
      .from('documents')
      .select('folder, folder_link')
      .eq('contract_id', requestData.contract_id)
      .limit(1)
      .single();

    if (fetchError || !documents) {
      console.log('No documents/folder found for contract:', requestData.contract_id);
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'No folder to update'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sprawdź czy folder już nie ma tego suffixu
    if (documents.folder && documents.folder.includes(requestData.suffix)) {
      console.log('Folder already has the suffix');
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Folder already has the suffix'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const newFolderName = documents.folder + requestData.suffix;
    
    // Webhook URL do Google Drive - zmiana nazwy folderu na anulowany
    const webhookUrl = 'https://hook.eu2.make.com/gx5h00ers5p2pmfolfj8c6latm9iogvy';

    // Wysyłanie webhooka do Make.com
    if (documents.folder_link) {
      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folder_link: documents.folder_link,
          old_name: documents.folder,
          new_name: newFolderName,
          contract_id: requestData.contract_id,
          timestamp: new Date().toISOString()
        })
      });

      if (!webhookResponse.ok) {
        console.error('Google Drive webhook error:', await webhookResponse.text());
        throw new Error('Failed to update folder name in Google Drive');
      }
    }

    // Zaktualizuj w bazie danych
    const { error: updateError } = await supabase
      .from('documents')
      .update({ folder: newFolderName })
      .eq('contract_id', requestData.contract_id);

    if (updateError) {
      console.error('Error updating folder name in database:', updateError);
      throw updateError;
    }

    console.log('Folder name updated successfully:', newFolderName);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Folder name updated',
        old_name: documents.folder,
        new_name: newFolderName
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
    console.error('Error in update-contract-folder-name function:', error);
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
