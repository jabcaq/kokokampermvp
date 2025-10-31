import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting client synchronization from contracts...');

    // Pobierz wszystkie umowy z client_id
    const { data: contracts, error: contractsError } = await supabase
      .from('contracts')
      .select('*')
      .not('client_id', 'is', null);

    if (contractsError) {
      throw contractsError;
    }

    console.log(`Found ${contracts?.length || 0} contracts to process`);

    let updatedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    // Dla każdej umowy zaktualizuj dane klienta
    for (const contract of contracts || []) {
      try {
        const clientUpdates: any = {};

        // Podstawowe dane kontaktowe
        if (contract.tenant_name) clientUpdates.name = contract.tenant_name;
        if (contract.tenant_email) clientUpdates.email = contract.tenant_email;
        if (contract.tenant_phone) clientUpdates.phone = contract.tenant_phone;
        if (contract.tenant_address) clientUpdates.address = contract.tenant_address;

        // Dokumenty tożsamości
        if (contract.tenant_id_type) clientUpdates.id_type = contract.tenant_id_type;
        if (contract.tenant_id_number) clientUpdates.id_number = contract.tenant_id_number;
        if (contract.tenant_id_issuer) clientUpdates.id_issuer = contract.tenant_id_issuer;
        if (contract.tenant_pesel) clientUpdates.pesel = contract.tenant_pesel;
        if (contract.tenant_nip) clientUpdates.nip = contract.tenant_nip;

        // Prawo jazdy
        if (contract.tenant_license_number) clientUpdates.license_number = contract.tenant_license_number;
        if (contract.tenant_license_category) clientUpdates.license_category = contract.tenant_license_category;
        if (contract.tenant_license_date) clientUpdates.license_date = contract.tenant_license_date;
        if (contract.tenant_trailer_license_category) clientUpdates.trailer_license_category = contract.tenant_trailer_license_category;

        // Dane firmowe
        if (contract.tenant_company_name) clientUpdates.company_name = contract.tenant_company_name;

        // Aktualizuj tylko jeśli są jakieś dane do zaktualizowania
        if (Object.keys(clientUpdates).length > 0) {
          const { error: updateError } = await supabase
            .from('clients')
            .update(clientUpdates)
            .eq('id', contract.client_id);

          if (updateError) {
            errors.push(`Contract ${contract.contract_number}: ${updateError.message}`);
            console.error(`Error updating client for contract ${contract.contract_number}:`, updateError);
          } else {
            updatedCount++;
            console.log(`Updated client for contract ${contract.contract_number}`);
          }
        } else {
          skippedCount++;
          console.log(`No data to update for contract ${contract.contract_number}`);
        }
      } catch (err: any) {
        errors.push(`Contract ${contract.contract_number}: ${err.message}`);
        console.error(`Error processing contract ${contract.contract_number}:`, err);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Client synchronization completed',
        stats: {
          total: contracts?.length || 0,
          updated: updatedCount,
          skipped: skippedCount,
          errors: errors.length,
        },
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error in sync-clients-from-contracts:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
