import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAddClient } from "@/hooks/useClients";
import { useAddContract } from "@/hooks/useContracts";
import { useVehicles } from "@/hooks/useVehicles";
import { Loader2, Search } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

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
  const { data: vehicles = [] } = useVehicles();
  const [isCreating, setIsCreating] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [vehicleSearchOpen, setVehicleSearchOpen] = useState(false);

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

    if (!selectedVehicleId) {
      toast({
        title: "Błąd",
        description: "Wybierz pojazd dla umowy.",
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

      // Znajdź wybrany pojazd
      const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);
      if (!selectedVehicle) {
        throw new Error("Nie znaleziono wybranego pojazdu");
      }

      // Określ skrót typu pojazdu (K dla kamperów, P dla przyczep)
      const vehicleType = selectedVehicle.type || '';
      let typePrefix = 'K'; // domyślnie kamper
      
      if (vehicleType.toLowerCase().includes('przyczepa') || vehicleType.toLowerCase().includes('trailer')) {
        typePrefix = 'P';
      } else if (vehicleType.toLowerCase().includes('kamper') || vehicleType.toLowerCase().includes('van')) {
        typePrefix = 'K';
      }
      
      const year = new Date().getFullYear();
      
      // Pobierz ostatni numer dla tego typu w tym roku
      const { data: existingContracts } = await supabase
        .from('contracts')
        .select('contract_number')
        .like('contract_number', `${typePrefix}/%/${year}`)
        .order('created_at', { ascending: false })
        .limit(1);

      let nextNumber = 1;
      if (existingContracts && existingContracts.length > 0) {
        const lastNumber = existingContracts[0].contract_number;
        const parts = lastNumber.split('/');
        if (parts.length === 3) {
          nextNumber = parseInt(parts[1]) + 1;
        }
      }

      const contractNumber = `${typePrefix}/${nextNumber}/${year}`;

      // Utwórz umowę
      await addContract.mutateAsync({
        contract_number: contractNumber,
        client_id: client.id,
        tenant_name: formData.name,
        tenant_email: formData.email,
        tenant_phone: formData.phone || null,
        start_date: formData.departureDate || new Date().toISOString().split('T')[0],
        end_date: formData.returnDate || new Date().toISOString().split('T')[0],
        status: 'pending',
        value: null,
        vehicle_model: selectedVehicle.model,
        registration_number: selectedVehicle.registration_number,
        vehicle_vin: selectedVehicle.vin,
        vehicle_next_inspection: selectedVehicle.next_inspection_date,
        vehicle_insurance_number: selectedVehicle.insurance_policy_number,
        vehicle_insurance_valid_until: selectedVehicle.insurance_valid_until,
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
  useEffect(() => {
    if (inquiry && open) {
      setFormData({
        name: inquiry.name || "",
        email: inquiry.email || "",
        phone: inquiry.phone || "",
        departureDate: inquiry.departure_date || "",
        returnDate: inquiry.return_date || "",
      });
      setSelectedVehicleId("");
    }
  }, [inquiry, open]);

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);

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

          <div className="space-y-2">
            <Label htmlFor="vehicle">Pojazd *</Label>
            <Popover open={vehicleSearchOpen} onOpenChange={setVehicleSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={vehicleSearchOpen}
                  className="w-full justify-between"
                >
                  {selectedVehicle ? (
                    <span className="flex items-center gap-2">
                      <span className="font-medium">{selectedVehicle.registration_number}</span>
                      <span className="text-muted-foreground">-</span>
                      <span>{selectedVehicle.model}</span>
                      {selectedVehicle.type && (
                        <span className="text-xs text-muted-foreground">({selectedVehicle.type})</span>
                      )}
                    </span>
                  ) : (
                    "Wybierz pojazd..."
                  )}
                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[500px] p-0 bg-popover" align="start">
                <Command className="bg-popover">
                  <CommandInput placeholder="Szukaj po rejestracji, modelu lub typie..." />
                  <CommandList>
                    <CommandEmpty>Nie znaleziono pojazdu.</CommandEmpty>
                    <CommandGroup>
                      {vehicles.map((vehicle) => (
                        <CommandItem
                          key={vehicle.id}
                          value={`${vehicle.registration_number} ${vehicle.model} ${vehicle.type || ''}`}
                          onSelect={() => {
                            setSelectedVehicleId(vehicle.id);
                            setVehicleSearchOpen(false);
                          }}
                          className="cursor-pointer"
                        >
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{vehicle.registration_number}</span>
                              <span className="text-muted-foreground">-</span>
                              <span>{vehicle.model}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {vehicle.type && <span>Typ: {vehicle.type}</span>}
                              {vehicle.type && vehicle.vin && <span> • </span>}
                              {vehicle.vin && <span>VIN: {vehicle.vin}</span>}
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
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
