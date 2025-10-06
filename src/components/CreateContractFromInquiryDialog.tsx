import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAddClient } from "@/hooks/useClients";
import { useAddContract } from "@/hooks/useContracts";
import { Loader2 } from "lucide-react";

interface Inquiry {
  id: string;
  inquiry_number?: string;
  name: string;
  email: string;
  phone?: string;
  departure_date?: string;
  return_date?: string;
}

interface CreateContractFromInquiryDialogProps {
  inquiry: Inquiry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const CreateContractFromInquiryDialog = ({
  inquiry,
  open,
  onOpenChange,
  onSuccess,
}: CreateContractFromInquiryDialogProps) => {
  const { toast } = useToast();
  const addClient = useAddClient();
  const addContract = useAddContract();
  const [isCreating, setIsCreating] = useState(false);

  const [formData, setFormData] = useState({
    name: inquiry?.name || "",
    email: inquiry?.email || "",
    phone: inquiry?.phone || "",
    departureDate: inquiry?.departure_date || "",
    returnDate: inquiry?.return_date || "",
  });

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCreate = async () => {
    if (!inquiry) return;

    if (!formData.name || !formData.email) {
      toast({
        title: "Błąd",
        description: "Nazwa i email są wymagane.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      // Utwórz klienta
      const client = await addClient.mutateAsync({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
      });

      // Utwórz umowę
      await addContract.mutateAsync({
        contract_number: `TMP-${Date.now()}`,
        client_id: client.id,
        tenant_name: formData.name,
        tenant_email: formData.email,
        tenant_phone: formData.phone || null,
        start_date: formData.departureDate || new Date().toISOString().split('T')[0],
        end_date: formData.returnDate || new Date().toISOString().split('T')[0],
        status: 'pending',
        value: null,
        vehicle_model: "Do uzupełnienia",
        registration_number: "Do uzupełnienia",
        inquiry_id: inquiry.id,
        inquiry_number: inquiry.inquiry_number,
      });

      toast({
        title: "Sukces",
        description: "Klient i umowa zostały utworzone.",
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error creating client and contract:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się utworzyć klienta i umowy.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Reset form when inquiry changes
  useState(() => {
    if (inquiry && open) {
      setFormData({
        name: inquiry.name || "",
        email: inquiry.email || "",
        phone: inquiry.phone || "",
        departureDate: inquiry.departure_date || "",
        returnDate: inquiry.return_date || "",
      });
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Utwórz klienta i umowę</DialogTitle>
          <DialogDescription>
            Dane z zapytania {inquiry?.inquiry_number}. Możesz je edytować przed utworzeniem.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Imię i nazwisko *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => updateFormData('name', e.target.value)}
              placeholder="Jan Kowalski"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => updateFormData('email', e.target.value)}
              placeholder="jan@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefon</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => updateFormData('phone', e.target.value)}
              placeholder="+48 123 456 789"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="departureDate">Data wyjazdu</Label>
              <Input
                id="departureDate"
                type="date"
                value={formData.departureDate}
                onChange={(e) => updateFormData('departureDate', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="returnDate">Data powrotu</Label>
              <Input
                id="returnDate"
                type="date"
                value={formData.returnDate}
                onChange={(e) => updateFormData('returnDate', e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCreating}
          >
            Anuluj
          </Button>
          <Button onClick={handleCreate} disabled={isCreating}>
            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Utwórz
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
