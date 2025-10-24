import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useAddContractInvoice, useContractInvoices } from "@/hooks/useContractInvoices";
import { Send, ExternalLink, FileCheck, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
interface AccountingPanelProps {
  contractId: string;
  contractNumber: string;
  payments?: any;
  tenantName?: string;
}
export const AccountingPanel = ({
  contractId,
  contractNumber,
  payments,
  tenantName
}: AccountingPanelProps) => {
  const {
    toast
  } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [invoiceType, setInvoiceType] = useState<'reservation' | 'main_payment' | 'final'>('reservation');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedDocumentType, setSelectedDocumentType] = useState<'paragon' | 'faktura'>('paragon');
  const [isSending, setIsSending] = useState(false);
  const addInvoice = useAddContractInvoice();
  const {
    data: invoices
  } = useContractInvoices(contractId);
  const invoiceTypeLabels = {
    reservation: 'Kwota rezerwacyjna',
    main_payment: 'Kwota zasadnicza',
    final: 'Faktura końcowa'
  };
  const statusLabels = {
    pending: 'Oczekuje',
    submitted: 'Wysłano do księgowości',
    invoice_uploaded: 'Faktura wgrana',
    completed: 'Zakończono'
  };

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
    setInvoiceType(type);
    const amountValue = getAmountForType(type);
    setAmount(amountValue);
  };

  useEffect(() => {
    const initialAmount = getAmountForType('reservation');
    if (initialAmount && !amount) {
      setAmount(initialAmount);
    }
  }, [payments]);

  const handleSubmitToAccounting = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Błąd",
        description: "Podaj poprawną kwotę",
        variant: "destructive"
      });
      return;
    }

    setIsSending(true);
    try {
      // Tworzenie faktury w bazie
      const result = await addInvoice.mutateAsync({
        contract_id: contractId,
        invoice_type: invoiceType,
        amount: parseFloat(amount),
        status: 'pending',
        submitted_at: null,
        invoice_file_url: null,
        invoice_uploaded_at: null,
        notes: notes || null,
        files: []
      });

      const uploadLink = `https://app.kokokamper.pl/invoice-upload/${result.id}`;

      // Wysyłanie webhooka do księgowości
      const response = await supabase.functions.invoke('send-accounting-request', {
        body: {
          invoice_id: result.id,
          contract_id: contractId,
          contract_number: contractNumber,
          tenant_name: tenantName || 'Klient',
          invoice_type: invoiceType,
          amount: parseFloat(amount),
          document_type: selectedDocumentType,
          upload_link: uploadLink,
          timestamp: new Date().toISOString()
        }
      });

      if (response.error) {
        console.error('Webhook error:', response.error);
        throw new Error('Nie udało się wysłać prośby do księgowości');
      }

      toast({
        title: "Sukces",
        description: `Wysłano prośbę o ${selectedDocumentType} do księgowości`
      });

      setAmount('');
      setNotes('');
      setIsOpen(false);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się wysłać do księgowości",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };
  const copyAccountingLink = (invoiceId: string) => {
    const link = `https://app.kokokamper.pl/accounting-upload/${invoiceId}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link skopiowany",
      description: "Link dla księgowości został skopiowany do schowka"
    });
  };
  return <Card>
      <CardHeader>
        <CardTitle>Panel księgowości</CardTitle>
        <CardDescription>Nr umowy: {contractNumber}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Send className="h-3 w-3 mr-1.5" />
              Wyślij do księgowości
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Wysyłanie do księgowości</DialogTitle>
              <DialogDescription>
                Wypełnij dane do wysłania dokumentu do księgowości
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Typ płatności</Label>
                <Select value={invoiceType} onValueChange={(value: any) => handleTypeChange(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reservation">Kwota rezerwacyjna</SelectItem>
                    <SelectItem value="main_payment">Kwota zasadnicza</SelectItem>
                    <SelectItem value="final">Faktura końcowa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Kwota (PLN)</Label>
                <Input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>Uwagi (opcjonalnie)</Label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Dodatkowe informacje..." rows={3} />
              </div>

              <div className="space-y-3">
                <Label>Wybierz typ dokumentu:</Label>
                <RadioGroup value={selectedDocumentType} onValueChange={(value: 'paragon' | 'faktura') => setSelectedDocumentType(value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="paragon" id="acc-paragon" />
                    <Label htmlFor="acc-paragon" className="cursor-pointer font-normal">
                      Paragon
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="faktura" id="acc-faktura" />
                    <Label htmlFor="acc-faktura" className="cursor-pointer font-normal">
                      Faktura
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <Button onClick={handleSubmitToAccounting} disabled={isSending || addInvoice.isPending} className="w-full">
                {isSending || addInvoice.isPending ? (
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

        {invoices && invoices.length > 0}
      </CardContent>
    </Card>;
};