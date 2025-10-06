import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAddContractInvoice, useContractInvoices } from "@/hooks/useContractInvoices";
import { Send, ExternalLink, FileCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
interface AccountingPanelProps {
  contractId: string;
  contractNumber: string;
}
export const AccountingPanel = ({
  contractId,
  contractNumber
}: AccountingPanelProps) => {
  const {
    toast
  } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [invoiceType, setInvoiceType] = useState<'reservation' | 'main_payment' | 'final'>('reservation');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
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
  const handleSubmitToAccounting = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Błąd",
        description: "Podaj poprawną kwotę",
        variant: "destructive"
      });
      return;
    }
    try {
      const result = await addInvoice.mutateAsync({
        contract_id: contractId,
        invoice_type: invoiceType,
        amount: parseFloat(amount),
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        invoice_file_url: null,
        invoice_uploaded_at: null,
        notes: notes || null,
        files: []
      });
      const accountingLink = `${window.location.origin}/accounting-upload/${result.id}`;
      toast({
        title: "Sukces",
        description: "Wysłano do księgowości"
      });

      // Copy link to clipboard
      navigator.clipboard.writeText(accountingLink);
      toast({
        title: "Link skopiowany",
        description: "Link dla księgowości został skopiowany do schowka"
      });
      setAmount('');
      setNotes('');
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się wysłać do księgowości",
        variant: "destructive"
      });
    }
  };
  const copyAccountingLink = (invoiceId: string) => {
    const link = `${window.location.origin}/accounting-upload/${invoiceId}`;
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
                <Select value={invoiceType} onValueChange={(value: any) => setInvoiceType(value)}>
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
                <Label>Notatki</Label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Dodatkowe informacje..." rows={3} />
              </div>
              <Button onClick={handleSubmitToAccounting} disabled={addInvoice.isPending} className="w-full">
                Wyślij
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {invoices && invoices.length > 0}
      </CardContent>
    </Card>;
};