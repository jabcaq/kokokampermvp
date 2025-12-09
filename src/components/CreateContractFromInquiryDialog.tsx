import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { addDays } from "date-fns";
import { MultiVehicleSelector, SelectedVehicle } from "@/components/MultiVehicleSelector";

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
  
  // Filter out archived vehicles
  const availableVehicles = vehicles.filter(v => v.status !== 'archived');
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
  const [preferredLanguage, setPreferredLanguage] = useState<"pl" | "en">("pl");

  // Multi-vehicle mode
  const [isMultiVehicleMode, setIsMultiVehicleMode] = useState(false);
  const [multiVehicles, setMultiVehicles] = useState<SelectedVehicle[]>([]);

  const [formData, setFormData] = useState({
    name: inquiry?.name || "",
    email: inquiry?.email || "",
    phone: inquiry?.phone || "",
    departureDate: inquiry?.departure_date || "",
    returnDate: inquiry?.return_date || "",
  });

  // Dodatki
  const [vehicleCleaning, setVehicleCleaning] = useState<string>("");
  const [vehicleAnimals, setVehicleAnimals] = useState<string>("");
  const [vehicleExtraEquipment, setVehicleExtraEquipment] = useState<string>("");

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

    // Validate vehicle selection based on mode
    if (isMultiVehicleMode) {
      const validVehicles = multiVehicles.filter(v => v.vehicleId);
      if (validVehicles.length === 0) {
        toast({
          title: "Błąd",
          description: "Wybierz co najmniej jeden pojazd.",
          variant: "destructive",
        });
        return;
      }
    } else if (!selectedVehicleId) {
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

      // Konwertuj datetime-local (Warsaw time) do UTC ISO string
      const parseWarsawToUTC = (dateTimeLocal: string) => {
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
      
      // Calculate payment dates in Warsaw timezone
      const todayWarsaw = toZonedTime(new Date(), WARSAW_TZ);
      const reservationDate = addDays(todayWarsaw, 2);
      
      const startDateObj = formData.departureDate 
        ? toZonedTime(new Date(formData.departureDate), WARSAW_TZ)
        : todayWarsaw;
      const mainPaymentDate = addDays(startDateObj, -14);

      // Helper function to generate contract number
      const generateContractNumber = async (vehicleType: string) => {
        let typePrefix = 'K';
        if (vehicleType.toLowerCase().includes('przyczepa') || vehicleType.toLowerCase().includes('trailer')) {
          typePrefix = 'P';
        }
        
        const year = new Date().getFullYear();
        const { data: existingContracts } = await supabase
          .from('contracts')
          .select('contract_number')
          .or(`contract_number.like.${typePrefix}/%/${year},contract_number.like.%/${year}/${typePrefix}`)
          .order('created_at', { ascending: false });

        let nextNumber = 1;
        if (existingContracts && existingContracts.length > 0) {
          const numbers = existingContracts
            .map(c => {
              const parts = c.contract_number.split('/');
              if (parts.length === 3) {
                return parseInt(parts[0] === typePrefix ? parts[1] : parts[0]);
              }
              return 0;
            })
            .filter(n => !isNaN(n));
          
          if (numbers.length > 0) {
            nextNumber = Math.max(...numbers) + 1;
          }
        }

        return `${nextNumber}/${year}/${typePrefix}`;
      };

      // Helper function to determine deposit amount
      const getDepositAmount = (vehicleType: string) => {
        if (customDepositAmount) {
          return parseFloat(depositAmount);
        } else if (vehicleType.toLowerCase().includes('przyczepa') || vehicleType.toLowerCase().includes('trailer')) {
          return 3000;
        } else if (isPremiumCamper) {
          return 8000;
        }
        return 5000;
      };

      if (isMultiVehicleMode) {
        // Multi-vehicle mode: create a contract for each vehicle
        const validVehicles = multiVehicles.filter(v => v.vehicleId);
        let createdCount = 0;
        let lastContractId = '';

        // Pre-fetch the highest contract numbers to avoid conflicts
        const year = new Date().getFullYear();
        const { data: existingContractsK } = await supabase
          .from('contracts')
          .select('contract_number')
          .or(`contract_number.like.K/%/${year},contract_number.like.%/${year}/K`)
          .order('created_at', { ascending: false });
        
        const { data: existingContractsP } = await supabase
          .from('contracts')
          .select('contract_number')
          .or(`contract_number.like.P/%/${year},contract_number.like.%/${year}/P`)
          .order('created_at', { ascending: false });
        
        const getHighestNumber = (contracts: any[], prefix: string) => {
          if (!contracts || contracts.length === 0) return 0;
          const numbers = contracts
            .map(c => {
              const parts = c.contract_number.split('/');
              if (parts.length === 3) {
                return parseInt(parts[0] === prefix ? parts[1] : parts[0]);
              }
              return 0;
            })
            .filter(n => !isNaN(n));
          return numbers.length > 0 ? Math.max(...numbers) : 0;
        };
        
        let nextNumberK = getHighestNumber(existingContractsK, 'K') + 1;
        let nextNumberP = getHighestNumber(existingContractsP, 'P') + 1;

        for (const vehicleItem of validVehicles) {
          const vehicleType = vehicleItem.type || 'Kamper';
          const typePrefix = vehicleType.toLowerCase().includes('przyczepa') || vehicleType.toLowerCase().includes('trailer') ? 'P' : 'K';
          
          let contractNumber: string;
          if (typePrefix === 'K') {
            contractNumber = `${nextNumberK}/${year}/${typePrefix}`;
            nextNumberK++;
          } else {
            contractNumber = `${nextNumberP}/${year}/${typePrefix}`;
            nextNumberP++;
          }
          
          const finalDepositAmount = getDepositAmount(vehicleType);

          const payments = {
            rezerwacyjna: {
              wysokosc: parseFloat(reservationAmount.toFixed(2)),
              data: reservationDate.toISOString().split('T')[0],
              rachunek: "34 1140 2004 0000 3802 8192 4912"
            },
            ...(isFullPaymentAsReservation ? {} : {
              zasadnicza: {
                wysokosc: parseFloat(mainPaymentAmount.toFixed(2)),
                data: mainPaymentDate.toISOString().split('T')[0],
                rachunek: "34 1140 2004 0000 3802 8192 4912"
              }
            }),
            kaucja: {
              wysokosc: finalDepositAmount,
              data: startDate.split('T')[0],
              rachunek: "34 1140 2004 0000 3802 8192 4912"
            }
          };

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
            vehicle_model: vehicleItem.model,
            registration_number: vehicleItem.registration_number,
            vehicle_vin: vehicleItem.vin,
            vehicle_next_inspection: vehicleItem.next_inspection_date || null,
            vehicle_insurance_number: vehicleItem.insurance_policy_number || null,
            vehicle_insurance_valid_until: vehicleItem.insurance_valid_until || null,
            vehicle_cleaning: vehicleItem.cleaning || null,
            vehicle_animals: vehicleItem.animals || null,
            vehicle_extra_equipment: vehicleItem.extra_equipment || null,
            inquiry_id: inquiry.id,
            inquiry_number: inquiry.inquiry_number,
            preferred_language: preferredLanguage,
          });

          lastContractId = newContract.id;
          createdCount++;
        }

        toast({
          title: "Sukces",
          description: `Utworzono ${createdCount} umów dla tego samego klienta.`,
        });

        onOpenChange(false);
        onSuccess?.();
        
        // Navigate to the last created contract
        if (lastContractId) {
          navigate(`/contracts/${lastContractId}`);
        }
      } else {
        // Single vehicle mode
        const selectedVehicle = availableVehicles.find(v => v.id === selectedVehicleId);
        if (!selectedVehicle) {
          throw new Error("Nie znaleziono wybranego pojazdu");
        }

        const contractNumber = await generateContractNumber(selectedVehicle.type || 'Kamper');
        const finalDepositAmount = getDepositAmount(selectedVehicle.type || '');

        const payments = {
          rezerwacyjna: {
            wysokosc: parseFloat(reservationAmount.toFixed(2)),
            data: reservationDate.toISOString().split('T')[0],
            rachunek: "34 1140 2004 0000 3802 8192 4912"
          },
          ...(isFullPaymentAsReservation ? {} : {
            zasadnicza: {
              wysokosc: parseFloat(mainPaymentAmount.toFixed(2)),
              data: mainPaymentDate.toISOString().split('T')[0],
              rachunek: "34 1140 2004 0000 3802 8192 4912"
            }
          }),
          kaucja: {
            wysokosc: finalDepositAmount,
            data: startDate.split('T')[0],
            rachunek: "34 1140 2004 0000 3802 8192 4912"
          }
        };

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
          vehicle_cleaning: vehicleCleaning || null,
          vehicle_animals: vehicleAnimals || null,
          vehicle_extra_equipment: vehicleExtraEquipment || null,
          inquiry_id: inquiry.id,
          inquiry_number: inquiry.inquiry_number,
          preferred_language: preferredLanguage,
        });

        toast({
          title: "Sukces",
          description: existingClient 
            ? "Umowa została utworzona dla istniejącego klienta." 
            : "Klient i umowa zostały utworzone.",
        });

        onOpenChange(false);
        onSuccess?.();
        
        navigate(`/contracts/${newContract.id}`);
      }
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
      const vehicle = availableVehicles.find(v => v.id === selectedVehicleId);
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
      setVehicleCleaning("");
      setVehicleAnimals("");
      setVehicleExtraEquipment("");
      setIsMultiVehicleMode(false);
      setMultiVehicles([]);
    }
  }, [inquiry, open]);

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[96vh]">
        <div className="mx-auto w-full max-w-2xl overflow-y-auto">
          <DrawerHeader className="text-left">
            <DrawerTitle>Utwórz klienta i umowę</DrawerTitle>
            <DrawerDescription>
              Dane z zapytania {inquiry?.inquiry_number}. Możesz je edytować przed utworzeniem.
            </DrawerDescription>
          </DrawerHeader>

          <div className="space-y-4 px-4 py-4">
          {/* Tryb wielu pojazdów */}
          <div className="flex items-center space-x-2 p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <Checkbox
              id="multi_vehicle_mode_inquiry"
              checked={isMultiVehicleMode}
              onCheckedChange={(checked) => {
                setIsMultiVehicleMode(checked === true);
                if (checked) {
                  setMultiVehicles([{
                    vehicleId: "",
                    model: "",
                    vin: "",
                    registration_number: "",
                    next_inspection_date: "",
                    insurance_policy_number: "",
                    insurance_valid_until: "",
                    additional_info: "",
                    type: "",
                    cleaning: "",
                    animals: "",
                    extra_equipment: "",
                  }]);
                  setSelectedVehicleId("");
                } else {
                  setMultiVehicles([]);
                }
              }}
            />
            <Label htmlFor="multi_vehicle_mode_inquiry" className="cursor-pointer font-medium">
              Umowa na wiele pojazdów
            </Label>
            <span className="text-xs text-muted-foreground ml-2">
              (dla wynajmu kilku kamperów jednocześnie)
            </span>
          </div>

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

          {isMultiVehicleMode ? (
            <div className="space-y-2">
              <Label>Pojazdy *</Label>
              <MultiVehicleSelector
                vehicles={availableVehicles}
                selectedVehicles={multiVehicles}
                onVehiclesChange={setMultiVehicles}
              />
            </div>
          ) : (
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
                        {availableVehicles.map((vehicle) => (
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
          )}

          {!isMultiVehicleMode && (
          <div className="space-y-4 pt-4 border-t">
            <h4 className="text-sm font-semibold text-foreground">Dodatki</h4>
            
            <div className="space-y-2">
              <Label htmlFor="vehicleCleaning">Sprzątanie dodatkowo</Label>
              <Select value={vehicleCleaning} onValueChange={setVehicleCleaning}>
                <SelectTrigger id="vehicleCleaning">
                  <SelectValue placeholder="Wybierz opcję" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tak">Tak</SelectItem>
                  <SelectItem value="Nie">Nie</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicleAnimals">Zwierzę</Label>
              <Select value={vehicleAnimals} onValueChange={setVehicleAnimals}>
                <SelectTrigger id="vehicleAnimals">
                  <SelectValue placeholder="Wybierz opcję" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tak">Tak</SelectItem>
                  <SelectItem value="Nie">Nie</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicleExtraEquipment">Wyposażenie dodatkowo</Label>
              <Select value={vehicleExtraEquipment} onValueChange={setVehicleExtraEquipment}>
                <SelectTrigger id="vehicleExtraEquipment">
                  <SelectValue placeholder="Wybierz opcję" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tak">Tak</SelectItem>
                  <SelectItem value="Nie">Nie</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          )}

          <div className="space-y-4 pt-4 border-t">
            <h4 className="text-sm font-semibold text-foreground">Preferowany język</h4>
            
            <div className="space-y-2">
              <Label htmlFor="preferredLanguage">Język dla formularzy klienta</Label>
              <Select value={preferredLanguage} onValueChange={(value: "pl" | "en") => setPreferredLanguage(value)}>
                <SelectTrigger id="preferredLanguage">
                  <SelectValue placeholder="Wybierz język" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pl">🇵🇱 Polski</SelectItem>
                  <SelectItem value="en">🇬🇧 English</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Ustaw preferowany język dla formularza kierowców. Możesz później pobrać tę wartość przez API dla Make.com.
              </p>
            </div>
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
              <span className="block font-medium">Daty płatności (automatyczne, czas warszawski):</span>
              <span className="block">• Data opłaty rezerwacyjnej: {(() => {
                const todayWarsaw = toZonedTime(new Date(), WARSAW_TZ);
                const resDate = addDays(todayWarsaw, 2);
                return resDate.toLocaleDateString('pl-PL');
              })()}</span>
              {!isFullPaymentAsReservation && (() => {
                if (formData.departureDate) {
                  const startDate = toZonedTime(new Date(formData.departureDate), WARSAW_TZ);
                  const mainPaymentDate = addDays(startDate, -14);
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

        <DrawerFooter className="pt-4 px-4">
          <div className="flex gap-3 w-full max-w-2xl mx-auto">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
              className="flex-1"
            >
              Anuluj
            </Button>
            <Button onClick={handleCreate} disabled={isCreating} className="flex-1">
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Utwórz
            </Button>
          </div>
        </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
