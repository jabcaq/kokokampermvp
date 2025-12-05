import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Download, Copy, Loader2, Database } from "lucide-react";

const TABLES = [
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
] as const;

type TableName = typeof TABLES[number];

interface ExportData {
  exported_at: string;
  tables: Record<string, any[]>;
  table_count: number;
  total_records: number;
}

const AdminExport = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [exportData, setExportData] = useState<ExportData | null>(null);
  const [progress, setProgress] = useState<string>("");
  const { toast } = useToast();

  const fetchAllData = async () => {
    setIsLoading(true);
    setProgress("Rozpoczynam eksport...");
    
    try {
      const tables: Record<string, any[]> = {};
      let totalRecords = 0;

      for (const tableName of TABLES) {
        setProgress(`Pobieranie: ${tableName}...`);
        
        const { data, error } = await supabase
          .from(tableName)
          .select('*');

        if (error) {
          console.error(`Error fetching ${tableName}:`, error);
          tables[tableName] = [];
        } else {
          tables[tableName] = data || [];
          totalRecords += (data?.length || 0);
        }
      }

      const result: ExportData = {
        exported_at: new Date().toISOString(),
        tables,
        table_count: TABLES.length,
        total_records: totalRecords
      };

      setExportData(result);
      setProgress(`Eksport zakończony: ${totalRecords} rekordów z ${TABLES.length} tabel`);
      
      toast({
        title: "Eksport zakończony",
        description: `Pobrano ${totalRecords} rekordów z ${TABLES.length} tabel`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Błąd eksportu",
        description: "Nie udało się pobrać danych",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadJson = () => {
    if (!exportData) return;
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Pobrano plik",
      description: "Plik JSON został pobrany",
    });
  };

  const copyToClipboard = async () => {
    if (!exportData) return;
    
    try {
      await navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
      toast({
        title: "Skopiowano",
        description: "Dane zostały skopiowane do schowka",
      });
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się skopiować danych",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-6 w-6" />
              Admin Export - Baza Danych
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-sm text-muted-foreground">
              <p>Tabele do eksportu ({TABLES.length}):</p>
              <p className="mt-1 text-xs">{TABLES.join(', ')}</p>
            </div>

            <Button 
              onClick={fetchAllData} 
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eksportowanie...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Export All Data
                </>
              )}
            </Button>

            {progress && (
              <p className="text-sm text-muted-foreground text-center">{progress}</p>
            )}

            {exportData && (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Podsumowanie:</p>
                  <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                    <li>Data eksportu: {new Date(exportData.exported_at).toLocaleString('pl-PL')}</li>
                    <li>Liczba tabel: {exportData.table_count}</li>
                    <li>Łączna liczba rekordów: {exportData.total_records}</li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <Button onClick={downloadJson} className="flex-1">
                    <Download className="mr-2 h-4 w-4" />
                    Download JSON
                  </Button>
                  <Button onClick={copyToClipboard} variant="outline" className="flex-1">
                    <Copy className="mr-2 h-4 w-4" />
                    Copy to Clipboard
                  </Button>
                </div>

                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                    Podgląd danych (kliknij aby rozwinąć)
                  </summary>
                  <pre className="mt-2 p-4 bg-muted rounded-lg text-xs overflow-auto max-h-96">
                    {JSON.stringify(exportData, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminExport;
