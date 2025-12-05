import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse URL to check for query params
    const url = new URL(req.url);
    const tablesOnly = url.searchParams.get('tables_only') === 'true';

    console.log(`Export data request - tables_only: ${tablesOnly}`);

    // Get list of all tables in public schema
    const { data: tablesData, error: tablesError } = await supabase
      .rpc('get_public_tables');

    // If RPC doesn't exist, we'll use a direct query approach
    let tableNames: string[] = [];
    
    if (tablesError) {
      console.log('RPC not available, using predefined table list');
      // Fallback: use known tables from the schema
      tableNames = [
        'clients',
        'contracts',
        'contract_documents',
        'contract_invoices',
        'contract_status_history',
        'documents',
        'employee_availability_settings',
        'employee_schedules',
        'inquiries',
        'inquiry_messages',
        'notification_logs',
        'notifications',
        'profiles',
        'user_roles',
        'vehicle_documents',
        'vehicle_handovers',
        'vehicle_returns',
        'vehicles'
      ];
    } else {
      tableNames = tablesData?.map((t: { tablename: string }) => t.tablename) || [];
    }

    console.log(`Found ${tableNames.length} tables: ${tableNames.join(', ')}`);

    // If tables_only, return just the list
    if (tablesOnly) {
      return new Response(
        JSON.stringify({
          exported_at: new Date().toISOString(),
          project: 'koko-rental-system',
          tables: tableNames,
          table_count: tableNames.length
        }, null, 2),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Export all data from each table
    const exportData: Record<string, any[]> = {};
    let totalRecords = 0;

    for (const tableName of tableNames) {
      console.log(`Exporting table: ${tableName}`);
      
      const { data, error } = await supabase
        .from(tableName)
        .select('*');

      if (error) {
        console.error(`Error exporting ${tableName}:`, error.message);
        exportData[tableName] = [];
      } else {
        exportData[tableName] = data || [];
        totalRecords += (data?.length || 0);
        console.log(`  - ${data?.length || 0} records`);
      }
    }

    const response = {
      exported_at: new Date().toISOString(),
      project: 'koko-rental-system',
      tables: exportData,
      table_count: tableNames.length,
      total_records: totalRecords
    };

    console.log(`Export complete: ${tableNames.length} tables, ${totalRecords} total records`);

    return new Response(
      JSON.stringify(response, null, 2),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="export-${new Date().toISOString().split('T')[0]}.json"`
        } 
      }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Export error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Export failed', 
        message: errorMessage 
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
