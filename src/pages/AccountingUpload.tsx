import { useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useContractInvoice, useUpdateContractInvoice } from "@/hooks/useContractInvoices";
import { Skeleton } from "@/components/ui/skeleton";
import { Upload, CheckCircle, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const AccountingUpload = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  
  const { data: invoice, isLoading } = useContractInvoice(invoiceId);
  const updateInvoice = useUpdateContractInvoice();

  const invoiceTypeLabels = {
    reservation: 'Kwota rezerwacyjna',
    main_payment: 'Kwota zasadnicza',
    final: 'Faktura końcowa',
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      // Check if it's a .doc or .docx file
      if (!selectedFile.name.endsWith('.doc') && !selectedFile.name.endsWith('.docx')) {
        toast({
          title: "Błąd",
          description: "Dozwolone są tylko pliki .doc lub .docx",
          variant: "destructive",
        });
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file || !invoiceId || !invoice) {
      toast({
        title: "Błąd",
        description: "Wybierz plik do przesłania",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${invoiceId}-${Date.now()}.${fileExt}`;
      const filePath = `${invoice.contract_id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('invoices')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('invoices')
        .getPublicUrl(filePath);

      // Update invoice record
      await updateInvoice.mutateAsync({
        id: invoiceId,
        updates: {
          invoice_file_url: publicUrl,
          invoice_uploaded_at: new Date().toISOString(),
          status: 'invoice_uploaded',
        },
      });

      // Send standardized notification via edge function (creates signed URL)
      try {
        const { data: contractData } = await supabase
          .from('contracts')
          .select('contract_number, tenant_name')
          .eq('id', invoice.contract_id)
          .single();

        const notificationTypeLabels = {
          reservation: "Rezerwacyjna",
          main_payment: "Zasadnicza",
          final: "Końcowa"
        } as const;

        await supabase.functions.invoke('send-invoice-file-notification', {
          body: {
            invoice_id: invoiceId,
            contract_id: invoice.contract_id,
            contract_number: contractData?.contract_number || '',
            tenant_name: contractData?.tenant_name || '',
            invoice_type: notificationTypeLabels[(invoice.invoice_type as keyof typeof notificationTypeLabels) ?? 'reservation'] || (invoice.invoice_type ?? 'reservation'),
            amount: 0,
            file_url: publicUrl,
            file_name: file.name,
            file_type: file.type,
            uploaded_at: new Date().toISOString(),
          }
        });
      } catch (notificationError) {
        console.error('Failed to send invoice file notification:', notificationError);
      }

      toast({
        title: "Sukces",
        description: "Faktura została przesłana",
      });

      setFile(null);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się przesłać faktury",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 max-w-2xl">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="container mx-auto py-10 max-w-2xl">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Nie znaleziono faktury
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Wgrywanie faktury
          </CardTitle>
          <CardDescription>
            Prześlij fakturę w formacie .doc lub .docx
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4 p-4 bg-muted rounded-lg">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="font-medium">Nr umowy:</span>
              <span>{invoice.contract?.contract_number}</span>
              
              <span className="font-medium">Klient:</span>
              <span>{invoice.contract?.tenant_name || invoice.contract?.tenant_company_name}</span>
              
              <span className="font-medium">Email:</span>
              <span>{invoice.contract?.tenant_email}</span>
              
              {invoice.contract?.tenant_phone && (
                <>
                  <span className="font-medium">Telefon:</span>
                  <span>{invoice.contract.tenant_phone}</span>
                </>
              )}
              
              <span className="font-medium">Typ płatności:</span>
              <span>{invoiceTypeLabels[invoice.invoice_type]}</span>
              
              <span className="font-medium">Kwota:</span>
              <span className="font-semibold">{invoice.amount} PLN</span>
            </div>
            
            {invoice.notes && (
              <div className="pt-2 border-t">
                <p className="text-sm font-medium mb-1">Notatki:</p>
                <p className="text-sm text-muted-foreground">{invoice.notes}</p>
              </div>
            )}
            
            <div className="pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`/contracts/${invoice.contract_id}`, '_blank')}
                className="w-full"
              >
                <FileText className="h-4 w-4 mr-2" />
                Zobacz pełną umowę
              </Button>
            </div>
          </div>

          {invoice.invoice_file_url ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600 bg-green-50 p-4 rounded-lg">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Faktura została już wgrana</span>
              </div>
              <Button
                variant="outline"
                onClick={() => window.open(invoice.invoice_file_url!, '_blank')}
                className="w-full"
              >
                <FileText className="h-4 w-4 mr-2" />
                Pobierz wgraną fakturę
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invoice-file">Wybierz plik faktury (.doc, .docx)</Label>
                <Input
                  id="invoice-file"
                  type="file"
                  accept=".doc,.docx"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
                {file && (
                  <p className="text-sm text-muted-foreground">
                    Wybrany plik: {file.name}
                  </p>
                )}
              </div>
              <Button
                onClick={handleUpload}
                disabled={!file || isUploading}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? 'Przesyłanie...' : 'Prześlij fakturę'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountingUpload;
