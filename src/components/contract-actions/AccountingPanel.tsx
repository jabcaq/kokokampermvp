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
import { Checkbox } from "@/components/ui/checkbox";
import { useUpdateContract } from "@/hooks/useContracts";
interface AccountingPanelProps {
  contractId: string;
  contractNumber: string;
  payments?: any;
  tenantName?: string;
  depositReceived?: boolean;
  tenantNip?: string;
}
export const AccountingPanel = ({
  contractId,
  contractNumber,
  payments,
  tenantName,
  depositReceived = false,
  tenantNip
}: AccountingPanelProps) => {
  const {
    toast
  } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [invoiceType, setInvoiceType] = useState<'reservation' | 'main_payment' | 'final'>('reservation');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedDocumentType, setSelectedDocumentType] = useState<'paragon' | 'faktura' | 'internal_invoice'>(tenantNip ? 'faktura' : 'paragon');
  const [invoiceTitle, setInvoiceTitle] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isDepositReceived, setIsDepositReceived] = useState(depositReceived);
  const [isSendingDepositNotification, setIsSendingDepositNotification] = useState(false);
  const addInvoice = useAddContractInvoice();
  const updateContract = useUpdateContract();
  const {
    data: invoices
  } = useContractInvoices(contractId);

  useEffect(() => {
    setIsDepositReceived(depositReceived);
  }, [depositReceived]);
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
        files: [],
        is_archived: false
      });

      const uploadLink = `https://app.kokokamper.pl/invoice-upload/${result.id}`;

      // Przygotowanie danych do wysłania
      const webhookData: any = {
        invoice_id: result.id,
        contract_id: contractId,
        contract_number: contractNumber,
        tenant_name: tenantName || 'Klient',
        invoice_type: invoiceType,
        amount: parseFloat(amount),
        document_type: selectedDocumentType,
        upload_link: uploadLink,
        timestamp: new Date().toISOString()
      };

      // Dodaj dodatkowe pola dla faktury wewnętrznej
      if (selectedDocumentType === 'internal_invoice') {
        webhookData.invoice_title = invoiceTitle || null;
        webhookData.service_description = serviceDescription || null;
      }

      // Wysyłanie webhooka do księgowości
      const response = await supabase.functions.invoke('send-accounting-request', {
        body: webhookData
      });

      if (response.error) {
        console.error('Webhook error:', response.error);
        throw new Error('Nie udało się wysłać prośby do księgowości');
      }

      toast({
        title: "Sukces",
        description: `Wysłano prośbę o ${
          selectedDocumentType === 'internal_invoice' 
            ? 'fakturę wewnętrzną' 
            : selectedDocumentType
        } do księgowości`
      });

      setAmount('');
      setNotes('');
      setInvoiceTitle('');
      setServiceDescription('');
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
  const handleDepositReceivedChange = async (checked: boolean) => {
    setIsSendingDepositNotification(true);
    try {
      // Update contract in database
      await updateContract.mutateAsync({
        id: contractId,
        updates: {
          deposit_received: checked,
          deposit_received_at: checked ? new Date().toISOString() : null,
        }
      });

      if (checked) {
        // Get deposit amount from payments
        const depositAmount = payments?.kaucja?.wysokosc || 0;
        
        // Send webhook notification
        const webhookResponse = await fetch('https://hook.eu2.make.com/hg6o7ehx1b6nar2xsshlpmqkkkf11fkp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contract_id: contractId,
            contract_number: contractNumber,
            tenant_name: tenantName || 'Klient',
            deposit_amount: depositAmount,
            timestamp: new Date().toISOString(),
          }),
        });

        if (!webhookResponse.ok) {
          console.error('Webhook error:', await webhookResponse.text());
          throw new Error('Nie udało się wysłać powiadomienia');
        }

        toast({
          title: "Sukces",
          description: "Wysłano powiadomienie o przyjęciu kaucji"
        });
      } else {
        toast({
          title: "Zaktualizowano",
          description: "Status kaucji został zmieniony"
        });
      }

      setIsDepositReceived(checked);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się zaktualizować statusu kaucji",
        variant: "destructive"
      });
    } finally {
      setIsSendingDepositNotification(false);
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
  return <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 h-full">
      <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-b">
        <CardTitle className="text-lg font-semibold">Panel księgowości</CardTitle>
        <CardDescription className="text-xs text-muted-foreground">Nr umowy: {contractNumber}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-6 flex flex-col h-[calc(100%-5rem)]">
        <div className="space-y-2 flex-1">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-muted/30 to-muted/50 rounded-xl border border-border/50 hover:border-border transition-all duration-200 hover:shadow-sm">{/* Deposit status */}
            <div className="flex items-center space-x-3">
              <Checkbox 
                id="deposit-received" 
                checked={isDepositReceived}
                onCheckedChange={handleDepositReceivedChange}
                disabled={isSendingDepositNotification}
                className="h-5 w-5"
              />
              <Label 
                htmlFor="deposit-received" 
                className="text-sm font-medium cursor-pointer"
              >
                Kaucja przyjęta
              </Label>
              {isSendingDepositNotification && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground ml-2" />
              )}
            </div>
            <Badge 
              variant={isDepositReceived ? "default" : "secondary"} 
              className={`ml-2 ${isDepositReceived ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-500 hover:bg-orange-600'} transition-colors`}
            >
              {isDepositReceived ? '✓ Wpłacona' : '⏳ Oczekiwanie'}
            </Badge>
          </div>
          {isDepositReceived && depositReceived && (
            <p className="text-xs text-muted-foreground px-3 animate-fade-in">
              Status kaucji może zostać również zaktualizowany przez Telegram
            </p>
          )}
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button 
              size="sm" 
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transition-all duration-200 mt-auto"
            >
              <Send className="h-4 w-4 mr-2" />
              Wyślij do księgowości
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Wysyłanie do księgowości</DialogTitle>
              <DialogDescription>
                Wypełnij dane do wysłania dokumentu do księgowości
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-3">
                <Label>Wybierz typ dokumentu:</Label>
                <RadioGroup value={selectedDocumentType} onValueChange={(value: 'paragon' | 'faktura' | 'internal_invoice') => setSelectedDocumentType(value)}>
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
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="internal_invoice" id="acc-internal" />
                    <Label htmlFor="acc-internal" className="cursor-pointer font-normal">
                      Faktura wewnętrzna (JDG → Spółka)
                    </Label>
                  </div>
                </RadioGroup>
                <p className="text-sm text-muted-foreground">
                  Jeśli klient nie ma NIPu, wybierz Paragon
                </p>
              </div>

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
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Dodatkowe informacje..." rows={3} />
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