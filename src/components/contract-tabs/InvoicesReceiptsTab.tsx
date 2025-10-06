import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Upload, Download, CheckCircle, Clock, FileUp, Receipt, Loader2, X, Eye, FileIcon } from "lucide-react";
import { useContractInvoices, useAddContractInvoice, useUpdateContractInvoice, ContractInvoiceFile } from "@/hooks/useContractInvoices";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
interface InvoicesReceiptsTabProps {
  contractId: string;
  invoiceType: 'receipt' | 'invoice';
  contractNumber: string;
  tenantName: string;
  startDate: string;
  endDate: string;
  payments?: any;
}
const statusConfig = {
  pending: {
    label: "Oczekuje",
    icon: Clock,
    className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
  },
  submitted: {
    label: "Przesłano",
    icon: FileUp,
    className: "bg-blue-500/10 text-blue-500 border-blue-500/20"
  },
  invoice_uploaded: {
    label: "Dokument wgrany",
    icon: Upload,
    className: "bg-purple-500/10 text-purple-500 border-purple-500/20"
  },
  completed: {
    label: "Zakończone",
    icon: CheckCircle,
    className: "bg-green-500/10 text-green-500 border-green-500/20"
  }
};
const invoiceTypeLabels = {
  reservation: "Rezerwacyjna",
  main_payment: "Zasadnicza",
  final: "Końcowa"
};
export const InvoicesReceiptsTab = ({
  contractId,
  invoiceType,
  contractNumber,
  tenantName,
  startDate,
  endDate,
  payments
}: InvoicesReceiptsTabProps) => {
  const {
    toast
  } = useToast();
  const {
    data: invoices,
    isLoading
  } = useContractInvoices(contractId);
  const addInvoice = useAddContractInvoice();
  const updateInvoice = useUpdateContractInvoice();
  const [newInvoice, setNewInvoice] = useState({
    type: 'reservation' as 'reservation' | 'main_payment' | 'final',
    amount: '',
    notes: ''
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<ContractInvoiceFile | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const getAmountForType = (type: 'reservation' | 'main_payment' | 'final') => {
    if (!payments) return '';
    try {
      let amount = '';
      switch (type) {
        case 'reservation':
          amount = payments.rezerwacyjna?.wysokosc || '';
          break;
        case 'main_payment':
          amount = payments.zasadnicza?.wysokosc || '';
          break;
        case 'final':
          amount = payments.kaucja?.wysokosc || '';
          break;
      }
      if (typeof amount === 'string') {
        const numericValue = amount.replace(/[^\d.]/g, '');
        return numericValue;
      }
      return String(amount);
    } catch (error) {
      return '';
    }
  };
  const handleTypeChange = (type: 'reservation' | 'main_payment' | 'final') => {
    const amount = getAmountForType(type);
    setNewInvoice({
      ...newInvoice,
      type,
      amount
    });
  };
  const handleFileUpload = async (invoiceId: string, file: File, invoice: any) => {
    setUploadingFile(invoiceId);
    try {
      const fileExt = file.name.split('.').pop();
      const fileId = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const fileName = `${fileId}.${fileExt}`;
      const filePath = `${contractId}/${fileName}`;
      const {
        error: uploadError
      } = await supabase.storage.from('invoices').upload(filePath, file);
      if (uploadError) throw uploadError;
      const {
        data: {
          publicUrl
        }
      } = supabase.storage.from('invoices').getPublicUrl(filePath);
      const newFile: ContractInvoiceFile = {
        id: fileId,
        url: publicUrl,
        name: file.name,
        uploadedAt: new Date().toISOString(),
        type: file.type
      };
      const existingFiles = invoice.files || [];
      const updatedFiles = [...existingFiles, newFile];
      await updateInvoice.mutateAsync({
        id: invoiceId,
        updates: {
          files: updatedFiles,
          invoice_file_url: publicUrl,
          invoice_uploaded_at: new Date().toISOString(),
          status: 'invoice_uploaded'
        }
      });
      toast({
        title: "Sukces",
        description: "Plik został wgrany pomyślnie"
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się wgrać pliku",
        variant: "destructive"
      });
    } finally {
      setUploadingFile(null);
    }
  };
  const handleDeleteFile = async (invoiceId: string, fileId: string, invoice: any) => {
    try {
      const updatedFiles = (invoice.files || []).filter((f: ContractInvoiceFile) => f.id !== fileId);
      await updateInvoice.mutateAsync({
        id: invoiceId,
        updates: {
          files: updatedFiles,
          status: updatedFiles.length > 0 ? 'invoice_uploaded' : 'pending'
        }
      });
      toast({
        title: "Sukces",
        description: "Plik został usunięty"
      });
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się usunąć pliku",
        variant: "destructive"
      });
    }
  };
  const openPreview = (file: ContractInvoiceFile) => {
    setPreviewFile(file);
    setPreviewDialogOpen(true);
  };
  const isImageFile = (type?: string) => type?.startsWith('image/');
  const isPdfFile = (type?: string) => type === 'application/pdf';
  const handleAddInvoice = async () => {
    if (!newInvoice.amount || parseFloat(newInvoice.amount) <= 0) {
      toast({
        title: "Błąd",
        description: "Podaj poprawną kwotę",
        variant: "destructive"
      });
      return;
    }
    setIsSaving(true);
    try {
      // Create invoice record first
      const invoiceData = {
        contract_id: contractId,
        invoice_type: newInvoice.type,
        amount: parseFloat(newInvoice.amount),
        status: (selectedFiles.length > 0 ? 'invoice_uploaded' : 'pending') as 'pending' | 'submitted' | 'invoice_uploaded' | 'completed',
        submitted_at: null,
        invoice_file_url: null,
        invoice_uploaded_at: null,
        notes: newInvoice.notes || null,
        files: []
      };
      const newInvoiceRecord = await addInvoice.mutateAsync(invoiceData);

      // Upload files if any
      if (selectedFiles.length > 0 && newInvoiceRecord) {
        const uploadedFiles: ContractInvoiceFile[] = [];
        for (const file of selectedFiles) {
          const fileExt = file.name.split('.').pop();
          const fileId = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
          const fileName = `${fileId}.${fileExt}`;
          const filePath = `${contractId}/${fileName}`;
          const {
            error: uploadError
          } = await supabase.storage.from('invoices').upload(filePath, file);
          if (uploadError) throw uploadError;
          const {
            data: {
              publicUrl
            }
          } = supabase.storage.from('invoices').getPublicUrl(filePath);
          uploadedFiles.push({
            id: fileId,
            url: publicUrl,
            name: file.name,
            uploadedAt: new Date().toISOString(),
            type: file.type
          });
        }

        // Update invoice with files
        await updateInvoice.mutateAsync({
          id: newInvoiceRecord.id,
          updates: {
            files: uploadedFiles,
            invoice_file_url: uploadedFiles[0]?.url || null,
            invoice_uploaded_at: new Date().toISOString(),
            status: 'invoice_uploaded'
          }
        });
      }
      setNewInvoice({
        type: 'reservation',
        amount: '',
        notes: ''
      });
      setSelectedFiles([]);
      toast({
        title: "Sukces",
        description: `Dodano ${invoiceType === 'invoice' ? 'fakturę' : 'paragon'}`
      });
    } catch (error) {
      console.error('Error adding invoice:', error);
      toast({
        title: "Błąd",
        description: `Nie udało się dodać ${invoiceType === 'invoice' ? 'faktury' : 'paragonu'}`,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  const copyLinkForNewInvoice = async () => {
    try {
      const invoiceData = {
        contract_id: contractId,
        invoice_type: newInvoice.type,
        amount: newInvoice.amount && parseFloat(newInvoice.amount) > 0 ? parseFloat(newInvoice.amount) : 0.01,
        status: 'pending' as 'pending' | 'submitted' | 'invoice_uploaded' | 'completed',
        submitted_at: null,
        invoice_file_url: null,
        invoice_uploaded_at: null,
        notes: newInvoice.notes || null,
        files: []
      };
      const newInvoiceRecord = await addInvoice.mutateAsync(invoiceData);
      if (newInvoiceRecord) {
        const uploadLink = `${window.location.origin}/invoice-upload/${newInvoiceRecord.id}`;
        await navigator.clipboard.writeText(uploadLink);
        setNewInvoice({
          type: 'reservation',
          amount: '',
          notes: ''
        });
        toast({
          title: "Link skopiowany",
          description: "Link do wgrania dokumentu został skopiowany. Dokument został zapisany."
        });
      }
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się utworzyć linku",
        variant: "destructive"
      });
    }
  };
  const copyLinkToClipboard = async (invoiceId: string) => {
    const uploadLink = `${window.location.origin}/invoice-upload/${invoiceId}`;
    await navigator.clipboard.writeText(uploadLink);
    toast({
      title: "Link skopiowany",
      description: "Link do wgrania dokumentu został skopiowany do schowka"
    });
  };
  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Ładowanie...</div>;
  }
  return <div className="space-y-6">
      {/* Existing invoices table */}
      {invoices && invoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {invoiceType === 'invoice' ? <FileText className="h-5 w-5" /> : <Receipt className="h-5 w-5" />}
              Lista dokumentów
            </CardTitle>
            <CardDescription>
              Wszystkie {invoiceType === 'invoice' ? 'faktury' : 'paragony'} dla umowy {contractNumber}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {invoices.map((invoice) => {
                const StatusIcon = statusConfig[invoice.status as keyof typeof statusConfig]?.icon || Clock;
                const statusLabel = statusConfig[invoice.status as keyof typeof statusConfig]?.label || invoice.status;
                const statusClass = statusConfig[invoice.status as keyof typeof statusConfig]?.className || '';
                
                return (
                  <div key={invoice.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">
                            {invoiceTypeLabels[invoice.invoice_type as keyof typeof invoiceTypeLabels]}
                          </h4>
                          <Badge variant="outline" className={statusClass}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusLabel}
                          </Badge>
                        </div>
                        <p className="text-2xl font-bold">{invoice.amount.toFixed(2)} PLN</p>
                        {invoice.notes && (
                          <p className="text-sm text-muted-foreground">{invoice.notes}</p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyLinkToClipboard(invoice.id)}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Kopiuj link
                      </Button>
                    </div>

                    {invoice.files && invoice.files.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Załączone pliki:</Label>
                        <div className="grid gap-2">
                          {invoice.files.map((file: ContractInvoiceFile) => (
                            <div key={file.id} className="flex items-center justify-between p-2 border rounded bg-muted/50">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <FileText className="h-4 w-4 flex-shrink-0" />
                                <span className="text-sm truncate">{file.name}</span>
                                <span className="text-xs text-muted-foreground flex-shrink-0">
                                  {format(new Date(file.uploadedAt), 'dd.MM.yyyy HH:mm')}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openPreview(file)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(file.url, '_blank')}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteFile(invoice.id, file.id, invoice)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {(!invoice.files || invoice.files.length === 0) && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Dodaj plik:</Label>
                        <div className="flex gap-2">
                          <Input
                            type="file"
                            accept="*/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleFileUpload(invoice.id, file, invoice);
                              }
                            }}
                            disabled={uploadingFile === invoice.id}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add new document form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {invoiceType === 'invoice' ? <FileText className="h-5 w-5" /> : <Receipt className="h-5 w-5" />}
            Dodaj nowy dokument
          </CardTitle>
          <CardDescription>
            Utwórz nowy wpis dla {invoiceType === 'invoice' ? 'faktury' : 'paragonu'} - umowa {contractNumber}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 text-sm bg-muted/50 p-4 rounded-lg">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Numer umowy:</span>
              <span className="font-medium">{contractNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Najemca:</span>
              <span className="font-medium">{tenantName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Okres wynajmu:</span>
              <span className="font-medium">{startDate} - {endDate}</span>
            </div>
          </div>
          
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Typ dokumentu</Label>
              <Select value={newInvoice.type} onValueChange={(value: any) => handleTypeChange(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reservation">{invoiceTypeLabels.reservation}</SelectItem>
                  <SelectItem value="main_payment">{invoiceTypeLabels.main_payment}</SelectItem>
                  <SelectItem value="final">{invoiceTypeLabels.final}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Kwota (PLN)</Label>
              <Input type="number" step="0.01" placeholder="0.00" value={newInvoice.amount} onChange={e => setNewInvoice({
              ...newInvoice,
              amount: e.target.value
            })} onBlur={e => {
              const value = parseFloat(e.target.value);
              if (!isNaN(value)) {
                setNewInvoice({
                  ...newInvoice,
                  amount: value.toFixed(2)
                });
              }
            }} />
            </div>

            <div className="space-y-2">
              <Label>Uwagi (opcjonalnie)</Label>
              <Textarea placeholder="Dodatkowe informacje..." value={newInvoice.notes} onChange={e => setNewInvoice({
              ...newInvoice,
              notes: e.target.value
            })} rows={2} />
            </div>

            <div className="space-y-2">
              <Label>Pliki (opcjonalnie)</Label>
              <div className="space-y-2">
                <Input type="file" multiple accept="*/*" onChange={e => {
                const files = Array.from(e.target.files || []);
                setSelectedFiles(files);
              }} />
                {selectedFiles.length > 0 && <div className="text-sm text-muted-foreground">
                    Wybrano plików: {selectedFiles.length}
                    <ul className="list-disc list-inside mt-1">
                      {selectedFiles.map((file, idx) => <li key={idx}>{file.name}</li>)}
                    </ul>
                  </div>}
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddInvoice} disabled={isSaving || addInvoice.isPending} className="flex-1">
                {isSaving || addInvoice.isPending ? <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Zapisywanie...
                  </> : <>Zapisz dokument</>}
              </Button>
              <Button onClick={copyLinkForNewInvoice} variant="outline" disabled={isSaving || addInvoice.isPending}>
                <Upload className="h-4 w-4 mr-2" />
                Skopiuj link
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{previewFile?.name}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {previewFile && <>
                {isImageFile(previewFile.type) ? <img src={previewFile.url} alt={previewFile.name} className="w-full h-auto rounded-lg" /> : isPdfFile(previewFile.type) ? <iframe src={previewFile.url} className="w-full h-[70vh] rounded-lg border" title={previewFile.name} /> : <div className="text-center space-y-4 p-8">
                    <FileIcon className="h-24 w-24 mx-auto text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Podgląd niedostępny dla tego typu pliku
                    </p>
                    <Button onClick={() => window.open(previewFile.url, '_blank')} variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Pobierz plik
                    </Button>
                  </div>}
                <div className="mt-4 flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    Wgrano: {format(new Date(previewFile.uploadedAt), 'dd.MM.yyyy HH:mm')}
                  </p>
                  <Button onClick={() => window.open(previewFile.url, '_blank')} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Pobierz
                  </Button>
                </div>
              </>}
          </div>
        </DialogContent>
      </Dialog>
    </div>;
};