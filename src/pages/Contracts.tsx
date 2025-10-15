import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Calendar, Edit, Eye, Loader2, Trash2, Check, ChevronsUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useContracts, useDeleteContract, useAddContract } from "@/hooks/useContracts";
import { useClients } from "@/hooks/useClients";
import { useVehicles } from "@/hooks/useVehicles";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

const statusConfig = {
  active: { label: "Aktywna", className: "bg-primary/10 text-primary border-primary/20" },
  pending: { label: "Oczekująca", className: "bg-secondary/10 text-secondary border-secondary/20" },
  completed: { label: "Zakończona", className: "bg-muted text-muted-foreground border-muted" },
  cancelled: { label: "Anulowana", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

const Contracts = () => {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteContractId, setDeleteContractId] = useState<string | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [clientSearchOpen, setClientSearchOpen] = useState(false);
  const [vehicleSearchOpen, setVehicleSearchOpen] = useState(false);
  const [generatedContractNumber, setGeneratedContractNumber] = useState<string>("");
  const [totalAmount, setTotalAmount] = useState<string>("");
  const [isFullPaymentAsReservation, setIsFullPaymentAsReservation] = useState(false);
  const [customDepositAmount, setCustomDepositAmount] = useState(false);
  const [isPremiumCamper, setIsPremiumCamper] = useState(false);
  const [depositAmount, setDepositAmount] = useState<string>("");
  const [insuranceWarning, setInsuranceWarning] = useState("");
  const [vehicleData, setVehicleData] = useState({
    model: "",
    vin: "",
    registration_number: "",
    next_inspection_date: "",
    insurance_policy_number: "",
    insurance_valid_until: "",
    additional_info: "",
    type: "" as "Kamper" | "Przyczepa" | "",
    cleaning: "" as "Tak" | "Nie" | "",
    animals: "" as "Tak" | "Nie" | "",
    extra_equipment: "" as "Tak" | "Nie" | ""
  });
  const { toast } = useToast();
  
  const { data: contractsData = [], isLoading } = useContracts();
  const { data: vehicles = [] } = useVehicles();
  const { data: clients = [] } = useClients();
  const deleteContractMutation = useDeleteContract();
  const addContractMutation = useAddContract();
  
  // Automatycznie otwórz dialog z wybranym klientem jeśli przekazano clientId
  useEffect(() => {
    const state = location.state as { clientId?: string } | null;
    if (state?.clientId) {
      setSelectedClientId(state.clientId);
      setIsDialogOpen(true);
    }
  }, [location]);
  
  const handleVehicleSelect = async (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
    const selectedVehicle = vehicles.find(v => v.id === vehicleId);
    if (selectedVehicle) {
      setVehicleData({
        model: selectedVehicle.model,
        vin: selectedVehicle.vin,
        registration_number: selectedVehicle.registration_number,
        next_inspection_date: selectedVehicle.next_inspection_date || "",
        insurance_policy_number: selectedVehicle.insurance_policy_number || "",
        insurance_valid_until: selectedVehicle.insurance_valid_until || "",
        additional_info: selectedVehicle.additional_info || "",
        type: selectedVehicle.type || "",
        cleaning: "",
        animals: "",
        extra_equipment: ""
      });
      
      // Set default deposit amount based on vehicle type
      if (!customDepositAmount) {
        if (selectedVehicle.type === "Przyczepa") {
          setDepositAmount("3000");
        } else if (selectedVehicle.type === "Kamper") {
          setDepositAmount(isPremiumCamper ? "8000" : "5000");
        }
      }
      
      // Generate contract number based on vehicle type
      if (selectedVehicle.type) {
        const prefix = selectedVehicle.type === "Kamper" ? "K" : "P";
        const currentYear = new Date().getFullYear();
        
        // Find the last contract number for this vehicle type
        const { data: lastContract } = await supabase
          .from('contracts')
          .select('contract_number')
          .like('contract_number', `${prefix}/%/${currentYear}`)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        let nextNumber = 1;
        if (lastContract?.contract_number) {
          const parts = lastContract.contract_number.split('/');
          if (parts.length === 3) {
            nextNumber = parseInt(parts[1]) + 1;
          }
        }
        
        const newContractNumber = `${prefix}/${nextNumber}/${currentYear}`;
        setGeneratedContractNumber(newContractNumber);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Get selected client to pre-fill tenant data
    const selectedClient = clients.find(c => c.id === selectedClientId);
    
    // Calculate payment amounts
    const total = parseFloat(totalAmount) || 0;
    const reservationAmount = isFullPaymentAsReservation ? total.toFixed(2) : (total * 0.30).toFixed(2);
    const mainAmount = isFullPaymentAsReservation ? "0.00" : (total * 0.70).toFixed(2);
    
    console.log('Total amount:', total, 'from totalAmount:', totalAmount);

    // Normalize dates
    const startDateInput = (formData.get('okres_od') as string) || "";
    const endDateInput = (formData.get('okres_do') as string) || "";
    const toDateOnly = (v: string) => (v ? v.split('T')[0] : null);
    const startDate = toDateOnly(startDateInput);
    const endDate = toDateOnly(endDateInput);

    // Helper for optional date fields (send null, not empty string)
    const emptyToNull = (v: string | undefined | null) => (v && v.trim() !== "" ? v : null);
    
    // Automatyczne obliczanie dat płatności
    // Data rezerwacyjna: dzisiaj + 2 dni
    const today = new Date();
    const reservationDate = new Date(today);
    reservationDate.setDate(reservationDate.getDate() + 2);
    const reservationDateStr = reservationDate.toISOString().split('T')[0];
    
    // Data zasadnicza: 14 dni przed datą rozpoczęcia wynajmu
    let mainPaymentDateStr = "";
    if (startDate) {
      const mainPaymentDate = new Date(startDate);
      mainPaymentDate.setDate(mainPaymentDate.getDate() - 14);
      mainPaymentDateStr = mainPaymentDate.toISOString().split('T')[0];
    }
    
    // Przygotuj dane płatności z automatycznymi kwotami i datami
    const getDefaultDeposit = () => {
      if (vehicleData.type === "Przyczepa") return 3000;
      if (vehicleData.type === "Kamper") return isPremiumCamper ? 8000 : 5000;
      return 5000;
    };
    const finalDepositAmount = customDepositAmount ? parseFloat(depositAmount) : getDefaultDeposit();
    
    const paymentsData: any = {
      rezerwacyjna: {
        data: reservationDateStr,
        wysokosc: parseFloat(reservationAmount),
        rachunek: "34 1140 2004 0000 3802 8192 4912",
      },
      kaucja: {
        data: startDate || "",
        wysokosc: finalDepositAmount,
        rachunek: "34 1140 2004 0000 3802 8192 4912",
      },
    };

    // Only add main payment if not full payment as reservation
    if (!isFullPaymentAsReservation) {
      paymentsData.zasadnicza = {
        data: mainPaymentDateStr,
        wysokosc: parseFloat(mainAmount),
        rachunek: "34 1140 2004 0000 3802 8192 4912",
      };
    }
    
    try {
      await addContractMutation.mutateAsync({
        contract_number: generatedContractNumber || (formData.get('umowa_numer') as string),
        umowa_text: formData.get('umowa_text') as string,
        client_id: selectedClientId,
        vehicle_model: vehicleData.model || (formData.get('przedmiot_model') as string) || "",
        registration_number: vehicleData.registration_number || (formData.get('przedmiot_nr_rej') as string) || "",
        start_date: startDate as string,
        end_date: endDate as string,
        status: 'pending',
        value: total > 0 ? total : null,
        is_full_payment_as_reservation: isFullPaymentAsReservation,
        tenant_company_name: formData.get('tenant_company_name') as string || "",
        lessor_name: "Koko Group Sp. z o.o.",
        lessor_address: "Złotokłos, 05-504, ul. Stawowa 1",
        lessor_phone: "+48 660 694 257",
        lessor_website: "www.kokokamper.pl",
        lessor_email: "kontakt@kokokamper.pl",
        tenant_name: selectedClient?.name || "",
        tenant_email: selectedClient?.email || "",
        tenant_phone: selectedClient?.phone || "",
        tenant_address: "",
        tenant_id_type: "",
        tenant_id_number: "",
        tenant_id_issuer: "",
        tenant_pesel: "",
        tenant_nip: formData.get('tenant_nip') as string || "",
        tenant_license_number: "",
        tenant_license_date: null,
        vehicle_vin: vehicleData.vin || (formData.get('przedmiot_vin') as string) || "",
        vehicle_next_inspection: emptyToNull(vehicleData.next_inspection_date || (formData.get('przedmiot_nastepne_badanie') as string)),
        vehicle_insurance_number: vehicleData.insurance_policy_number || (formData.get('przedmiot_polisa_numer') as string) || "",
        vehicle_insurance_valid_until: emptyToNull(vehicleData.insurance_valid_until || (formData.get('przedmiot_polisa_wazna_do') as string)),
        vehicle_additional_info: (() => {
          const options = [];
          if (vehicleData.cleaning) options.push(`Sprzątanie dodatkowo: ${vehicleData.cleaning}`);
          if (vehicleData.animals) options.push(`Zwierzę: ${vehicleData.animals}`);
          if (vehicleData.extra_equipment) options.push(`Wyposażenie dodatkowo: ${vehicleData.extra_equipment}`);
          const additionalText = vehicleData.additional_info || (formData.get('przedmiot_dodatkowe_info') as string) || "";
          const optionsText = options.join(', ');
          const insuranceNote = insuranceWarning ? `UWAGA: ${insuranceWarning}` : "";
          const combined = [optionsText, additionalText, insuranceNote].filter(Boolean).join(' | ');
          return combined;
        })(),
        additional_drivers: [],
        payments: paymentsData,
        notes: formData.get('uwagi') as string,
      });
      
      toast({
        title: "Umowa utworzona",
        description: "Nowa umowa została pomyślnie dodana do systemu.",
      });
      
      setIsDialogOpen(false);
      setSelectedVehicleId("");
      setSelectedClientId("");
      setGeneratedContractNumber("");
      setTotalAmount("");
      setIsFullPaymentAsReservation(false);
      setCustomDepositAmount(false);
      setIsPremiumCamper(false);
      setDepositAmount("");
      setInsuranceWarning("");
      setVehicleData({
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
        extra_equipment: ""
      });
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się utworzyć umowy.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteContract = async (id: string) => {
    try {
      await deleteContractMutation.mutateAsync(id);
      toast({
        title: "Sukces",
        description: "Umowa została usunięta.",
      });
      setDeleteContractId(null);
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się usunąć umowy.",
        variant: "destructive",
      });
    }
  };

  const filteredContracts = contractsData.filter(
    (contract) =>
      contract.contract_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (contract.client?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.vehicle_model.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      // Resetuj formularz gdy dialog się zamyka
      setSelectedClientId("");
      setSelectedVehicleId("");
      setClientSearchOpen(false);
      setVehicleSearchOpen(false);
      setGeneratedContractNumber("");
      setTotalAmount("");
      setIsFullPaymentAsReservation(false);
      setCustomDepositAmount(false);
      setIsPremiumCamper(false);
      setDepositAmount("");
      setInsuranceWarning("");
      setVehicleData({
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
        extra_equipment: ""
      });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Umowy</h1>
          <p className="text-muted-foreground">Zarządzaj umowami najmu</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-md">
              <Plus className="h-4 w-4" />
              Nowa umowa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nowa umowa</DialogTitle>
              <DialogDescription>
                Wypełnij formularz, aby utworzyć nową umowę najmu
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 mt-4">
              {/* Klient */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Klient</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="client_id">Wybierz klienta *</Label>
                    <Popover open={clientSearchOpen} onOpenChange={setClientSearchOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={clientSearchOpen}
                          className="w-full justify-between"
                        >
                          {selectedClientId
                            ? (() => {
                                const client = clients.find((c) => c.id === selectedClientId);
                                return client ? `${client.name} - ${client.email}` : "Wybierz klienta";
                              })()
                            : "Wybierz klienta"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0 bg-background z-50" align="start">
                        <Command>
                          <CommandInput placeholder="Szukaj po imieniu, nazwisku, email lub telefonie..." />
                          <CommandList>
                            <CommandEmpty>Nie znaleziono klienta.</CommandEmpty>
                            <CommandGroup>
                              {clients.map((client) => (
                                <CommandItem
                                  key={client.id}
                                  value={`${client.name} ${client.email} ${client.phone || ''}`}
                                  onSelect={() => {
                                    setSelectedClientId(client.id);
                                    setClientSearchOpen(false);
                                  }}
                                  className="cursor-pointer"
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedClientId === client.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <div className="flex flex-col">
                                    <span className="font-medium">{client.name}</span>
                                    <span className="text-sm opacity-70">
                                      {client.email} {client.phone ? `• ${client.phone}` : ''}
                                    </span>
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
              </div>

              {/* Informacje podstawowe (Najemca) */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Informacje podstawowe</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tenant_company_name">Nazwa firmy (opcjonalnie)</Label>
                    <Input 
                      id="tenant_company_name" 
                      name="tenant_company_name" 
                      placeholder="Jeśli firma wynajmuje"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tenant_nip">NIP (opcjonalnie)</Label>
                    <Input 
                      id="tenant_nip" 
                      name="tenant_nip" 
                      placeholder="NIP firmy"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="umowa_numer">Numer umowy</Label>
                    <Input 
                      id="umowa_numer" 
                      name="umowa_numer" 
                      placeholder="Wybierz pojazd aby wygenerować numer" 
                      value={generatedContractNumber}
                      readOnly
                      required 
                      disabled={!generatedContractNumber}
                    />
                    {generatedContractNumber && (
                      <p className="text-xs text-muted-foreground">
                        Automatycznie wygenerowany na podstawie typu pojazdu
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="umowa_text">Numer umowy (stary system)</Label>
                    <Input id="umowa_text" name="umowa_text" placeholder="np. 60/2024" />
                  </div>
                </div>
              </div>

              {/* Okres najmu */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Okres najmu</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="okres_od">Data i godzina rozpoczęcia</Label>
                    <Input 
                      id="okres_od" 
                      name="okres_od" 
                      type="datetime-local" 
                      min={`${new Date().toISOString().split('T')[0]}T08:00`}
                      onChange={(e) => {
                        if (e.target.value) {
                          const date = new Date(e.target.value);
                          const hours = date.getHours();
                          if (hours < 8 || hours > 17) {
                            e.target.setCustomValidity('Godzina musi być w przedziale 8:00-17:00');
                          } else {
                            e.target.setCustomValidity('');
                          }
                          
                          // Check insurance expiry
                          if (vehicleData.insurance_valid_until) {
                            const insuranceDate = new Date(vehicleData.insurance_valid_until);
                            if (date > insuranceDate) {
                              setInsuranceWarning(`Okres najmu rozpoczyna się po dacie ważności polisy (${new Date(vehicleData.insurance_valid_until).toLocaleDateString('pl-PL')}). Wymagany aneks przy odbiorze.`);
                            } else {
                              setInsuranceWarning("");
                            }
                          }
                        }
                      }}
                      required 
                    />
                    <p className="text-xs text-muted-foreground">Godzina: 8:00-17:00</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="okres_do">Data i godzina zakończenia</Label>
                    <Input 
                      id="okres_do" 
                      name="okres_do" 
                      type="datetime-local"
                      onChange={(e) => {
                        if (e.target.value) {
                          const date = new Date(e.target.value);
                          const hours = date.getHours();
                          if (hours < 8 || hours > 17) {
                            e.target.setCustomValidity('Godzina musi być w przedziale 8:00-17:00');
                          } else {
                            e.target.setCustomValidity('');
                          }
                        }
                      }}
                      required 
                    />
                    <p className="text-xs text-muted-foreground">Godzina: 8:00-17:00</p>
                  </div>
                </div>
                {insuranceWarning && (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-md text-sm">
                    ⚠️ {insuranceWarning}
                  </div>
                )}
              </div>

              {/* Przedmiot najmu */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Przedmiot najmu</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="wybor_pojazdu">Wybierz pojazd z bazy</Label>
                    <Popover open={vehicleSearchOpen} onOpenChange={setVehicleSearchOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={vehicleSearchOpen}
                          className="w-full justify-between"
                        >
                          {selectedVehicleId
                            ? (() => {
                                const vehicle = vehicles.find((v) => v.id === selectedVehicleId);
                                return vehicle ? `${vehicle.model} - ${vehicle.registration_number}` : "Wybierz pojazd";
                              })()
                            : "Wybierz pojazd lub wprowadź dane ręcznie"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0 bg-background z-50" align="start">
                        <Command>
                          <CommandInput placeholder="Szukaj po modelu, numerze rejestracyjnym lub rodzaju..." />
                          <CommandList>
                            <CommandEmpty>Nie znaleziono pojazdu.</CommandEmpty>
                            <CommandGroup>
                              {vehicles.map((vehicle) => (
                                <CommandItem
                                  key={vehicle.id}
                                  value={`${vehicle.model} ${vehicle.registration_number} ${vehicle.type || ''}`}
                                  onSelect={() => {
                                    handleVehicleSelect(vehicle.id);
                                    setVehicleSearchOpen(false);
                                  }}
                                  className="cursor-pointer"
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedVehicleId === vehicle.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <div className="flex flex-col">
                                    <span className="font-medium">{vehicle.model} - {vehicle.registration_number}</span>
                                    {vehicle.type && (
                                      <span className="text-sm opacity-70">
                                        {vehicle.type}
                                      </span>
                                    )}
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="przedmiot_model">Model</Label>
                      <Input 
                        id="przedmiot_model" 
                        name="przedmiot_model" 
                        placeholder="RANDGER R600" 
                        value={vehicleData.model}
                        onChange={(e) => setVehicleData({...vehicleData, model: e.target.value})}
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="przedmiot_vin">VIN</Label>
                      <Input 
                        id="przedmiot_vin" 
                        name="przedmiot_vin" 
                        placeholder="ZFA25000002S85417" 
                        value={vehicleData.vin}
                        onChange={(e) => setVehicleData({...vehicleData, vin: e.target.value})}
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="przedmiot_nr_rej">Nr rejestracyjny</Label>
                      <Input 
                        id="przedmiot_nr_rej" 
                        name="przedmiot_nr_rej" 
                        placeholder="WZ726ES" 
                        value={vehicleData.registration_number}
                        onChange={(e) => setVehicleData({...vehicleData, registration_number: e.target.value})}
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="przedmiot_nastepne_badanie">Następne badanie</Label>
                      <Input 
                        id="przedmiot_nastepne_badanie" 
                        name="przedmiot_nastepne_badanie" 
                        type="date" 
                        value={vehicleData.next_inspection_date}
                        onChange={(e) => setVehicleData({...vehicleData, next_inspection_date: e.target.value})}
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="przedmiot_polisa_numer">Numer polisy</Label>
                      <Input 
                        id="przedmiot_polisa_numer" 
                        name="przedmiot_polisa_numer" 
                        placeholder="1068435310/9933" 
                        value={vehicleData.insurance_policy_number}
                        onChange={(e) => setVehicleData({...vehicleData, insurance_policy_number: e.target.value})}
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="przedmiot_polisa_wazna_do">Polisa ważna do</Label>
                      <Input 
                        id="przedmiot_polisa_wazna_do" 
                        name="przedmiot_polisa_wazna_do" 
                        type="date" 
                        value={vehicleData.insurance_valid_until}
                        onChange={(e) => setVehicleData({...vehicleData, insurance_valid_until: e.target.value})}
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sprzatanie">Sprzątanie dodatkowo</Label>
                      <Select 
                        value={vehicleData.cleaning} 
                        onValueChange={(value: "Tak" | "Nie") => setVehicleData({...vehicleData, cleaning: value})}
                      >
                        <SelectTrigger id="sprzatanie">
                          <SelectValue placeholder="Wybierz opcję" />
                        </SelectTrigger>
                        <SelectContent className="bg-background z-50">
                          <SelectItem value="Tak">Tak</SelectItem>
                          <SelectItem value="Nie">Nie</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zwierze">Zwierzę</Label>
                      <Select 
                        value={vehicleData.animals} 
                        onValueChange={(value: "Tak" | "Nie") => setVehicleData({...vehicleData, animals: value})}
                      >
                        <SelectTrigger id="zwierze">
                          <SelectValue placeholder="Wybierz opcję" />
                        </SelectTrigger>
                        <SelectContent className="bg-background z-50">
                          <SelectItem value="Tak">Tak</SelectItem>
                          <SelectItem value="Nie">Nie</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="wyposazenie">Wyposażenie dodatkowo</Label>
                      <Select 
                        value={vehicleData.extra_equipment} 
                        onValueChange={(value: "Tak" | "Nie") => setVehicleData({...vehicleData, extra_equipment: value})}
                      >
                        <SelectTrigger id="wyposazenie">
                          <SelectValue placeholder="Wybierz opcję" />
                        </SelectTrigger>
                        <SelectContent className="bg-background z-50">
                          <SelectItem value="Tak">Tak</SelectItem>
                          <SelectItem value="Nie">Nie</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="przedmiot_dodatkowe_info">Dodatkowe informacje</Label>
                      <Textarea 
                        id="przedmiot_dodatkowe_info" 
                        name="przedmiot_dodatkowe_info" 
                        placeholder="Inne uwagi dotyczące pojazdu" 
                        value={vehicleData.additional_info}
                        onChange={(e) => setVehicleData({...vehicleData, additional_info: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Opłaty */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Opłaty</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="kwota_calkowita">Kwota całkowita *</Label>
                  <Input 
                    id="kwota_calkowita" 
                    name="kwota_calkowita" 
                    type="number"
                    step="0.01"
                    placeholder="10000.00"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    required 
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="full_payment_as_reservation"
                    checked={isFullPaymentAsReservation}
                    onCheckedChange={(checked) => setIsFullPaymentAsReservation(checked === true)}
                  />
                  <Label htmlFor="full_payment_as_reservation" className="cursor-pointer">
                    Cała kwota jako opłata rezerwacyjna (bez opłaty zasadniczej)
                  </Label>
                </div>

                {vehicleData.type === "Kamper" && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="premium_camper"
                      checked={isPremiumCamper}
                      onCheckedChange={(checked) => {
                        const isPremium = checked === true;
                        setIsPremiumCamper(isPremium);
                        if (!customDepositAmount) {
                          setDepositAmount(isPremium ? "8000" : "5000");
                        }
                      }}
                    />
                    <Label htmlFor="premium_camper" className="cursor-pointer">
                      Kamper Premium+/Prestige+ (kaucja 8000 zł)
                    </Label>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="custom_deposit_amount"
                    checked={customDepositAmount}
                    onCheckedChange={(checked) => setCustomDepositAmount(checked === true)}
                  />
                  <Label htmlFor="custom_deposit_amount" className="cursor-pointer">
                    Niestandardowa kwota kaucji
                  </Label>
                </div>

                {customDepositAmount && (
                  <div className="space-y-2">
                    <Label htmlFor="deposit_amount">Kwota kaucji *</Label>
                    <Input 
                      id="deposit_amount" 
                      name="deposit_amount" 
                      type="number"
                      step="0.01"
                      placeholder="5000.00"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      required 
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
                    const startDateInput = (document.getElementById('okres_od') as HTMLInputElement)?.value;
                    if (startDateInput) {
                      const startDate = new Date(startDateInput);
                      const mainPaymentDate = new Date(startDate);
                      mainPaymentDate.setDate(mainPaymentDate.getDate() - 14);
                      return <span className="block">• Data opłaty zasadniczej: {mainPaymentDate.toLocaleDateString('pl-PL')}</span>;
                    }
                    return <span className="block">• Data opłaty zasadniczej: zostanie obliczona po wybraniu daty rozpoczęcia</span>;
                  })()}
                  <span className="block">• Data kaucji: dzień rozpoczęcia wynajmu</span>
                  <span className="block">• Kwota kaucji: {customDepositAmount 
                    ? `${depositAmount} zł (niestandardowa)` 
                    : vehicleData.type === "Przyczepa" 
                      ? "3000 zł" 
                      : isPremiumCamper 
                        ? "8000 zł (Premium+/Prestige+)" 
                        : "5000 zł"}</span>
                  <span className="block">• Rachunki bankowe są automatycznie przypisywane</span>
                </p>
              </div>

              {/* Uwagi */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Uwagi</h3>
                <div className="space-y-2">
                  <Label htmlFor="uwagi">Dodatkowe uwagi</Label>
                  <Textarea 
                    id="uwagi" 
                    name="uwagi" 
                    placeholder="Opłaty należy dokonywać na rachunek bankowy..."
                    className="min-h-[120px]"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Anuluj
                </Button>
                <Button type="submit">
                  Utwórz umowę
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Szukaj umów..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Lista umów</CardTitle>
          <CardDescription>
            Wyświetlono {filteredContracts.length} {filteredContracts.length === 1 ? 'umowę' : 'umów'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredContracts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nie znaleziono umów</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredContracts.map((contract) => (
                <div
                  key={contract.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors gap-4"
                >
                  <div className="flex-1 space-y-2 w-full sm:w-auto">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-semibold text-foreground">{contract.contract_number}</span>
                      <Badge variant="outline" className={statusConfig[contract.status].className}>
                        {statusConfig[contract.status].label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Klient: <span className="text-foreground font-medium">{contract.client?.name || 'Brak danych'}</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Pojazd: <span className="text-foreground font-medium">{contract.vehicle_model}</span>
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {format(new Date(contract.start_date), 'dd.MM.yyyy')} - {format(new Date(contract.end_date), 'dd.MM.yyyy')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="text-right flex-1 sm:flex-none space-y-1">
                      <div>
                        <p className="text-xs text-muted-foreground">Opłata rezerwacyjna + zasadnicza</p>
                        <p className="text-lg font-bold text-primary">
                          {(() => {
                            const payments = contract.payments as Record<string, any> || {};
                            const rezerwacyjna = parseFloat(payments?.rezerwacyjna?.wysokosc || 0);
                            const zasadnicza = parseFloat(payments?.zasadnicza?.wysokosc || 0);
                            const total = rezerwacyjna + zasadnicza;
                            return total > 0 ? `${total.toFixed(2)} zł` : 'Brak danych';
                          })()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Kaucja</p>
                        <p className="text-lg font-bold text-foreground">
                          {(() => {
                            const payments = contract.payments as Record<string, any> || {};
                            const kaucja = parseFloat(payments?.kaucja?.wysokosc || 0);
                            return kaucja > 0 ? `${kaucja.toFixed(2)} zł` : 'Brak danych';
                          })()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link to={`/contracts/${contract.id}`}>
                        <Button variant="outline" size="icon" className="shrink-0">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="shrink-0"
                        onClick={() => setDeleteContractId(contract.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteContractId} onOpenChange={() => setDeleteContractId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Czy na pewno chcesz usunąć tę umowę?</AlertDialogTitle>
            <AlertDialogDescription>
              Ta operacja jest nieodwracalna. Wszystkie dane umowy zostaną trwale usunięte.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteContractId && handleDeleteContract(deleteContractId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Contracts;
