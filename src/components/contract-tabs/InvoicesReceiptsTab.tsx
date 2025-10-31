import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FileText, Upload, Download, CheckCircle, Clock, FileUp, Receipt, Loader2, X, Eye, FileIcon, Send } from "lucide-react";
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
  tenantNip?: string;
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
  payments,
  tenantNip
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
  const [accountingDialogOpen, setAccountingDialogOpen] = useState(false);
  const [selectedInvoiceForAccounting, setSelectedInvoiceForAccounting] = useState<any>(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState<'paragon' | 'faktura' | 'internal_invoice'>(tenantNip ? 'faktura' : 'paragon');
  const [isSendingToAccounting, setIsSendingToAccounting] = useState(false);
  const [invoiceTitle, setInvoiceTitle] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
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

  // Set initial amount on mount
  useEffect(() => {
    const initialAmount = getAmountForType('reservation');
    if (initialAmount && !newInvoice.amount) {
      setNewInvoice(prev => ({
        ...prev,
        amount: initialAmount
      }));
    }
  }, [payments]);
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
        files: [],
        is_archived: false
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
      setInvoiceTitle('');
      setServiceDescription('');
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
  const openAccountingDialog = async (invoice: any) => {
    setSelectedInvoiceForAccounting(invoice);
    setSelectedDocumentType(tenantNip ? 'faktura' : 'paragon');
    setAccountingDialogOpen(true);
  };

  const sendToAccounting = async () => {
    if (!selectedInvoiceForAccounting) return;

    setIsSendingToAccounting(true);
    try {
      const uploadLink = `https://app.kokokamper.pl/invoice-upload/${selectedInvoiceForAccounting.id}`;
      
      const webhookData: any = {
        invoice_id: selectedInvoiceForAccounting.id,
        contract_id: contractId,
        contract_number: contractNumber,
        tenant_name: tenantName,
        invoice_type: selectedInvoiceForAccounting.invoice_type,
        amount: selectedInvoiceForAccounting.amount,
        document_type: selectedDocumentType,
        upload_link: uploadLink,
        timestamp: new Date().toISOString()
      };

      // Dodaj dodatkowe pola dla faktury wewnętrznej
      if (selectedDocumentType === 'internal_invoice') {
        webhookData.invoice_title = invoiceTitle || null;
        webhookData.service_description = serviceDescription || null;
      }

      const response = await supabase.functions.invoke('send-accounting-request', {
        body: webhookData
      });

      if (response.error) throw response.error;

      toast({
        title: "Wysłano do księgowości",
        description: `Prośba o ${selectedDocumentType} została wysłana do księgowości`
      });

      setAccountingDialogOpen(false);
      setSelectedInvoiceForAccounting(null);
    } catch (error) {
      console.error('Error sending to accounting:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się wysłać prośby do księgowości",
        variant: "destructive"
      });
    } finally {
      setIsSendingToAccounting(false);
    }
  };
  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Ładowanie...</div>;
  }

  // Filtruj faktury - pokazuj tylko te, które mają wgrane pliki
  const visibleInvoices = invoices?.filter(invoice => 
    invoice.status === 'invoice_uploaded' || invoice.status === 'completed'
  ) || [];

  return <div className="space-y-6">
      {/* Existing invoices table */}
      {visibleInvoices.length > 0 && (
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
              {visibleInvoices.map((invoice) => {
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
                        onClick={() => openAccountingDialog(invoice)}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Wyślij do księgowości
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

            {selectedDocumentType !== 'internal_invoice' && (
              <>
                <div className="space-y-2">
                  <Label>Tytuł faktury (opcjonalnie)</Label>
                  <Input 
                    value={invoiceTitle} 
                    onChange={e => setInvoiceTitle(e.target.value)} 
                    placeholder="np. Wynajem kampera Mercedes Sprinter"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Opis usługi (opcjonalnie)</Label>
                  <Textarea 
                    value={serviceDescription} 
                    onChange={e => setServiceDescription(e.target.value)} 
                    placeholder="np. Wynajem pojazdu w okresie 01.01-07.01.2024"
                    rows={3}
                  />
                </div>
              </>
            )}

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

      {/* Accounting Request Dialog */}
      <Dialog open={accountingDialogOpen} onOpenChange={setAccountingDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Wyślij do księgowości</DialogTitle>
            <DialogDescription>
              Wybierz typ dokumentu, o który chcesz poprosić księgowość
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <Label>Wybierz typ dokumentu:</Label>
               <RadioGroup value={selectedDocumentType} onValueChange={(value: 'paragon' | 'faktura' | 'internal_invoice') => setSelectedDocumentType(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="paragon" id="paragon" />
                  <Label htmlFor="paragon" className="cursor-pointer font-normal">
                    Paragon
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="faktura" id="faktura" />
                  <Label htmlFor="faktura" className="cursor-pointer font-normal">
                    Faktura
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="internal_invoice" id="internal_invoice" />
                  <Label htmlFor="internal_invoice" className="cursor-pointer font-normal">
                    Faktura wewnętrzna
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {selectedInvoiceForAccounting && (
              <div className="bg-muted/50 p-3 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Typ płatności:</span>
                  <span className="font-medium">
                    {invoiceTypeLabels[selectedInvoiceForAccounting.invoice_type as keyof typeof invoiceTypeLabels]}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kwota:</span>
                  <span className="font-medium">{selectedInvoiceForAccounting.amount.toFixed(2)} PLN</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Umowa:</span>
                  <span className="font-medium">{contractNumber}</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setAccountingDialogOpen(false)}
              className="flex-1"
              disabled={isSendingToAccounting}
            >
              Anuluj
            </Button>
            <Button
              onClick={sendToAccounting}
              className="flex-1"
              disabled={isSendingToAccounting}
            >
              {isSendingToAccounting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Wysyłanie...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Wyślij
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>;
};