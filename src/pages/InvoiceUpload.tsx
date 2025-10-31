import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, Loader2, CheckCircle, FileIcon, ExternalLink, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ContractInvoiceFile } from "@/hooks/useContractInvoices";

const invoiceTypeLabels = {
  reservation: "Rezerwacyjna",
  main_payment: "Zasadnicza", 
  final: "Końcowa",
};

const InvoiceUpload = () => {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [invoice, setInvoice] = useState<any>(null);
  const [contract, setContract] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedInvoiceType, setSelectedInvoiceType] = useState<string>('');
  const [showContractDialog, setShowContractDialog] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    
    checkAuth();

    const fetchInvoiceData = async () => {
      try {
        const { data: invoiceData, error: invoiceError } = await supabase
          .from('contract_invoices')
          .select('*, contract:contracts(*)')
          .eq('id', invoiceId)
          .single();

        if (invoiceError) throw invoiceError;

        setInvoice(invoiceData);
        setContract(invoiceData.contract);
        setSelectedInvoiceType(invoiceData.invoice_type);
      } catch (error) {
        console.error('Error fetching invoice:', error);
        toast({
          title: "Błąd",
          description: "Nie znaleziono dokumentu",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (invoiceId) {
      fetchInvoiceData();
    }
  }, [invoiceId, toast]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !invoice || !contract) return;

    setUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileId = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const fileName = `${fileId}.${fileExt}`;
      const filePath = `${contract.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('invoices')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('invoices')
        .getPublicUrl(filePath);

      const newFile: ContractInvoiceFile = {
        id: fileId,
        url: publicUrl,
        name: selectedFile.name,
        uploadedAt: new Date().toISOString(),
        type: selectedFile.type,
      };

      const existingFiles = invoice.files || [];
      const updatedFiles = [...existingFiles, newFile];

      const { error: updateError } = await supabase
        .from('contract_invoices')
        .update({
          files: updatedFiles,
          invoice_file_url: publicUrl,
          invoice_uploaded_at: new Date().toISOString(),
          status: 'invoice_uploaded',
          invoice_type: selectedInvoiceType,
        })
        .eq('id', invoiceId);

      if (updateError) throw updateError;

      // Send standardized notification via edge function (creates signed URL)
      try {
        const invoiceTypeLabels = {
          reservation: "Rezerwacyjna",
          main_payment: "Zasadnicza",
          final: "Końcowa"
        } as const;

        await supabase.functions.invoke('send-invoice-file-notification', {
          body: {
            invoice_id: invoiceId,
            contract_id: contract.id,
            contract_number: contract.contract_number,
            tenant_name: contract.tenant_name || '',
            invoice_type: invoiceTypeLabels[selectedInvoiceType as keyof typeof invoiceTypeLabels] || selectedInvoiceType,
            amount: invoice.amount,
            file_url: publicUrl,
            file_name: selectedFile.name,
            file_type: selectedFile.type,
            uploaded_at: new Date().toISOString(),
          }
        });
        console.log('Invoice file notification sent successfully');
      } catch (notificationError) {
        console.error('Failed to send invoice file notification:', notificationError);
      }

      setUploadSuccess(true);
      toast({
        title: "Sukces",
        description: "Dokument został wgrany pomyślnie",
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się wgrać dokumentu",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!invoice || !contract) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Nie znaleziono dokumentu</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (uploadSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <CheckCircle className="h-16 w-16 mx-auto text-green-500" />
            <h2 className="text-2xl font-bold">Dokument wgrany!</h2>
            <p className="text-muted-foreground">
              Twój dokument został pomyślnie wgrany do systemu.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Wgraj dokument
              </CardTitle>
              <CardDescription>
                Prześlij dokument dla umowy {contract.contract_number}
              </CardDescription>
            </div>
            <Dialog open={showContractDialog} onOpenChange={setShowContractDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Podgląd umowy
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    Wymagane zalogowanie
                  </DialogTitle>
                  <DialogDescription className="space-y-4 pt-4">
                    <p>
                      Aby zobaczyć szczegóły umowy, musisz być zalogowany w systemie.
                    </p>
                    {isAuthenticated ? (
                      <Button 
                        onClick={() => window.open(`/contracts/${contract.id}`, '_blank')}
                        className="w-full"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Otwórz umowę w nowej karcie
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => window.open('/auth', '_blank')}
                        className="w-full"
                      >
                        Zaloguj się w systemie
                      </Button>
                    )}
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-3 text-sm bg-muted/50 p-4 rounded-lg">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Numer umowy:</span>
              <span className="font-medium">{contract.contract_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Typ dokumentu:</span>
              <span className="font-medium">
                {invoice.invoice_type === 'reservation' && 'Rezerwacyjna'}
                {invoice.invoice_type === 'main_payment' && 'Zasadnicza'}
                {invoice.invoice_type === 'final' && 'Końcowa'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Kwota:</span>
              <span className="font-medium">{invoice.amount?.toFixed(2)} PLN</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Typ dokumentu</Label>
              <Select
                value={selectedInvoiceType}
                onValueChange={setSelectedInvoiceType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz typ dokumentu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reservation">{invoiceTypeLabels.reservation}</SelectItem>
                  <SelectItem value="main_payment">{invoiceTypeLabels.main_payment}</SelectItem>
                  <SelectItem value="final">{invoiceTypeLabels.final}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Wybierz plik</Label>
              <Input
                id="file"
                type="file"
                accept="*/*"
                onChange={handleFileSelect}
                disabled={uploading}
              />
              {selectedFile && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileIcon className="h-4 w-4" />
                  <span>{selectedFile.name}</span>
                </div>
              )}
            </div>

            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading || !selectedInvoiceType}
              className="w-full"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Wgrywanie...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Wgraj dokument
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceUpload;
