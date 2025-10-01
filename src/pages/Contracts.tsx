import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Calendar, Edit, Eye, Loader2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useContracts, useDeleteContract, useAddContract } from "@/hooks/useContracts";
import { useClients } from "@/hooks/useClients";
import { useVehicles } from "@/hooks/useVehicles";
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
  const [additionalDrivers, setAdditionalDrivers] = useState<number[]>([]);
  const [deleteContractId, setDeleteContractId] = useState<string | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [vehicleData, setVehicleData] = useState({
    model: "",
    vin: "",
    registration_number: "",
    next_inspection_date: "",
    insurance_policy_number: "",
    insurance_valid_until: "",
    additional_info: ""
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
  
  const handleVehicleSelect = (vehicleId: string) => {
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
        additional_info: selectedVehicle.additional_info || ""
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Przygotuj dodatkowych kierowców
    const driversData = additionalDrivers.map((idx) => ({
      imie_nazwisko: formData.get(`add_driver_${idx}_imie_nazwisko`),
      email: formData.get(`add_driver_${idx}_email`),
      tel: formData.get(`add_driver_${idx}_tel`),
      prawo_jazdy_numer: formData.get(`add_driver_${idx}_prawo_jazdy_numer`),
      prawo_jazdy_data: formData.get(`add_driver_${idx}_prawo_jazdy_data`),
      dokument_rodzaj: formData.get(`add_driver_${idx}_dokument_rodzaj`),
      dokument_numer: formData.get(`add_driver_${idx}_dokument_numer`),
      dokument_organ: formData.get(`add_driver_${idx}_dokument_organ`),
    }));
    
    // Przygotuj dane płatności
    const paymentsData = {
      rezerwacyjna: {
        data: formData.get('oplata_rez_data'),
        wysokosc: formData.get('oplata_rez_wysokosc'),
        rachunek: formData.get('oplata_rez_rachunek'),
      },
      zasadnicza: {
        data: formData.get('oplata_zasad_data'),
        wysokosc: formData.get('oplata_zasad_wysokosc'),
        rachunek: formData.get('oplata_zasad_rachunek'),
      },
      kaucja: {
        data: formData.get('oplata_kaucja_data'),
        wysokosc: formData.get('oplata_kaucja_wysokosc'),
        rachunek: formData.get('oplata_kaucja_rachunek'),
      },
    };
    
    try {
      await addContractMutation.mutateAsync({
        contract_number: formData.get('umowa_numer') as string,
        client_id: selectedClientId,
        vehicle_model: vehicleData.model,
        registration_number: vehicleData.registration_number,
        start_date: formData.get('okres_od') as string,
        end_date: formData.get('okres_do') as string,
        status: 'pending',
        value: null,
        company_name: formData.get('nazwa_firmy') as string,
        company_email: formData.get('email') as string,
        company_phone1: formData.get('telefon1') as string,
        company_phone2: formData.get('telefon2') as string,
        lessor_name: formData.get('wynajmujacy_nazwa') as string,
        lessor_address: formData.get('wynajmujacy_adres') as string,
        lessor_phone: formData.get('wynajmujacy_tel') as string,
        lessor_website: formData.get('wynajmujacy_www') as string,
        lessor_email: formData.get('wynajmujacy_email') as string,
        rental_location: formData.get('okres_miejsce') as string,
        return_by: formData.get('okres_zwrot_do') as string,
        tenant_name: formData.get('najemca_imie_nazwisko') as string,
        tenant_email: formData.get('najemca_email') as string,
        tenant_phone: formData.get('najemca_tel') as string,
        tenant_address: formData.get('najemca_adres_zamieszkania') as string,
        tenant_id_type: formData.get('najemca_dokument_rodzaj') as string,
        tenant_id_number: formData.get('najemca_dokument_numer') as string,
        tenant_id_issuer: formData.get('najemca_dokument_organ') as string,
        tenant_pesel: formData.get('najemca_pesel') as string,
        tenant_nip: formData.get('najemca_nip') as string,
        tenant_license_number: formData.get('najemca_prawo_jazdy_numer') as string,
        tenant_license_date: formData.get('najemca_prawo_jazdy_data') as string,
        vehicle_vin: vehicleData.vin,
        vehicle_next_inspection: vehicleData.next_inspection_date,
        vehicle_insurance_number: vehicleData.insurance_policy_number,
        vehicle_insurance_valid_until: vehicleData.insurance_valid_until,
        vehicle_additional_info: vehicleData.additional_info,
        additional_drivers: driversData,
        payments: paymentsData,
        notes: formData.get('uwagi') as string,
      });
      
      toast({
        title: "Umowa utworzona",
        description: "Nowa umowa została pomyślnie dodana do systemu.",
      });
      
      setIsDialogOpen(false);
      setAdditionalDrivers([]);
      setSelectedVehicleId("");
      setSelectedClientId("");
      setVehicleData({
        model: "",
        vin: "",
        registration_number: "",
        next_inspection_date: "",
        insurance_policy_number: "",
        insurance_valid_until: "",
        additional_info: ""
      });
      e.currentTarget.reset();
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się utworzyć umowy.",
        variant: "destructive",
      });
    }
  };

  const addAdditionalDriver = () => {
    if (additionalDrivers.length < 2) {
      setAdditionalDrivers([...additionalDrivers, additionalDrivers.length]);
    }
  };

  const removeAdditionalDriver = (index: number) => {
    setAdditionalDrivers(additionalDrivers.filter((_, i) => i !== index));
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
      setAdditionalDrivers([]);
      setVehicleData({
        model: "",
        vin: "",
        registration_number: "",
        next_inspection_date: "",
        insurance_policy_number: "",
        insurance_valid_until: "",
        additional_info: ""
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
              {/* Podstawowe informacje */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Podstawowe informacje</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="client_id">Klient *</Label>
                    <Select value={selectedClientId} onValueChange={setSelectedClientId} required>
                      <SelectTrigger id="client_id">
                        <SelectValue placeholder="Wybierz klienta" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name} - {client.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nazwa_firmy">Nazwa firmy</Label>
                    <Input id="nazwa_firmy" name="nazwa_firmy" defaultValue="KOKO KAMPER" placeholder="KOKO KAMPER" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" defaultValue="kontakt@kokokamper.pl" placeholder="kontakt@kokokamper.pl" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefon1">Telefon 1</Label>
                    <Input id="telefon1" name="telefon1" defaultValue="+48 607 108 993" placeholder="+48 607 108 993" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefon2">Telefon 2</Label>
                    <Input id="telefon2" name="telefon2" defaultValue="+48 660 694 257" placeholder="+48 660 694 257" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="umowa_numer">Numer umowy</Label>
                    <Input id="umowa_numer" name="umowa_numer" placeholder="60/2024" required />
                  </div>
                </div>
              </div>

              {/* Wynajmujący */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Wynajmujący</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="wynajmujacy_nazwa">Nazwa</Label>
                    <Input id="wynajmujacy_nazwa" name="wynajmujacy_nazwa" defaultValue="Koko Group Sp. z o.o." placeholder="Koko Group Sp. z o.o." required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wynajmujacy_adres">Adres</Label>
                    <Input id="wynajmujacy_adres" name="wynajmujacy_adres" defaultValue="ul. Lazurowa 85a/53, 01-479 Warszawa" placeholder="ul. Lazurowa 85a/53, 01-479 Warszawa" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wynajmujacy_tel">Telefon</Label>
                    <Input id="wynajmujacy_tel" name="wynajmujacy_tel" defaultValue="+48 660 694 257" placeholder="+48 660 694 257" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wynajmujacy_www">WWW</Label>
                    <Input id="wynajmujacy_www" name="wynajmujacy_www" defaultValue="www.kokokamper.pl" placeholder="www.kokokamper.pl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wynajmujacy_email">Email</Label>
                    <Input id="wynajmujacy_email" name="wynajmujacy_email" type="email" defaultValue="kontakt@kokokamper.pl" placeholder="kontakt@kokokamper.pl" required />
                  </div>
                </div>
              </div>

              {/* Okres najmu */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Okres najmu</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="okres_od">Data rozpoczęcia</Label>
                    <Input id="okres_od" name="okres_od" type="datetime-local" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="okres_do">Data zakończenia</Label>
                    <Input id="okres_do" name="okres_do" type="datetime-local" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="okres_miejsce">Miejsce</Label>
                    <Input id="okres_miejsce" name="okres_miejsce" placeholder="oddział Warszawa" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="okres_zwrot_do">Zwrot do</Label>
                    <Input id="okres_zwrot_do" name="okres_zwrot_do" />
                  </div>
                </div>
              </div>

              {/* Najemca (Główny kierowca) */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Najemca (Główny kierowca)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="najemca_imie_nazwisko">Imię i nazwisko *</Label>
                    <Input id="najemca_imie_nazwisko" name="najemca_imie_nazwisko" placeholder="Adam Fedio" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="najemca_email">Email *</Label>
                    <Input id="najemca_email" name="najemca_email" type="email" placeholder="adam.fedio@gmail.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="najemca_tel">Telefon *</Label>
                    <Input id="najemca_tel" name="najemca_tel" placeholder="508140790" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="najemca_prawo_jazdy_numer">Numer prawa jazdy *</Label>
                    <Input id="najemca_prawo_jazdy_numer" name="najemca_prawo_jazdy_numer" placeholder="00856/04/2808" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="najemca_prawo_jazdy_data">Data wydania prawa jazdy *</Label>
                    <Input id="najemca_prawo_jazdy_data" name="najemca_prawo_jazdy_data" type="date" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="najemca_dokument_rodzaj">Rodzaj dokumentu tożsamości *</Label>
                    <Select name="najemca_dokument_rodzaj" defaultValue="dowod">
                      <SelectTrigger>
                        <SelectValue placeholder="Wybierz dokument" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dowod">Dowód osobisty</SelectItem>
                        <SelectItem value="paszport">Paszport</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="najemca_dokument_numer">Numer dokumentu *</Label>
                    <Input id="najemca_dokument_numer" name="najemca_dokument_numer" placeholder="DBZ976078" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="najemca_dokument_organ">Organ wydający *</Label>
                    <Input id="najemca_dokument_organ" name="najemca_dokument_organ" placeholder="Wójt gminy Stare Babice" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="najemca_pesel">PESEL</Label>
                    <Input id="najemca_pesel" name="najemca_pesel" placeholder="70110803631" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="najemca_nip">NIP</Label>
                    <Input id="najemca_nip" name="najemca_nip" placeholder="70110803631" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="najemca_adres_zamieszkania">Adres zamieszkania *</Label>
                    <Input id="najemca_adres_zamieszkania" name="najemca_adres_zamieszkania" placeholder="Władysława Reymona 29, Latchorzew, 05-082" required />
                  </div>
                </div>
              </div>

              {/* Przedmiot najmu */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Przedmiot najmu</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="wybor_pojazdu">Wybierz pojazd z bazy</Label>
                    <Select value={selectedVehicleId} onValueChange={handleVehicleSelect}>
                      <SelectTrigger id="wybor_pojazdu">
                        <SelectValue placeholder="Wybierz pojazd lub wprowadź dane ręcznie" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicles.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id}>
                            {vehicle.model} - {vehicle.registration_number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="przedmiot_dodatkowe_info">Dodatkowe informacje</Label>
                      <Textarea 
                        id="przedmiot_dodatkowe_info" 
                        name="przedmiot_dodatkowe_info" 
                        placeholder="pełne wyposażenie, brak zwierząt, bez sprzątania" 
                        value={vehicleData.additional_info}
                        onChange={(e) => setVehicleData({...vehicleData, additional_info: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Dodatkowi kierowcy (Osoby upoważnione) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">Dodatkowi kierowcy (maks. 2)</h3>
                  {additionalDrivers.length < 2 && (
                    <Button type="button" variant="outline" size="sm" onClick={addAdditionalDriver}>
                      <Plus className="h-4 w-4 mr-2" />
                      Dodaj kierowcę
                    </Button>
                  )}
                </div>
                
                {additionalDrivers.length === 0 && (
                  <p className="text-sm text-muted-foreground">Brak dodatkowych kierowców</p>
                )}

                {additionalDrivers.map((driverIndex, arrayIndex) => (
                  <Card key={driverIndex} className="border-2">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Dodatkowy kierowca #{arrayIndex + 1}</CardTitle>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeAdditionalDriver(arrayIndex)}
                        >
                          Usuń
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`add_driver_${driverIndex}_imie_nazwisko`}>Imię i nazwisko *</Label>
                          <Input 
                            id={`add_driver_${driverIndex}_imie_nazwisko`} 
                            name={`add_driver_${driverIndex}_imie_nazwisko`} 
                            placeholder="Monika Fedio" 
                            required 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`add_driver_${driverIndex}_email`}>Email *</Label>
                          <Input 
                            id={`add_driver_${driverIndex}_email`} 
                            name={`add_driver_${driverIndex}_email`} 
                            type="email"
                            placeholder="monika.fedio@gmail.com" 
                            required 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`add_driver_${driverIndex}_tel`}>Telefon *</Label>
                          <Input 
                            id={`add_driver_${driverIndex}_tel`} 
                            name={`add_driver_${driverIndex}_tel`} 
                            placeholder="+48 500 123 456" 
                            required 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`add_driver_${driverIndex}_prawo_jazdy_numer`}>Numer prawa jazdy *</Label>
                          <Input 
                            id={`add_driver_${driverIndex}_prawo_jazdy_numer`} 
                            name={`add_driver_${driverIndex}_prawo_jazdy_numer`} 
                            placeholder="04743/06/1432" 
                            required 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`add_driver_${driverIndex}_prawo_jazdy_data`}>Data wydania prawa jazdy *</Label>
                          <Input 
                            id={`add_driver_${driverIndex}_prawo_jazdy_data`} 
                            name={`add_driver_${driverIndex}_prawo_jazdy_data`} 
                            type="date"
                            required 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`add_driver_${driverIndex}_dokument_rodzaj`}>Rodzaj dokumentu *</Label>
                          <Select name={`add_driver_${driverIndex}_dokument_rodzaj`} defaultValue="dowod">
                            <SelectTrigger>
                              <SelectValue placeholder="Wybierz dokument" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="dowod">Dowód osobisty</SelectItem>
                              <SelectItem value="paszport">Paszport</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`add_driver_${driverIndex}_dokument_numer`}>Numer dokumentu *</Label>
                          <Input 
                            id={`add_driver_${driverIndex}_dokument_numer`} 
                            name={`add_driver_${driverIndex}_dokument_numer`} 
                            placeholder="DEW863370" 
                            required 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`add_driver_${driverIndex}_dokument_organ`}>Organ wydający *</Label>
                          <Input 
                            id={`add_driver_${driverIndex}_dokument_organ`} 
                            name={`add_driver_${driverIndex}_dokument_organ`} 
                            placeholder="Wójt gminy Stare Babice" 
                            required 
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Opłaty */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Opłaty</h3>
                
                {/* Opłata rezerwacyjna */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Opłata rezerwacyjna</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="oplata_rez_data">Data</Label>
                      <Input id="oplata_rez_data" name="oplata_rez_data" type="date" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="oplata_rez_wysokosc">Wysokość</Label>
                      <Input id="oplata_rez_wysokosc" name="oplata_rez_wysokosc" placeholder="5000.00 zł" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="oplata_rez_rachunek">Rachunek</Label>
                      <Input id="oplata_rez_rachunek" name="oplata_rez_rachunek" placeholder="mBank: 34 1140 2004..." />
                    </div>
                  </div>
                </div>

                {/* Opłata zasadnicza */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Opłata zasadnicza</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="oplata_zasad_data">Data</Label>
                      <Input id="oplata_zasad_data" name="oplata_zasad_data" type="date" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="oplata_zasad_wysokosc">Wysokość</Label>
                      <Input id="oplata_zasad_wysokosc" name="oplata_zasad_wysokosc" placeholder="n/d" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="oplata_zasad_rachunek">Rachunek</Label>
                      <Input id="oplata_zasad_rachunek" name="oplata_zasad_rachunek" placeholder="mBank: 34 1140 2004..." />
                    </div>
                  </div>
                </div>

                {/* Kaucja */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Kaucja</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="oplata_kaucja_data">Data</Label>
                      <Input id="oplata_kaucja_data" name="oplata_kaucja_data" type="date" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="oplata_kaucja_wysokosc">Wysokość</Label>
                      <Input id="oplata_kaucja_wysokosc" name="oplata_kaucja_wysokosc" placeholder="5000.00 zł" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="oplata_kaucja_rachunek">Rachunek</Label>
                      <Input id="oplata_kaucja_rachunek" name="oplata_kaucja_rachunek" placeholder="mBank: 08 1140 2004..." />
                    </div>
                  </div>
                </div>
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
                    <div className="text-right flex-1 sm:flex-none">
                      <p className="text-sm text-muted-foreground">Wartość</p>
                      <p className="text-xl font-bold text-primary">
                        {(() => {
                          const payments = contract.payments as Record<string, any> || {};
                          const total = Object.values(payments).reduce((sum, payment: any) => {
                            const wysokosc = parseFloat(payment?.wysokosc || 0);
                            return sum + wysokosc;
                          }, 0);
                          return total > 0 ? `${total.toFixed(2)} zł` : 'Brak danych';
                        })()}
                      </p>
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
