import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, FileText, User, Car, CreditCard, Edit2, Save, X, Link2, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useContract, useUpdateContract } from "@/hooks/useContracts";
import { format } from "date-fns";

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
  
  const { data: contract, isLoading } = useContract(id);
  const updateContractMutation = useUpdateContract();

  const handleEdit = () => {
    setEditedData({ ...contract });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData({});
  };

  const handleSave = async () => {
    if (!id) return;
    
    try {
      await updateContractMutation.mutateAsync({
        id,
        updates: editedData,
      });
      
      toast({
        title: "Umowa zaktualizowana",
        description: "Zmiany zostały pomyślnie zapisane.",
      });
      setIsEditing(false);
      setEditedData({});
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się zaktualizować umowy.",
        variant: "destructive",
      });
    }
  };

  const updateField = (field: string, value: any) => {
    setEditedData({ ...editedData, [field]: value });
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
            <Badge variant="outline" className={statusConfig[displayData?.status as keyof typeof statusConfig]?.className}>
              {statusConfig[displayData?.status as keyof typeof statusConfig]?.label}
            </Badge>
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

      {/* Informacje podstawowe */}
      {(displayData?.company_name || displayData?.company_email || displayData?.company_phone1) && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Informacje podstawowe
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayData?.company_name && (
                <div className="space-y-2">
                  <Label>Nazwa firmy</Label>
                  {isEditing ? (
                    <Input value={displayData.company_name || ''} onChange={(e) => updateField('company_name', e.target.value)} />
                  ) : (
                    <p className="font-medium text-foreground">{displayData.company_name}</p>
                  )}
                </div>
              )}
              {displayData?.company_email && (
                <div className="space-y-2">
                  <Label>Email</Label>
                  {isEditing ? (
                    <Input type="email" value={displayData.company_email || ''} onChange={(e) => updateField('company_email', e.target.value)} />
                  ) : (
                    <p className="font-medium text-foreground">{displayData.company_email}</p>
                  )}
                </div>
              )}
              {displayData?.company_phone1 && (
                <div className="space-y-2">
                  <Label>Telefon 1</Label>
                  {isEditing ? (
                    <Input value={displayData.company_phone1 || ''} onChange={(e) => updateField('company_phone1', e.target.value)} />
                  ) : (
                    <p className="font-medium text-foreground">{displayData.company_phone1}</p>
                  )}
                </div>
              )}
              {displayData?.company_phone2 && (
                <div className="space-y-2">
                  <Label>Telefon 2</Label>
                  {isEditing ? (
                    <Input value={displayData.company_phone2 || ''} onChange={(e) => updateField('company_phone2', e.target.value)} />
                  ) : (
                    <p className="font-medium text-foreground">{displayData.company_phone2}</p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Wynajmujący */}
      {(displayData?.lessor_name || displayData?.lessor_address) && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Wynajmujący</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayData?.lessor_name && (
                <div className="space-y-2">
                  <Label>Nazwa</Label>
                  {isEditing ? (
                    <Input value={displayData.lessor_name || ''} onChange={(e) => updateField('lessor_name', e.target.value)} />
                  ) : (
                    <p className="font-medium text-foreground">{displayData.lessor_name}</p>
                  )}
                </div>
              )}
              {displayData?.lessor_address && (
                <div className="space-y-2">
                  <Label>Adres</Label>
                  {isEditing ? (
                    <Input value={displayData.lessor_address || ''} onChange={(e) => updateField('lessor_address', e.target.value)} />
                  ) : (
                    <p className="font-medium text-foreground">{displayData.lessor_address}</p>
                  )}
                </div>
              )}
              {displayData?.lessor_phone && (
                <div className="space-y-2">
                  <Label>Telefon</Label>
                  {isEditing ? (
                    <Input value={displayData.lessor_phone || ''} onChange={(e) => updateField('lessor_phone', e.target.value)} />
                  ) : (
                    <p className="font-medium text-foreground">{displayData.lessor_phone}</p>
                  )}
                </div>
              )}
              {displayData?.lessor_website && (
                <div className="space-y-2">
                  <Label>WWW</Label>
                  {isEditing ? (
                    <Input value={displayData.lessor_website || ''} onChange={(e) => updateField('lessor_website', e.target.value)} />
                  ) : (
                    <p className="font-medium text-foreground">{displayData.lessor_website}</p>
                  )}
                </div>
              )}
              {displayData?.lessor_email && (
                <div className="space-y-2">
                  <Label>Email</Label>
                  {isEditing ? (
                    <Input type="email" value={displayData.lessor_email || ''} onChange={(e) => updateField('lessor_email', e.target.value)} />
                  ) : (
                    <p className="font-medium text-foreground">{displayData.lessor_email}</p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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
                  type="datetime-local" 
                  value={displayData?.start_date?.replace(' ', 'T') || ''} 
                  onChange={(e) => updateField('start_date', e.target.value)} 
                />
              ) : (
                <p className="font-medium text-foreground">
                  {displayData?.start_date ? format(new Date(displayData.start_date), 'dd.MM.yyyy HH:mm') : 'N/A'}
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
                  {displayData?.end_date ? format(new Date(displayData.end_date), 'dd.MM.yyyy HH:mm') : 'N/A'}
                </p>
              )}
            </div>
            {displayData?.rental_location && (
              <div className="space-y-2">
                <Label>Miejsce</Label>
                {isEditing ? (
                  <Input value={displayData.rental_location || ''} onChange={(e) => updateField('rental_location', e.target.value)} />
                ) : (
                  <p className="font-medium text-foreground">{displayData.rental_location}</p>
                )}
              </div>
            )}
            {displayData?.return_by && (
              <div className="space-y-2">
                <Label>Zwrot do</Label>
                {isEditing ? (
                  <Input value={displayData.return_by || ''} onChange={(e) => updateField('return_by', e.target.value)} />
                ) : (
                  <p className="font-medium text-foreground">{displayData.return_by}</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Najemca (Główny kierowca) */}
      {displayData?.tenant_name && (
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
                  <Input value={displayData.tenant_name || ''} onChange={(e) => updateField('tenant_name', e.target.value)} />
                ) : (
                  <p className="font-medium text-foreground">{displayData.tenant_name}</p>
                )}
              </div>
              {displayData?.tenant_email && (
                <div className="space-y-2">
                  <Label>Email</Label>
                  {isEditing ? (
                    <Input type="email" value={displayData.tenant_email || ''} onChange={(e) => updateField('tenant_email', e.target.value)} />
                  ) : (
                    <p className="font-medium text-foreground">{displayData.tenant_email}</p>
                  )}
                </div>
              )}
              {displayData?.tenant_phone && (
                <div className="space-y-2">
                  <Label>Telefon</Label>
                  {isEditing ? (
                    <Input value={displayData.tenant_phone || ''} onChange={(e) => updateField('tenant_phone', e.target.value)} />
                  ) : (
                    <p className="font-medium text-foreground">{displayData.tenant_phone}</p>
                  )}
                </div>
              )}
              {displayData?.tenant_address && (
                <div className="space-y-2 md:col-span-2">
                  <Label>Adres zamieszkania</Label>
                  {isEditing ? (
                    <Input value={displayData.tenant_address || ''} onChange={(e) => updateField('tenant_address', e.target.value)} />
                  ) : (
                    <p className="font-medium text-foreground">{displayData.tenant_address}</p>
                  )}
                </div>
              )}
              {displayData?.tenant_id_type && (
                <div className="space-y-2">
                  <Label>Rodzaj dokumentu tożsamości</Label>
                  {isEditing ? (
                    <Input value={displayData.tenant_id_type || ''} onChange={(e) => updateField('tenant_id_type', e.target.value)} />
                  ) : (
                    <p className="font-medium text-foreground">{displayData.tenant_id_type}</p>
                  )}
                </div>
              )}
              {displayData?.tenant_id_number && (
                <div className="space-y-2">
                  <Label>Numer dokumentu</Label>
                  {isEditing ? (
                    <Input value={displayData.tenant_id_number || ''} onChange={(e) => updateField('tenant_id_number', e.target.value)} />
                  ) : (
                    <p className="font-medium text-foreground">{displayData.tenant_id_number}</p>
                  )}
                </div>
              )}
              {displayData?.tenant_id_issuer && (
                <div className="space-y-2">
                  <Label>Organ wydający</Label>
                  {isEditing ? (
                    <Input value={displayData.tenant_id_issuer || ''} onChange={(e) => updateField('tenant_id_issuer', e.target.value)} />
                  ) : (
                    <p className="font-medium text-foreground">{displayData.tenant_id_issuer}</p>
                  )}
                </div>
              )}
              {displayData?.tenant_pesel && (
                <div className="space-y-2">
                  <Label>PESEL</Label>
                  {isEditing ? (
                    <Input value={displayData.tenant_pesel || ''} onChange={(e) => updateField('tenant_pesel', e.target.value)} />
                  ) : (
                    <p className="font-medium text-foreground">{displayData.tenant_pesel}</p>
                  )}
                </div>
              )}
              {displayData?.tenant_nip && (
                <div className="space-y-2">
                  <Label>NIP</Label>
                  {isEditing ? (
                    <Input value={displayData.tenant_nip || ''} onChange={(e) => updateField('tenant_nip', e.target.value)} />
                  ) : (
                    <p className="font-medium text-foreground">{displayData.tenant_nip}</p>
                  )}
                </div>
              )}
              {displayData?.tenant_license_number && (
                <div className="space-y-2">
                  <Label>Numer prawa jazdy</Label>
                  {isEditing ? (
                    <Input value={displayData.tenant_license_number || ''} onChange={(e) => updateField('tenant_license_number', e.target.value)} />
                  ) : (
                    <p className="font-medium text-foreground">{displayData.tenant_license_number}</p>
                  )}
                </div>
              )}
              {displayData?.tenant_license_date && (
                <div className="space-y-2">
                  <Label>Data wydania prawa jazdy</Label>
                  {isEditing ? (
                    <Input type="date" value={displayData.tenant_license_date || ''} onChange={(e) => updateField('tenant_license_date', e.target.value)} />
                  ) : (
                    <p className="font-medium text-foreground">{displayData.tenant_license_date}</p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Przedmiot najmu */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Przedmiot najmu
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Model</Label>
              {isEditing ? (
                <Input value={displayData?.vehicle_model || ''} onChange={(e) => updateField('vehicle_model', e.target.value)} />
              ) : (
                <p className="font-medium text-foreground">{displayData?.vehicle_model}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Nr rejestracyjny</Label>
              {isEditing ? (
                <Input value={displayData?.registration_number || ''} onChange={(e) => updateField('registration_number', e.target.value)} />
              ) : (
                <p className="font-medium text-foreground">{displayData?.registration_number}</p>
              )}
            </div>
            {displayData?.vehicle_vin && (
              <div className="space-y-2">
                <Label>VIN</Label>
                {isEditing ? (
                  <Input value={displayData.vehicle_vin || ''} onChange={(e) => updateField('vehicle_vin', e.target.value)} />
                ) : (
                  <p className="font-medium text-foreground">{displayData.vehicle_vin}</p>
                )}
              </div>
            )}
            {displayData?.vehicle_next_inspection && (
              <div className="space-y-2">
                <Label>Następne badanie</Label>
                {isEditing ? (
                  <Input type="date" value={displayData.vehicle_next_inspection || ''} onChange={(e) => updateField('vehicle_next_inspection', e.target.value)} />
                ) : (
                  <p className="font-medium text-foreground">{displayData.vehicle_next_inspection}</p>
                )}
              </div>
            )}
            {displayData?.vehicle_insurance_number && (
              <div className="space-y-2">
                <Label>Numer polisy</Label>
                {isEditing ? (
                  <Input value={displayData.vehicle_insurance_number || ''} onChange={(e) => updateField('vehicle_insurance_number', e.target.value)} />
                ) : (
                  <p className="font-medium text-foreground">{displayData.vehicle_insurance_number}</p>
                )}
              </div>
            )}
            {displayData?.vehicle_insurance_valid_until && (
              <div className="space-y-2">
                <Label>Polisa ważna do</Label>
                {isEditing ? (
                  <Input type="date" value={displayData.vehicle_insurance_valid_until || ''} onChange={(e) => updateField('vehicle_insurance_valid_until', e.target.value)} />
                ) : (
                  <p className="font-medium text-foreground">{displayData.vehicle_insurance_valid_until}</p>
                )}
              </div>
            )}
            {displayData?.vehicle_additional_info && (
              <div className="space-y-2 md:col-span-2">
                <Label>Dodatkowe informacje</Label>
                {isEditing ? (
                  <Textarea value={displayData.vehicle_additional_info || ''} onChange={(e) => updateField('vehicle_additional_info', e.target.value)} />
                ) : (
                  <p className="font-medium text-foreground">{displayData.vehicle_additional_info}</p>
                )}
              </div>
            )}
            {displayData?.value && (
              <div className="space-y-2">
                <Label>Wartość umowy</Label>
                {isEditing ? (
                  <Input type="number" value={displayData.value || ''} onChange={(e) => updateField('value', parseFloat(e.target.value))} />
                ) : (
                  <p className="font-medium text-foreground">{displayData.value} zł</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dodatkowi kierowcy */}
      {displayData?.additional_drivers && displayData.additional_drivers.length > 0 && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Dodatkowi kierowcy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {displayData.additional_drivers.map((driver: any, idx: number) => (
              <div key={idx} className="p-4 border rounded-lg space-y-4">
                <h4 className="font-semibold">Kierowca #{idx + 1}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {driver.imie_nazwisko && (
                    <div className="space-y-2">
                      <Label>Imię i nazwisko</Label>
                      <p className="font-medium text-foreground">{driver.imie_nazwisko}</p>
                    </div>
                  )}
                  {driver.email && (
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <p className="font-medium text-foreground">{driver.email}</p>
                    </div>
                  )}
                  {driver.tel && (
                    <div className="space-y-2">
                      <Label>Telefon</Label>
                      <p className="font-medium text-foreground">{driver.tel}</p>
                    </div>
                  )}
                  {driver.prawo_jazdy_numer && (
                    <div className="space-y-2">
                      <Label>Numer prawa jazdy</Label>
                      <p className="font-medium text-foreground">{driver.prawo_jazdy_numer}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Płatności */}
      {displayData?.payments && Object.keys(displayData.payments).length > 0 && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Płatności
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {displayData.payments.rezerwacyjna && (
              <div className="space-y-4">
                <h4 className="font-semibold">Opłata rezerwacyjna</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {displayData.payments.rezerwacyjna.data && (
                    <div className="space-y-2">
                      <Label>Data</Label>
                      <p className="font-medium text-foreground">{displayData.payments.rezerwacyjna.data}</p>
                    </div>
                  )}
                  {displayData.payments.rezerwacyjna.wysokosc && (
                    <div className="space-y-2">
                      <Label>Wysokość</Label>
                      <p className="font-medium text-foreground">{displayData.payments.rezerwacyjna.wysokosc}</p>
                    </div>
                  )}
                  {displayData.payments.rezerwacyjna.rachunek && (
                    <div className="space-y-2 md:col-span-2">
                      <Label>Rachunek</Label>
                      <p className="font-medium text-foreground">{displayData.payments.rezerwacyjna.rachunek}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            {displayData.payments.zasadnicza && (
              <div className="space-y-4">
                <h4 className="font-semibold">Opłata zasadnicza</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {displayData.payments.zasadnicza.data && (
                    <div className="space-y-2">
                      <Label>Data</Label>
                      <p className="font-medium text-foreground">{displayData.payments.zasadnicza.data}</p>
                    </div>
                  )}
                  {displayData.payments.zasadnicza.wysokosc && (
                    <div className="space-y-2">
                      <Label>Wysokość</Label>
                      <p className="font-medium text-foreground">{displayData.payments.zasadnicza.wysokosc}</p>
                    </div>
                  )}
                  {displayData.payments.zasadnicza.rachunek && (
                    <div className="space-y-2 md:col-span-2">
                      <Label>Rachunek</Label>
                      <p className="font-medium text-foreground">{displayData.payments.zasadnicza.rachunek}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            {displayData.payments.kaucja && (
              <div className="space-y-4">
                <h4 className="font-semibold">Kaucja</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {displayData.payments.kaucja.data && (
                    <div className="space-y-2">
                      <Label>Data</Label>
                      <p className="font-medium text-foreground">{displayData.payments.kaucja.data}</p>
                    </div>
                  )}
                  {displayData.payments.kaucja.wysokosc && (
                    <div className="space-y-2">
                      <Label>Wysokość</Label>
                      <p className="font-medium text-foreground">{displayData.payments.kaucja.wysokosc}</p>
                    </div>
                  )}
                  {displayData.payments.kaucja.rachunek && (
                    <div className="space-y-2 md:col-span-2">
                      <Label>Rachunek</Label>
                      <p className="font-medium text-foreground">{displayData.payments.kaucja.rachunek}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Uwagi */}
      {displayData?.notes && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Uwagi</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Textarea value={displayData.notes || ''} onChange={(e) => updateField('notes', e.target.value)} rows={4} />
            ) : (
              <p className="text-foreground whitespace-pre-wrap">{displayData.notes}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Linki szybkiego dostępu */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Dokumenty
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button 
            variant="outline" 
            className="w-full justify-start gap-2"
            onClick={() => navigate(`/vehicle-handover?contractId=${id}`)}
          >
            <FileText className="h-4 w-4" />
            Protokół wydania pojazdu
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start gap-2"
            onClick={() => navigate(`/vehicle-return?contractId=${id}`)}
          >
            <FileText className="h-4 w-4" />
            Protokół zwrotu pojazdu
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContractDetails;
