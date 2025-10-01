import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Calendar, FileText, User, Car, CreditCard, Edit2, Save, X, Link2, Loader2, Users, Truck, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useContract, useUpdateContract } from "@/hooks/useContracts";
import { useVehicles } from "@/hooks/useVehicles";
import { useVehicleHandovers, useAddVehicleHandover } from "@/hooks/useVehicleHandovers";
import { useVehicleReturns, useAddVehicleReturn } from "@/hooks/useVehicleReturns";
import { format } from "date-fns";
import { DriversTab } from "@/components/contract-tabs/DriversTab";
import { HandoverTab } from "@/components/contract-tabs/HandoverTab";
import { ReturnTab } from "@/components/contract-tabs/ReturnTab";

const statusConfig = {
  active: { label: "Aktywna", className: "bg-primary/10 text-primary border-primary/20" },
  pending: { label: "Oczekująca", className: "bg-secondary/10 text-secondary border-secondary/20" },
  completed: { label: "Zakończona", className: "bg-muted text-muted-foreground border-muted" },
  cancelled: { label: "Anulowana", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

const ContractDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<any>({});
  const [activeTab, setActiveTab] = useState("contract");
  
  const { data: contract, isLoading } = useContract(id);
  const { data: vehicles } = useVehicles();
  const { data: handovers } = useVehicleHandovers(id);
  const { data: returns } = useVehicleReturns(id);
  const updateContractMutation = useUpdateContract();

  const sanitizeContractUpdates = (data: any) => {
    const sanitized: any = { ...data };

    // Remove fields that are not actual columns in the contracts table
    delete sanitized.client;
    delete sanitized.created_at;
    delete sanitized.updated_at;

    const normalizeDate = (key: string) => {
      if (sanitized[key] === '') sanitized[key] = null;
      else if (typeof sanitized[key] === 'string' && sanitized[key].includes('T')) {
        sanitized[key] = sanitized[key].split('T')[0];
      }
    };

    // Normalize date-only fields stored as DATE in DB
    normalizeDate('start_date');
    normalizeDate('end_date');
    normalizeDate('tenant_license_date');
    normalizeDate('vehicle_next_inspection');
    normalizeDate('vehicle_insurance_valid_until');

    // Ensure numeric column types
    if (sanitized.value !== undefined) {
      sanitized.value = sanitized.value === '' || sanitized.value === null ? null : Number(sanitized.value);
      if (Number.isNaN(sanitized.value)) delete sanitized.value;
    }

    // Coerce numeric amounts inside payments JSON to numbers/null
    if (sanitized.payments) {
      const toNum = (val: any) => (val === '' || val === null || val === undefined ? null : Number(val));
      const p = { ...sanitized.payments };
      if (p.rezerwacyjna) p.rezerwacyjna = { ...p.rezerwacyjna, wysokosc: toNum(p.rezerwacyjna.wysokosc) };
      if (p.zasadnicza) p.zasadnicza = { ...p.zasadnicza, wysokosc: toNum(p.zasadnicza.wysokosc) };
      if (p.kaucja) p.kaucja = { ...p.kaucja, wysokosc: toNum(p.kaucja.wysokosc) };
      sanitized.payments = p;
    }

    return sanitized;
  };

  const handleEdit = () => {
    const initialData = { ...contract };
    console.log('Starting edit with data:', initialData);
    setEditedData(initialData);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData({});
  };

  const handleVehicleSelect = (vehicleId: string) => {
    const selectedVehicle = vehicles?.find(v => v.id === vehicleId);
    if (selectedVehicle) {
      const updates = {
        vehicle_model: selectedVehicle.model,
        registration_number: selectedVehicle.registration_number,
        vehicle_vin: selectedVehicle.vin,
        vehicle_next_inspection: selectedVehicle.next_inspection_date,
        vehicle_insurance_number: selectedVehicle.insurance_policy_number,
        vehicle_insurance_valid_until: selectedVehicle.insurance_valid_until,
        vehicle_additional_info: selectedVehicle.additional_info,
      };
      setEditedData({ ...editedData, ...updates });
    }
  };

  const handleSave = async () => {
    if (!id) return;
    
    const updates = sanitizeContractUpdates(editedData);
    console.log('Saving data (sanitized):', updates);
    
    try {
      await updateContractMutation.mutateAsync({
        id,
        updates,
      });
      
      toast({
        title: "Umowa zaktualizowana",
        description: "Zmiany zostały pomyślnie zapisane.",
      });
      setIsEditing(false);
      setEditedData({});
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się zaktualizować umowy.",
        variant: "destructive",
      });
    }
  };

  const updateField = (field: string, value: any) => {
    console.log('Updating field:', field, 'with value:', value);
    setEditedData(prev => {
      const updated = { ...prev, [field]: value };
      console.log('Updated editedData:', updated);
      return updated;
    });
  };

  const displayData = isEditing ? editedData : contract;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="space-y-8 animate-fade-in">
        <Button variant="outline" onClick={() => navigate("/contracts")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Powrót do listy umów
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Nie znaleziono umowy</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Button variant="outline" onClick={() => navigate("/contracts")} className="gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Powrót do listy umów
          </Button>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-4xl font-bold text-foreground">Umowa {displayData?.contract_number}</h1>
            {isEditing ? (
              <Select value={displayData?.status} onValueChange={(value) => updateField('status', value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Wybierz status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Oczekująca</SelectItem>
                  <SelectItem value="active">Aktywna</SelectItem>
                  <SelectItem value="completed">Zakończona</SelectItem>
                  <SelectItem value="cancelled">Anulowana</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Badge variant="outline" className={statusConfig[displayData?.status as keyof typeof statusConfig]?.className}>
                {statusConfig[displayData?.status as keyof typeof statusConfig]?.label}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-2">Szczegóły umowy najmu</p>
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <Button onClick={handleEdit} className="gap-2">
              <Edit2 className="h-4 w-4" />
              Edytuj umowę
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleCancel} className="gap-2">
                <X className="h-4 w-4" />
                Anuluj
              </Button>
              <Button onClick={handleSave} className="gap-2">
                <Save className="h-4 w-4" />
                Zapisz zmiany
              </Button>
            </>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="contract" className="gap-2">
            <FileText className="h-4 w-4" />
            Umowa
          </TabsTrigger>
          <TabsTrigger value="drivers" className="gap-2">
            <Users className="h-4 w-4" />
            Kierowcy
          </TabsTrigger>
          <TabsTrigger value="handover" className="gap-2">
            <Truck className="h-4 w-4" />
            Wydanie
          </TabsTrigger>
          <TabsTrigger value="return" className="gap-2">
            <Package className="h-4 w-4" />
            Zdanie
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contract" className="space-y-8">

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Informacje podstawowe
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nazwa firmy</Label>
              {isEditing ? (
                <Input value={displayData?.company_name || ''} onChange={(e) => updateField('company_name', e.target.value)} />
              ) : (
                <p className="font-medium text-foreground">{displayData?.company_name || 'Nie podano'}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              {isEditing ? (
                <Input type="email" value={displayData?.company_email || ''} onChange={(e) => updateField('company_email', e.target.value)} />
              ) : (
                <p className="font-medium text-foreground">{displayData?.company_email || 'Nie podano'}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Telefon 1</Label>
              {isEditing ? (
                <Input value={displayData?.company_phone1 || ''} onChange={(e) => updateField('company_phone1', e.target.value)} />
              ) : (
                <p className="font-medium text-foreground">{displayData?.company_phone1 || 'Nie podano'}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Telefon 2</Label>
              {isEditing ? (
                <Input value={displayData?.company_phone2 || ''} onChange={(e) => updateField('company_phone2', e.target.value)} />
              ) : (
                <p className="font-medium text-foreground">{displayData?.company_phone2 || 'Nie podano'}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wynajmujący */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Wynajmujący</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nazwa</Label>
              {isEditing ? (
                <Input value={displayData?.lessor_name || ''} onChange={(e) => updateField('lessor_name', e.target.value)} />
              ) : (
                <p className="font-medium text-foreground">{displayData?.lessor_name || 'Nie podano'}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Adres</Label>
              {isEditing ? (
                <Input value={displayData?.lessor_address || ''} onChange={(e) => updateField('lessor_address', e.target.value)} />
              ) : (
                <p className="font-medium text-foreground">{displayData?.lessor_address || 'Nie podano'}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Telefon</Label>
              {isEditing ? (
                <Input value={displayData?.lessor_phone || ''} onChange={(e) => updateField('lessor_phone', e.target.value)} />
              ) : (
                <p className="font-medium text-foreground">{displayData?.lessor_phone || 'Nie podano'}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>WWW</Label>
              {isEditing ? (
                <Input value={displayData?.lessor_website || ''} onChange={(e) => updateField('lessor_website', e.target.value)} />
              ) : (
                <p className="font-medium text-foreground">{displayData?.lessor_website || 'Nie podano'}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              {isEditing ? (
                <Input type="email" value={displayData?.lessor_email || ''} onChange={(e) => updateField('lessor_email', e.target.value)} />
              ) : (
                <p className="font-medium text-foreground">{displayData?.lessor_email || 'Nie podano'}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informacje o kliencie */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Klient
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Imię i nazwisko</Label>
              <p className="font-medium text-foreground">{contract.client?.name || 'N/A'}</p>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <p className="font-medium text-foreground">{contract.client?.email || 'N/A'}</p>
            </div>
            <div className="space-y-2">
              <Label>Telefon</Label>
              <p className="font-medium text-foreground">{contract.client?.phone || 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Okres najmu */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Okres najmu
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data rozpoczęcia</Label>
              {isEditing ? (
                <Input 
                  type="date" 
                  value={displayData?.start_date || ''} 
                  onChange={(e) => updateField('start_date', e.target.value)} 
                />
              ) : (
                <p className="font-medium text-foreground">
                  {displayData?.start_date ? format(new Date(displayData.start_date), 'dd.MM.yyyy HH:mm') : 'Nie podano'}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Data zakończenia</Label>
              {isEditing ? (
                <Input 
                  type="datetime-local" 
                  value={displayData?.end_date?.replace(' ', 'T') || ''} 
                  onChange={(e) => updateField('end_date', e.target.value)} 
                />
              ) : (
                <p className="font-medium text-foreground">
                  {displayData?.end_date ? format(new Date(displayData.end_date), 'dd.MM.yyyy HH:mm') : 'Nie podano'}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Miejsce</Label>
              {isEditing ? (
                <Input value={displayData?.rental_location || ''} onChange={(e) => updateField('rental_location', e.target.value)} />
              ) : (
                <p className="font-medium text-foreground">{displayData?.rental_location || 'Nie podano'}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Zwrot do</Label>
              {isEditing ? (
                <Input value={displayData?.return_by || ''} onChange={(e) => updateField('return_by', e.target.value)} />
              ) : (
                <p className="font-medium text-foreground">{displayData?.return_by || 'Nie podano'}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Najemca (Główny kierowca) */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Najemca (Główny kierowca)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Imię i nazwisko</Label>
              {isEditing ? (
                <Input value={displayData?.tenant_name || ''} onChange={(e) => updateField('tenant_name', e.target.value)} />
              ) : (
                <p className="font-medium text-foreground">{displayData?.tenant_name || 'Nie podano'}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              {isEditing ? (
                <Input type="email" value={displayData?.tenant_email || ''} onChange={(e) => updateField('tenant_email', e.target.value)} />
              ) : (
                <p className="font-medium text-foreground">{displayData?.tenant_email || 'Nie podano'}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Telefon</Label>
              {isEditing ? (
                <Input value={displayData?.tenant_phone || ''} onChange={(e) => updateField('tenant_phone', e.target.value)} />
              ) : (
                <p className="font-medium text-foreground">{displayData?.tenant_phone || 'Nie podano'}</p>
              )}
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Adres zamieszkania</Label>
              {isEditing ? (
                <Input value={displayData?.tenant_address || ''} onChange={(e) => updateField('tenant_address', e.target.value)} />
              ) : (
                <p className="font-medium text-foreground">{displayData?.tenant_address || 'Nie podano'}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Rodzaj dokumentu tożsamości</Label>
              {isEditing ? (
                <Select value={displayData?.tenant_id_type || ''} onValueChange={(value) => updateField('tenant_id_type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz dokument" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dowod">Dowód osobisty</SelectItem>
                    <SelectItem value="paszport">Paszport</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="font-medium text-foreground">{displayData?.tenant_id_type || 'Nie podano'}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Numer dokumentu</Label>
              {isEditing ? (
                <Input value={displayData?.tenant_id_number || ''} onChange={(e) => updateField('tenant_id_number', e.target.value)} />
              ) : (
                <p className="font-medium text-foreground">{displayData?.tenant_id_number || 'Nie podano'}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Organ wydający</Label>
              {isEditing ? (
                <Input value={displayData?.tenant_id_issuer || ''} onChange={(e) => updateField('tenant_id_issuer', e.target.value)} />
              ) : (
                <p className="font-medium text-foreground">{displayData?.tenant_id_issuer || 'Nie podano'}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>PESEL</Label>
              {isEditing ? (
                <Input value={displayData?.tenant_pesel || ''} onChange={(e) => updateField('tenant_pesel', e.target.value)} />
              ) : (
                <p className="font-medium text-foreground">{displayData?.tenant_pesel || 'Nie podano'}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>NIP</Label>
              {isEditing ? (
                <Input value={displayData?.tenant_nip || ''} onChange={(e) => updateField('tenant_nip', e.target.value)} />
              ) : (
                <p className="font-medium text-foreground">{displayData?.tenant_nip || 'Nie podano'}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Numer prawa jazdy</Label>
              {isEditing ? (
                <Input value={displayData?.tenant_license_number || ''} onChange={(e) => updateField('tenant_license_number', e.target.value)} />
              ) : (
                <p className="font-medium text-foreground">{displayData?.tenant_license_number || 'Nie podano'}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Data wydania prawa jazdy</Label>
              {isEditing ? (
                <Input type="date" value={displayData?.tenant_license_date || ''} onChange={(e) => updateField('tenant_license_date', e.target.value)} />
              ) : (
                <p className="font-medium text-foreground">{displayData?.tenant_license_date || 'Nie podano'}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Przedmiot najmu */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Przedmiot najmu
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing && (
            <div className="space-y-2 p-4 bg-muted/50 rounded-lg mb-4">
              <Label>Wybierz pojazd z bazy</Label>
              <Select onValueChange={handleVehicleSelect}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Wybierz pojazd aby automatycznie wypełnić dane" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {vehicles?.filter(v => v.status !== 'archived').map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.model} - {vehicle.registration_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Model</Label>
              {isEditing ? (
                <Input value={displayData?.vehicle_model || ''} onChange={(e) => updateField('vehicle_model', e.target.value)} />
              ) : (
                <p className="font-medium text-foreground">{displayData?.vehicle_model || 'Nie podano'}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Nr rejestracyjny</Label>
              {isEditing ? (
                <Input value={displayData?.registration_number || ''} onChange={(e) => updateField('registration_number', e.target.value)} />
              ) : (
                <p className="font-medium text-foreground">{displayData?.registration_number || 'Nie podano'}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>VIN</Label>
              {isEditing ? (
                <Input value={displayData?.vehicle_vin || ''} onChange={(e) => updateField('vehicle_vin', e.target.value)} />
              ) : (
                <p className="font-medium text-foreground">{displayData?.vehicle_vin || 'Nie podano'}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Następne badanie</Label>
              {isEditing ? (
                <Input type="date" value={displayData?.vehicle_next_inspection || ''} onChange={(e) => updateField('vehicle_next_inspection', e.target.value)} />
              ) : (
                <p className="font-medium text-foreground">{displayData?.vehicle_next_inspection || 'Nie podano'}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Numer polisy</Label>
              {isEditing ? (
                <Input value={displayData?.vehicle_insurance_number || ''} onChange={(e) => updateField('vehicle_insurance_number', e.target.value)} />
              ) : (
                <p className="font-medium text-foreground">{displayData?.vehicle_insurance_number || 'Nie podano'}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Polisa ważna do</Label>
              {isEditing ? (
                <Input type="date" value={displayData?.vehicle_insurance_valid_until || ''} onChange={(e) => updateField('vehicle_insurance_valid_until', e.target.value)} />
              ) : (
                <p className="font-medium text-foreground">{displayData?.vehicle_insurance_valid_until || 'Nie podano'}</p>
              )}
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Dodatkowe informacje</Label>
              {isEditing ? (
                <Textarea value={displayData?.vehicle_additional_info || ''} onChange={(e) => updateField('vehicle_additional_info', e.target.value)} />
              ) : (
                <p className="font-medium text-foreground">{displayData?.vehicle_additional_info || 'Nie podano'}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Wartość umowy</Label>
              {isEditing ? (
                <Input type="number" step="0.01" value={displayData?.value ?? ''} onChange={(e) => updateField('value', e.target.value)} />
              ) : (
                <p className="font-medium text-foreground">{displayData?.value ? `${displayData.value} PLN` : 'Nie podano'}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Płatności */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Płatności
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h4 className="font-semibold">Opłata rezerwacyjna</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data</Label>
                {isEditing ? (
                  <Input type="date" value={displayData?.payments?.rezerwacyjna?.data || ''} onChange={(e) => {
                    const newPayments = { ...displayData.payments, rezerwacyjna: { ...displayData.payments?.rezerwacyjna, data: e.target.value } };
                    updateField('payments', newPayments);
                  }} />
                ) : (
                  <p className="font-medium text-foreground">{displayData?.payments?.rezerwacyjna?.data || 'Nie podano'}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Wysokość</Label>
                {isEditing ? (
                  <Input type="number" step="0.01" value={displayData?.payments?.rezerwacyjna?.wysokosc ?? ''} onChange={(e) => {
                    const newPayments = { ...displayData.payments, rezerwacyjna: { ...displayData.payments?.rezerwacyjna, wysokosc: e.target.value } };
                    updateField('payments', newPayments);
                  }} />
                ) : (
                  <p className="font-medium text-foreground">
                    {displayData?.payments?.rezerwacyjna?.wysokosc ? `${displayData.payments.rezerwacyjna.wysokosc} PLN` : 'Nie podano'}
                  </p>
                )}
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Rachunek</Label>
                {isEditing ? (
                  <Input value={displayData?.payments?.rezerwacyjna?.rachunek || ''} onChange={(e) => {
                    const newPayments = { ...displayData.payments, rezerwacyjna: { ...displayData.payments?.rezerwacyjna, rachunek: e.target.value } };
                    updateField('payments', newPayments);
                  }} />
                ) : (
                  <p className="font-medium text-foreground">{displayData?.payments?.rezerwacyjna?.rachunek || 'Nie podano'}</p>
                )}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="font-semibold">Opłata zasadnicza</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data</Label>
                {isEditing ? (
                  <Input type="date" value={displayData?.payments?.zasadnicza?.data || ''} onChange={(e) => {
                    const newPayments = { ...displayData.payments, zasadnicza: { ...displayData.payments?.zasadnicza, data: e.target.value } };
                    updateField('payments', newPayments);
                  }} />
                ) : (
                  <p className="font-medium text-foreground">{displayData?.payments?.zasadnicza?.data || 'Nie podano'}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Wysokość</Label>
                {isEditing ? (
                  <Input type="number" step="0.01" value={displayData?.payments?.zasadnicza?.wysokosc ?? ''} onChange={(e) => {
                    const newPayments = { ...displayData.payments, zasadnicza: { ...displayData.payments?.zasadnicza, wysokosc: e.target.value } };
                    updateField('payments', newPayments);
                  }} />
                ) : (
                  <p className="font-medium text-foreground">
                    {displayData?.payments?.zasadnicza?.wysokosc ? `${displayData.payments.zasadnicza.wysokosc} PLN` : 'Nie podano'}
                  </p>
                )}
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Rachunek</Label>
                {isEditing ? (
                  <Input value={displayData?.payments?.zasadnicza?.rachunek || ''} onChange={(e) => {
                    const newPayments = { ...displayData.payments, zasadnicza: { ...displayData.payments?.zasadnicza, rachunek: e.target.value } };
                    updateField('payments', newPayments);
                  }} />
                ) : (
                  <p className="font-medium text-foreground">{displayData?.payments?.zasadnicza?.rachunek || 'Nie podano'}</p>
                )}
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="font-semibold">Kaucja</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data</Label>
                {isEditing ? (
                  <Input type="date" value={displayData?.payments?.kaucja?.data || ''} onChange={(e) => {
                    const newPayments = { ...displayData.payments, kaucja: { ...displayData.payments?.kaucja, data: e.target.value } };
                    updateField('payments', newPayments);
                  }} />
                ) : (
                  <p className="font-medium text-foreground">{displayData?.payments?.kaucja?.data || 'Nie podano'}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Wysokość</Label>
                {isEditing ? (
                  <Input type="number" step="0.01" value={displayData?.payments?.kaucja?.wysokosc ?? ''} onChange={(e) => {
                    const newPayments = { ...displayData.payments, kaucja: { ...displayData.payments?.kaucja, wysokosc: e.target.value } };
                    updateField('payments', newPayments);
                  }} />
                ) : (
                  <p className="font-medium text-foreground">
                    {displayData?.payments?.kaucja?.wysokosc ? `${displayData.payments.kaucja.wysokosc} PLN` : 'Nie podano'}
                  </p>
                )}
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Rachunek</Label>
                {isEditing ? (
                  <Input value={displayData?.payments?.kaucja?.rachunek || ''} onChange={(e) => {
                    const newPayments = { ...displayData.payments, kaucja: { ...displayData.payments?.kaucja, rachunek: e.target.value } };
                    updateField('payments', newPayments);
                  }} />
                ) : (
                  <p className="font-medium text-foreground">{displayData?.payments?.kaucja?.rachunek || 'Nie podano'}</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Uwagi */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Uwagi</CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <Textarea value={displayData?.notes || ''} onChange={(e) => updateField('notes', e.target.value)} rows={4} />
          ) : (
            <p className="text-foreground whitespace-pre-wrap">{displayData?.notes || 'Brak uwag'}</p>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="drivers">
          <DriversTab additionalDrivers={(contract?.additional_drivers as any[] | null) || []} />
        </TabsContent>

        <TabsContent value="handover">
          <HandoverTab
            contractId={id!}
            contractNumber={contract.contract_number}
            tenantName={contract.tenant_name || contract.client?.name || 'Brak danych'}
            startDate={contract.start_date}
            endDate={contract.end_date}
            vehicleModel={contract.vehicle_model}
            handovers={handovers}
          />
        </TabsContent>

        <TabsContent value="return">
          <ReturnTab
            contractId={id!}
            contractNumber={contract.contract_number}
            tenantName={contract.tenant_name || contract.client?.name || 'Brak danych'}
            startDate={contract.start_date}
            endDate={contract.end_date}
            vehicleModel={contract.vehicle_model}
            returns={returns}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContractDetails;
