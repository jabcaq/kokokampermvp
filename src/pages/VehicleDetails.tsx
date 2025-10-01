import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Calendar, FileText, AlertCircle, Truck, Caravan, Edit, Save, X } from "lucide-react";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import { pl } from "date-fns/locale";
import { useVehicle, useUpdateVehicle } from "@/hooks/useVehicles";
import { Skeleton } from "@/components/ui/skeleton";

const VehicleDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: vehicle, isLoading, error } = useVehicle(id);
  const updateVehicle = useUpdateVehicle();
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<any>({});
  const [uploadingFile, setUploadingFile] = useState(false);

  const handleEdit = () => {
    setEditedData({
      name: vehicle?.name || '',
      type: vehicle?.type || 'kamper',
      brand: vehicle?.brand || '',
      model: vehicle?.model || '',
      year: vehicle?.year || new Date().getFullYear(),
      registration_number: vehicle?.registration_number || '',
      vin: vehicle?.vin || '',
      location: vehicle?.location || '',
      status: vehicle?.status || 'available',
      insurance_policy_number: vehicle?.insurance_policy_number || '',
      insurance_valid_until: vehicle?.insurance_valid_until || '',
      next_inspection_date: vehicle?.next_inspection_date || '',
      additional_info: vehicle?.additional_info || '',
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData({});
  };

  const handleSave = async () => {
    if (!id) return;
    
    try {
      await updateVehicle.mutateAsync({
        id,
        updates: editedData,
      });
      setIsEditing(false);
      toast.success("Dane pojazdu zostały zaktualizowane");
    } catch (error) {
      toast.error("Nie udało się zapisać zmian");
    }
  };

  const updateField = (field: string, value: any) => {
    setEditedData({ ...editedData, [field]: value });
  };

  if (isLoading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <Skeleton className="h-10 w-40" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="space-y-8 animate-fade-in">
        <Button onClick={() => navigate("/fleet")} variant="outline" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Powrót do floty
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Pojazd nie został znaleziony</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayData = isEditing ? editedData : vehicle;

  const today = new Date();
  
  // Obliczenia dla badania technicznego
  const nextTechnicalInspection = vehicle.next_inspection_date 
    ? new Date(vehicle.next_inspection_date)
    : null;
  const daysToInspection = nextTechnicalInspection 
    ? differenceInDays(nextTechnicalInspection, today)
    : null;

  // Obliczenia dla polisy
  const policyExpiryDate = vehicle.insurance_valid_until
    ? new Date(vehicle.insurance_valid_until)
    : null;
  const daysToPolicy = policyExpiryDate
    ? differenceInDays(policyExpiryDate, today)
    : null;

  const getCountdownBadge = (days: number) => {
    if (days < 0) {
      return { variant: "destructive", label: "Przeterminowane!", icon: AlertCircle };
    } else if (days <= 30) {
      return { variant: "warning", label: `${days} dni`, icon: AlertCircle };
    } else {
      return { variant: "default", label: `${days} dni`, icon: Calendar };
    }
  };

  const inspectionBadge = getCountdownBadge(daysToInspection);
  const policyBadge = getCountdownBadge(daysToPolicy);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    // TODO: Implementacja uploadu do storage
    setTimeout(() => {
      setUploadingFile(false);
      toast.success("Plik polisy został dodany", {
        description: file.name,
      });
    }, 1000);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <Button onClick={() => navigate("/fleet")} variant="outline" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Powrót do floty
        </Button>
        <div className="flex gap-2">
          {!isEditing ? (
            <Button onClick={handleEdit} className="gap-2">
              <Edit className="h-4 w-4" />
              Edytuj
            </Button>
          ) : (
            <>
              <Button onClick={handleCancel} variant="outline" className="gap-2">
                <X className="h-4 w-4" />
                Anuluj
              </Button>
              <Button onClick={handleSave} className="gap-2">
                <Save className="h-4 w-4" />
                Zapisz
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-lg bg-gradient-primary flex items-center justify-center">
          {displayData.type === "kamper" ? (
            <Truck className="h-8 w-8 text-primary-foreground" />
          ) : (
            <Caravan className="h-8 w-8 text-primary-foreground" />
          )}
        </div>
        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-2">
              <Input
                value={displayData.name || ''}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Nazwa pojazdu"
                className="text-2xl font-bold h-12"
              />
            </div>
          ) : (
            <>
              <h1 className="text-4xl font-bold text-foreground">
                {displayData.name || `${displayData.brand || ''} ${displayData.model}`.trim() || 'Pojazd'}
              </h1>
              <p className="text-muted-foreground">
                {displayData.brand && `${displayData.brand} `}{displayData.model}{displayData.year && ` (${displayData.year})`}
              </p>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Dane podstawowe</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <Label>Marka</Label>
                  <Input
                    value={displayData.brand || ''}
                    onChange={(e) => updateField('brand', e.target.value)}
                    placeholder="Marka"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Model</Label>
                  <Input
                    value={displayData.model || ''}
                    onChange={(e) => updateField('model', e.target.value)}
                    placeholder="Model"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Rok produkcji</Label>
                  <Input
                    type="number"
                    value={displayData.year || ''}
                    onChange={(e) => updateField('year', parseInt(e.target.value))}
                    placeholder="Rok"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Numer rejestracyjny</Label>
                  <Input
                    value={displayData.registration_number || ''}
                    onChange={(e) => updateField('registration_number', e.target.value)}
                    placeholder="Numer rejestracyjny"
                  />
                </div>
                <div className="space-y-2">
                  <Label>VIN</Label>
                  <Input
                    value={displayData.vin || ''}
                    onChange={(e) => updateField('vin', e.target.value)}
                    placeholder="VIN"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Typ pojazdu</Label>
                  <Select value={displayData.type} onValueChange={(value) => updateField('type', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kamper">Kamper</SelectItem>
                      <SelectItem value="przyczepa">Przyczepa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Lokalizacja</Label>
                  <Input
                    value={displayData.location || ''}
                    onChange={(e) => updateField('location', e.target.value)}
                    placeholder="Lokalizacja"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={displayData.status} onValueChange={(value) => updateField('status', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Dostępny</SelectItem>
                      <SelectItem value="rented">Wynajęty</SelectItem>
                      <SelectItem value="maintenance">W serwisie</SelectItem>
                      <SelectItem value="archived">Zarchiwizowany</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Numer rejestracyjny:</span>
                  <span className="font-bold text-lg text-foreground">{displayData.registration_number}</span>
                </div>
                {displayData.vin && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">VIN:</span>
                    <span className="font-medium text-foreground">{displayData.vin}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Typ pojazdu:</span>
                  <span className="font-medium text-foreground">
                    {displayData.type === "kamper" ? "Kamper" : displayData.type === "przyczepa" ? "Przyczepa" : "Brak danych"}
                  </span>
                </div>
                {displayData.location && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Lokalizacja:</span>
                    <span className="font-medium text-foreground">{displayData.location}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge>
                    {displayData.status === "available"
                      ? "Dostępny"
                      : displayData.status === "rented"
                      ? "Wynajęty"
                      : displayData.status === "maintenance"
                      ? "W serwisie"
                      : "Zarchiwizowany"}
                  </Badge>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Polisa ubezpieczeniowa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <Label>Numer polisy</Label>
                  <Input
                    value={displayData.insurance_policy_number || ''}
                    onChange={(e) => updateField('insurance_policy_number', e.target.value)}
                    placeholder="Numer polisy"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data wygaśnięcia polisy</Label>
                  <Input
                    type="date"
                    value={displayData.insurance_valid_until || ''}
                    onChange={(e) => updateField('insurance_valid_until', e.target.value)}
                  />
                </div>
                <div className="pt-2 border-t">
                  <Label htmlFor="policy-file" className="text-sm text-muted-foreground mb-2 block">
                    Plik polisy
                  </Label>
                  <Input
                    id="policy-file"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    disabled={uploadingFile}
                  />
                </div>
              </>
            ) : (
              <>
                {displayData.insurance_policy_number ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Numer polisy:</span>
                      <span className="font-bold text-foreground">{displayData.insurance_policy_number}</span>
                    </div>
                    {policyExpiryDate && (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Data wygaśnięcia:</span>
                          <span className="font-medium text-foreground">
                            {format(policyExpiryDate, "dd MMMM yyyy", { locale: pl })}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Czas do odnowienia:</span>
                          <Badge
                            className={
                              daysToPolicy! < 0
                                ? "bg-destructive/10 text-destructive"
                                : daysToPolicy! <= 30
                                ? "bg-orange-500/10 text-orange-600"
                                : "bg-primary/10 text-primary"
                            }
                          >
                            <policyBadge.icon className="h-3 w-3 mr-1" />
                            {policyBadge.label}
                          </Badge>
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Brak danych o polisie ubezpieczeniowej
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Badanie techniczne</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <div className="space-y-2">
                <Label>Data następnego badania technicznego</Label>
                <Input
                  type="date"
                  value={displayData.next_inspection_date || ''}
                  onChange={(e) => updateField('next_inspection_date', e.target.value)}
                />
              </div>
            ) : (
              <>
                {nextTechnicalInspection ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Następne badanie:</span>
                      <span className="font-medium text-foreground">
                        {format(nextTechnicalInspection, "dd MMMM yyyy", { locale: pl })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Czas do badania:</span>
                      <Badge
                        className={
                          daysToInspection! < 0
                            ? "bg-destructive/10 text-destructive"
                            : daysToInspection! <= 30
                            ? "bg-orange-500/10 text-orange-600"
                            : "bg-primary/10 text-primary"
                        }
                      >
                        <inspectionBadge.icon className="h-3 w-3 mr-1" />
                        {inspectionBadge.label}
                      </Badge>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Brak danych o badaniu technicznym
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>{isEditing ? "Dodatkowe informacje" : "Przypomnienia"}</CardTitle>
            <CardDescription>{isEditing ? "Notatki i uwagi" : "Nadchodzące terminy"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isEditing ? (
              <div className="space-y-2">
                <Label>Dodatkowe informacje</Label>
                <Textarea
                  value={displayData.additional_info || ''}
                  onChange={(e) => updateField('additional_info', e.target.value)}
                  placeholder="Dodatkowe informacje o pojeździe..."
                  rows={6}
                />
              </div>
            ) : (
              <>
                {daysToInspection !== null && daysToInspection <= 60 && nextTechnicalInspection && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <AlertCircle
                      className={`h-5 w-5 mt-0.5 ${
                        daysToInspection < 0 ? "text-destructive" : "text-orange-600"
                      }`}
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm text-foreground">Badanie techniczne</p>
                      <p className="text-xs text-muted-foreground">
                        {daysToInspection < 0
                          ? "Termin minął - wymagane natychmiastowe działanie"
                          : `Za ${daysToInspection} dni - ${format(nextTechnicalInspection, "dd.MM.yyyy")}`}
                      </p>
                    </div>
                  </div>
                )}
                {daysToPolicy !== null && daysToPolicy <= 60 && policyExpiryDate && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <AlertCircle
                      className={`h-5 w-5 mt-0.5 ${
                        daysToPolicy < 0 ? "text-destructive" : "text-orange-600"
                      }`}
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm text-foreground">Odnowienie polisy</p>
                      <p className="text-xs text-muted-foreground">
                        {daysToPolicy < 0
                          ? "Polisa wygasła - pojazd nie może być wynajęty"
                          : `Za ${daysToPolicy} dni - ${format(policyExpiryDate, "dd.MM.yyyy")}`}
                      </p>
                    </div>
                  </div>
                )}
                {((daysToInspection === null || daysToInspection > 60) && (daysToPolicy === null || daysToPolicy > 60)) && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Brak nadchodzących terminów w najbliższych 60 dniach
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VehicleDetails;
