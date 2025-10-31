import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { useAddClient, Client } from "@/hooks/useClients";
import { useAddContract } from "@/hooks/useContracts";
import { useVehicles } from "@/hooks/useVehicles";
import { Loader2, Search, Info } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

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
  const navigate = useNavigate();
  const addClient = useAddClient();
  const addContract = useAddContract();
  const { data: vehicles = [] } = useVehicles();
  const [isCreating, setIsCreating] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [vehicleSearchOpen, setVehicleSearchOpen] = useState(false);
  const [existingClient, setExistingClient] = useState<Client | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  
  // Payment states
  const [totalAmount, setTotalAmount] = useState("");
  const [isFullPaymentAsReservation, setIsFullPaymentAsReservation] = useState(false);
  const [isPremiumCamper, setIsPremiumCamper] = useState(false);
  const [customDepositAmount, setCustomDepositAmount] = useState(false);
  const [depositAmount, setDepositAmount] = useState("5000");

  const [formData, setFormData] = useState({
    name: inquiry?.name || "",
    email: inquiry?.email || "",
    phone: inquiry?.phone || "",
    departureDate: inquiry?.departure_date || "",
    returnDate: inquiry?.return_date || "",
  });

  const WARSAW_TZ = "Europe/Warsaw";

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

    if (!totalAmount) {
      toast({
        title: "Błąd",
        description: "Wpisz kwotę całkowitą.",
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
      // Użyj istniejącego klienta lub utwórz nowego
      let clientId: string;
      
      if (existingClient) {
        clientId = existingClient.id;
      } else {
        const newClient = await addClient.mutateAsync({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
        });
        clientId = newClient.id;
      }

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

      // Konwertuj datetime-local (Warsaw time) do UTC ISO string
      const parseWarsawToUTC = (dateTimeLocal: string) => {
        // datetime-local format: "2025-02-10T10:00"
        // Treat this as Warsaw time and convert to UTC
        const warsawDate = new Date(dateTimeLocal);
        return fromZonedTime(warsawDate, WARSAW_TZ).toISOString();
      };

      const startDate = formData.departureDate 
        ? parseWarsawToUTC(formData.departureDate)
        : fromZonedTime(new Date(), WARSAW_TZ).toISOString();
      const endDate = formData.returnDate 
        ? parseWarsawToUTC(formData.returnDate)
        : fromZonedTime(new Date(), WARSAW_TZ).toISOString();

      // Calculate payment amounts
      const total = parseFloat(totalAmount);
      const reservationAmount = isFullPaymentAsReservation ? total : total * 0.30;
      const mainPaymentAmount = isFullPaymentAsReservation ? 0 : total * 0.70;
      
      // Calculate payment dates
      const today = new Date();
      const reservationDate = new Date(today);
      reservationDate.setDate(reservationDate.getDate() + 2);
      
      const startDateObj = formData.departureDate ? new Date(formData.departureDate) : new Date();
      const mainPaymentDate = new Date(startDateObj);
      mainPaymentDate.setDate(mainPaymentDate.getDate() - 14);

      // Determine deposit amount
      let finalDepositAmount = 5000;
      if (customDepositAmount) {
        finalDepositAmount = parseFloat(depositAmount);
      } else if (vehicleType.toLowerCase().includes('przyczepa') || vehicleType.toLowerCase().includes('trailer')) {
        finalDepositAmount = 3000;
      } else if (isPremiumCamper) {
        finalDepositAmount = 8000;
      }

      // Create payments object
      const payments = {
        rezerwacyjna: {
          wysokosc: reservationAmount.toFixed(2),
          termin: toZonedTime(reservationDate, WARSAW_TZ).toISOString().split('T')[0],
          rachunek: "72 1140 2004 0000 3702 8191 5344"
        },
        ...(isFullPaymentAsReservation ? {} : {
          zasadnicza: {
            wysokosc: mainPaymentAmount.toFixed(2),
            termin: toZonedTime(mainPaymentDate, WARSAW_TZ).toISOString().split('T')[0],
            rachunek: "72 1140 2004 0000 3702 8191 5344"
          }
        }),
        kaucja: {
          wysokosc: finalDepositAmount.toFixed(2),
          termin: startDate.split('T')[0],
          rachunek: "72 1140 2004 0000 3702 8191 5344"
        }
      };

      // Utwórz umowę
      const newContract = await addContract.mutateAsync({
        contract_number: contractNumber,
        client_id: clientId,
        tenant_name: formData.name,
        tenant_email: formData.email,
        tenant_phone: formData.phone || null,
        start_date: startDate,
        end_date: endDate,
        status: 'pending',
        value: total,
        payments: payments,
        is_full_payment_as_reservation: isFullPaymentAsReservation,
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
        description: existingClient 
          ? "Umowa została utworzona dla istniejącego klienta." 
          : "Klient i umowa zostały utworzone.",
      });

      onOpenChange(false);
      onSuccess?.();
      
      // Przekieruj do szczegółów utworzonej umowy
      navigate(`/contracts/${newContract.id}`);
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

  // Check for existing client by email
  useEffect(() => {
    const checkExistingClient = async () => {
      if (!formData.email || formData.email.length < 5) {
        setExistingClient(null);
        return;
      }

      setCheckingEmail(true);
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('email', formData.email.toLowerCase())
          .maybeSingle();

        if (error) throw error;
        setExistingClient(data);
      } catch (error) {
        console.error('Error checking existing client:', error);
      } finally {
        setCheckingEmail(false);
      }
    };

    const timeoutId = setTimeout(checkExistingClient, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.email]);

  // Update deposit amount when vehicle type changes
  useEffect(() => {
    if (selectedVehicleId && !customDepositAmount) {
      const vehicle = vehicles.find(v => v.id === selectedVehicleId);
      if (vehicle) {
        const vehicleType = vehicle.type || '';
        if (vehicleType.toLowerCase().includes('przyczepa') || vehicleType.toLowerCase().includes('trailer')) {
          setDepositAmount("3000");
          setIsPremiumCamper(false);
        } else if (isPremiumCamper) {
          setDepositAmount("8000");
        } else {
          setDepositAmount("5000");
        }
      }
    }
  }, [selectedVehicleId, isPremiumCamper, customDepositAmount, vehicles]);

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
      setExistingClient(null);
      setTotalAmount("");
      setIsFullPaymentAsReservation(false);
      setIsPremiumCamper(false);
      setCustomDepositAmount(false);
      setDepositAmount("5000");
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
            {checkingEmail && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Sprawdzanie...
              </p>
            )}
          </div>

          {existingClient && (
            <Alert className="border-primary/50 bg-primary/5">
              <Info className="h-4 w-4 text-primary" />
              <AlertDescription className="text-sm">
                <strong>Klient już istnieje w bazie:</strong>
                <div className="mt-1">
                  <div><strong>Imię i nazwisko:</strong> {existingClient.name}</div>
                  <div><strong>Email:</strong> {existingClient.email}</div>
                  {existingClient.phone && <div><strong>Telefon:</strong> {existingClient.phone}</div>}
                  <div className="mt-2 text-muted-foreground">
                    Zostanie utworzona tylko nowa umowa dla tego klienta.
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

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
              <Label htmlFor="departureDate">Data i godzina wydania</Label>
              <Input
                id="departureDate"
                type="datetime-local"
                value={formData.departureDate}
                onChange={(e) => updateFormData('departureDate', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="returnDate">Data i godzina zwrotu</Label>
              <Input
                id="returnDate"
                type="datetime-local"
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

          <div className="space-y-4 pt-4 border-t">
            <h4 className="text-sm font-semibold text-foreground">Opłaty</h4>
            
            <div className="space-y-2">
              <Label htmlFor="totalAmount">Kwota całkowita *</Label>
              <Input
                id="totalAmount"
                type="number"
                step="0.01"
                placeholder="10000.00"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="fullPaymentAsReservation"
                checked={isFullPaymentAsReservation}
                onCheckedChange={(checked) => setIsFullPaymentAsReservation(checked === true)}
              />
              <Label htmlFor="fullPaymentAsReservation" className="cursor-pointer text-sm">
                Cała kwota jako opłata rezerwacyjna (bez opłaty zasadniczej)
              </Label>
            </div>

            {selectedVehicle && selectedVehicle.type && (selectedVehicle.type.toLowerCase().includes('kamper') || selectedVehicle.type.toLowerCase().includes('van')) && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="premiumCamper"
                  checked={isPremiumCamper}
                  onCheckedChange={(checked) => {
                    const isPremium = checked === true;
                    setIsPremiumCamper(isPremium);
                    if (!customDepositAmount) {
                      setDepositAmount(isPremium ? "8000" : "5000");
                    }
                  }}
                />
                <Label htmlFor="premiumCamper" className="cursor-pointer text-sm">
                  Kamper Premium+/Prestige+ (kaucja 8000 zł)
                </Label>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="customDepositAmount"
                checked={customDepositAmount}
                onCheckedChange={(checked) => setCustomDepositAmount(checked === true)}
              />
              <Label htmlFor="customDepositAmount" className="cursor-pointer text-sm">
                Niestandardowa kwota kaucji
              </Label>
            </div>

            {customDepositAmount && (
              <div className="space-y-2">
                <Label htmlFor="depositAmount">Kwota kaucji *</Label>
                <Input
                  id="depositAmount"
                  type="number"
                  step="0.01"
                  placeholder="5000.00"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                />
              </div>
            )}

            {totalAmount && (
              <div className="text-xs text-muted-foreground space-y-1 mt-2">
                {isFullPaymentAsReservation ? (
                  <>
                    <p>• Opłata rezerwacyjna (100%): {parseFloat(totalAmount).toFixed(2)} zł</p>
                    <p>• Opłata zasadnicza: brak (cała kwota w rezerwacji)</p>
                  </>
                ) : (
                  <>
                    <p>• Opłata rezerwacyjna (30%): {(parseFloat(totalAmount) * 0.30).toFixed(2)} zł</p>
                    <p>• Opłata zasadnicza (70%): {(parseFloat(totalAmount) * 0.70).toFixed(2)} zł</p>
                  </>
                )}
              </div>
            )}

            <p className="text-xs text-muted-foreground space-y-1">
              <span className="block font-medium">Daty płatności (automatyczne):</span>
              <span className="block">• Data opłaty rezerwacyjnej: {(() => {
                const today = new Date();
                today.setDate(today.getDate() + 2);
                return today.toLocaleDateString('pl-PL');
              })()}</span>
              {!isFullPaymentAsReservation && (() => {
                if (formData.departureDate) {
                  const startDate = new Date(formData.departureDate);
                  const mainPaymentDate = new Date(startDate);
                  mainPaymentDate.setDate(mainPaymentDate.getDate() - 14);
                  return <span className="block">• Data opłaty zasadniczej: {mainPaymentDate.toLocaleDateString('pl-PL')}</span>;
                }
                return <span className="block">• Data opłaty zasadniczej: zostanie obliczona po wybraniu daty wyjazdu</span>;
              })()}
              <span className="block">• Data kaucji: dzień rozpoczęcia wynajmu</span>
              <span className="block">• Kwota kaucji: {customDepositAmount 
                ? `${depositAmount} zł (niestandardowa)` 
                : selectedVehicle && (selectedVehicle.type?.toLowerCase().includes('przyczepa') || selectedVehicle.type?.toLowerCase().includes('trailer'))
                  ? "3000 zł" 
                  : isPremiumCamper 
                    ? "8000 zł (Premium+/Prestige+)" 
                    : "5000 zł"}</span>
              <span className="block">• Rachunki bankowe są automatycznie przypisywane</span>
            </p>
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
