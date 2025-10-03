import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Upload, Download, CheckCircle, Clock, FileUp, Receipt } from "lucide-react";
import { useContractInvoices, useAddContractInvoice, useUpdateContractInvoice } from "@/hooks/useContractInvoices";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface InvoicesReceiptsTabProps {
  contractId: string;
  invoiceType: 'receipt' | 'invoice';
  contractNumber: string;
  tenantName: string;
  startDate: string;
  endDate: string;
}

const statusConfig = {
  pending: { label: "Oczekuje", icon: Clock, className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
  submitted: { label: "Przesłano", icon: FileUp, className: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  invoice_uploaded: { label: "Faktura wgrana", icon: Upload, className: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  completed: { label: "Zakończone", icon: CheckCircle, className: "bg-green-500/10 text-green-500 border-green-500/20" },
};

const invoiceTypeLabels = {
  reservation: "Rezerwacyjna",
  main_payment: "Zasadnicza", 
  final: "Końcowa",
};

export const InvoicesReceiptsTab = ({ 
  contractId, 
  invoiceType, 
  contractNumber, 
  tenantName,
  startDate,
  endDate 
}: InvoicesReceiptsTabProps) => {
  const { toast } = useToast();
  const { data: invoices, isLoading } = useContractInvoices(contractId);
  const addInvoice = useAddContractInvoice();
  const updateInvoice = useUpdateContractInvoice();
  
  const [newInvoice, setNewInvoice] = useState({
    type: 'reservation' as 'reservation' | 'main_payment' | 'final',
    amount: '',
    notes: '',
  });

  const handleAddInvoice = async () => {
    if (!newInvoice.amount || parseFloat(newInvoice.amount) <= 0) {
      toast({
        title: "Błąd",
        description: "Podaj poprawną kwotę",
        variant: "destructive",
      });
      return;
    }

    try {
      await addInvoice.mutateAsync({
        contract_id: contractId,
        invoice_type: newInvoice.type,
        amount: parseFloat(newInvoice.amount),
        status: 'pending',
        submitted_at: null,
        invoice_file_url: null,
        invoice_uploaded_at: null,
        notes: newInvoice.notes || null,
      });

      setNewInvoice({ type: 'reservation', amount: '', notes: '' });
      
      toast({
        title: "Sukces",
        description: `Dodano ${invoiceType === 'invoice' ? 'fakturę' : 'paragon'}`,
      });
    } catch (error) {
      toast({
        title: "Błąd",
        description: `Nie udało się dodać ${invoiceType === 'invoice' ? 'faktury' : 'paragonu'}`,
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (invoiceId: string) => {
    // Create a link that accounting can use to upload the invoice
    const uploadLink = `${window.location.origin}/invoice-upload/${invoiceId}`;
    
    // Copy to clipboard
    await navigator.clipboard.writeText(uploadLink);
    
    toast({
      title: "Link skopiowany",
      description: "Link do wgrania faktury został skopiowany do schowka",
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Ładowanie...</div>;
  }

  const documentType = invoiceType === 'invoice' ? 'Faktury' : 'Paragony';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {invoiceType === 'invoice' ? <FileText className="h-5 w-5" /> : <Receipt className="h-5 w-5" />}
            {documentType}
          </CardTitle>
          <CardDescription>
            Zarządzaj {documentType.toLowerCase()} dla umowy {contractNumber}
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

          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold">Dodaj nowy dokument</h3>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Typ dokumentu</Label>
                <Select
                  value={newInvoice.type}
                  onValueChange={(value: any) => setNewInvoice({ ...newInvoice, type: value })}
                >
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
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newInvoice.amount}
                  onChange={(e) => setNewInvoice({ ...newInvoice, amount: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Uwagi (opcjonalnie)</Label>
                <Textarea
                  placeholder="Dodatkowe informacje..."
                  value={newInvoice.notes}
                  onChange={(e) => setNewInvoice({ ...newInvoice, notes: e.target.value })}
                  rows={2}
                />
              </div>

              <Button onClick={handleAddInvoice} disabled={addInvoice.isPending}>
                {addInvoice.isPending ? "Dodawanie..." : "Dodaj dokument"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Lista dokumentów</h3>
        {invoices && invoices.length > 0 ? (
          <div className="grid gap-4">
            {invoices.map((invoice) => {
              const status = statusConfig[invoice.status];
              const StatusIcon = status.icon;
              
              return (
                <Card key={invoice.id}>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">
                              {invoiceTypeLabels[invoice.invoice_type as keyof typeof invoiceTypeLabels]}
                            </h4>
                            <Badge variant="outline" className={status.className}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {status.label}
                            </Badge>
                          </div>
                          <p className="text-2xl font-bold text-primary">
                            {invoice.amount.toFixed(2)} PLN
                          </p>
                        </div>
                      </div>

                      {invoice.notes && (
                        <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">
                          {invoice.notes}
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        {invoice.status === 'pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleFileUpload(invoice.id)}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Skopiuj link do wgrania
                          </Button>
                        )}
                        
                        {invoice.invoice_file_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(invoice.invoice_file_url!, '_blank')}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Pobierz dokument
                          </Button>
                        )}
                      </div>

                      {invoice.submitted_at && (
                        <p className="text-xs text-muted-foreground">
                          Przesłano: {format(new Date(invoice.submitted_at), 'dd.MM.yyyy HH:mm')}
                        </p>
                      )}
                      
                      {invoice.invoice_uploaded_at && (
                        <p className="text-xs text-muted-foreground">
                          Wgrano: {format(new Date(invoice.invoice_uploaded_at), 'dd.MM.yyyy HH:mm')}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              Brak dokumentów. Dodaj pierwszy dokument powyżej.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
