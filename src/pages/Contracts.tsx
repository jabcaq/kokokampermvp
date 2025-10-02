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
  const [generatedContractNumber, setGeneratedContractNumber] = useState<string>("");
  const [totalAmount, setTotalAmount] = useState<string>("");
  const [vehicleData, setVehicleData] = useState({
    model: "",
    vin: "",
    registration_number: "",
    next_inspection_date: "",
    insurance_policy_number: "",
    insurance_valid_until: "",
    additional_info: "",
    type: "" as "Kamper" | "Przyczepa" | ""
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
        type: selectedVehicle.type || ""
      });
      
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
    const reservationAmount = (total * 0.30).toFixed(2);
    const mainAmount = (total * 0.70).toFixed(2);
    
    // Get start date for deposit date
    const startDate = formData.get('okres_od') as string;
    
    // Przygotuj dane płatności z automatycznymi kwotami
    const paymentsData = {
      rezerwacyjna: {
        data: formData.get('oplata_rez_data') || "",
        wysokosc: `${reservationAmount} zł`,
        rachunek: "mBank: 34 1140 2004...",
      },
      zasadnicza: {
        data: formData.get('oplata_zasad_data') || "",
        wysokosc: `${mainAmount} zł`,
        rachunek: "mBank: 34 1140 2004...",
      },
      kaucja: {
        data: startDate ? new Date(startDate).toISOString().split('T')[0] : "",
        wysokosc: "1000 zł",
        rachunek: "mBank: 08 1140 2004...",
      },
    };
    
    try {
      await addContractMutation.mutateAsync({
        contract_number: generatedContractNumber || (formData.get('umowa_numer') as string),
        umowa_text: formData.get('umowa_text') as string,
        client_id: selectedClientId,
        vehicle_model: vehicleData.model || (formData.get('przedmiot_model') as string) || "",
        registration_number: vehicleData.registration_number || (formData.get('przedmiot_nr_rej') as string) || "",
        start_date: formData.get('okres_od') as string,
        end_date: formData.get('okres_do') as string,
        status: 'pending',
        value: total,
        company_name: "KOKO KAMPER",
        company_email: "kontakt@kokokamper.pl",
        company_phone1: "+48 607 108 993",
        company_phone2: "+48 660 694 257",
        lessor_name: "Koko Group Sp. z o.o.",
        lessor_address: "ul. Lazurowa 85a/53, 01-479 Warszawa",
        lessor_phone: "+48 660 694 257",
        lessor_website: "www.kokokamper.pl",
        lessor_email: "kontakt@kokokamper.pl",
        rental_location: formData.get('okres_miejsce') as string,
        return_by: formData.get('okres_zwrot_do') as string,
        tenant_name: selectedClient?.name || "",
        tenant_email: selectedClient?.email || "",
        tenant_phone: selectedClient?.phone || "",
        tenant_address: "",
        tenant_id_type: "",
        tenant_id_number: "",
        tenant_id_issuer: "",
        tenant_pesel: "",
        tenant_nip: "",
        tenant_license_number: "",
        tenant_license_date: "",
        vehicle_vin: vehicleData.vin || (formData.get('przedmiot_vin') as string) || "",
        vehicle_next_inspection: vehicleData.next_inspection_date || (formData.get('przedmiot_nastepne_badanie') as string) || "",
        vehicle_insurance_number: vehicleData.insurance_policy_number || (formData.get('przedmiot_polisa_numer') as string) || "",
        vehicle_insurance_valid_until: vehicleData.insurance_valid_until || (formData.get('przedmiot_polisa_wazna_do') as string) || "",
        vehicle_additional_info: vehicleData.additional_info || (formData.get('przedmiot_dodatkowe_info') as string) || "",
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
      setVehicleData({
        model: "",
        vin: "",
        registration_number: "",
        next_inspection_date: "",
        insurance_policy_number: "",
        insurance_valid_until: "",
        additional_info: "",
        type: ""
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
      setGeneratedContractNumber("");
      setTotalAmount("");
      setVehicleData({
        model: "",
        vin: "",
        registration_number: "",
        next_inspection_date: "",
        insurance_policy_number: "",
        insurance_valid_until: "",
        additional_info: "",
        type: ""
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
                  {totalAmount && (
                    <div className="text-xs text-muted-foreground space-y-1 mt-2">
                      <p>• Opłata rezerwacyjna (30%): {(parseFloat(totalAmount) * 0.30).toFixed(2)} zł</p>
                      <p>• Opłata zasadnicza (70%): {(parseFloat(totalAmount) * 0.70).toFixed(2)} zł</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="oplata_rez_data">Data opłaty rezerwacyjnej</Label>
                    <Input id="oplata_rez_data" name="oplata_rez_data" type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="oplata_zasad_data">Data opłaty zasadniczej</Label>
                    <Input id="oplata_zasad_data" name="oplata_zasad_data" type="date" />
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  • Data kaucji jest automatycznie ustawiana na dzień rozpoczęcia wynajmu<br/>
                  • Kwota kaucji: 1000 zł<br/>
                  • Rachunki bankowe są automatycznie przypisywane
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
