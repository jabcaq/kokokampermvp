import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, FileText, AlertCircle, Truck, Caravan } from "lucide-react";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import { pl } from "date-fns/locale";
import { useVehicle } from "@/hooks/useVehicles";
import { Skeleton } from "@/components/ui/skeleton";

const VehicleDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: vehicle, isLoading, error } = useVehicle(id);
  const [uploadingFile, setUploadingFile] = useState(false);

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
      </div>

      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-lg bg-gradient-primary flex items-center justify-center">
          {vehicle.type === "kamper" ? (
            <Truck className="h-8 w-8 text-primary-foreground" />
          ) : (
            <Caravan className="h-8 w-8 text-primary-foreground" />
          )}
        </div>
        <div>
          <h1 className="text-4xl font-bold text-foreground">
            {vehicle.name || `${vehicle.brand || ''} ${vehicle.model}`.trim() || 'Pojazd'}
          </h1>
          <p className="text-muted-foreground">
            {vehicle.brand && `${vehicle.brand} `}{vehicle.model}{vehicle.year && ` (${vehicle.year})`}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Dane podstawowe</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Numer rejestracyjny:</span>
              <span className="font-bold text-lg text-foreground">{vehicle.registration_number}</span>
            </div>
            {vehicle.vin && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">VIN:</span>
                <span className="font-medium text-foreground">{vehicle.vin}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Typ pojazdu:</span>
              <span className="font-medium text-foreground">
                {vehicle.type === "kamper" ? "Kamper" : vehicle.type === "przyczepa" ? "Przyczepa" : "Brak danych"}
              </span>
            </div>
            {vehicle.location && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Lokalizacja:</span>
                <span className="font-medium text-foreground">{vehicle.location}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Status:</span>
              <Badge>
                {vehicle.status === "available"
                  ? "Dostępny"
                  : vehicle.status === "rented"
                  ? "Wynajęty"
                  : vehicle.status === "maintenance"
                  ? "W serwisie"
                  : "Zarchiwizowany"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Polisa ubezpieczeniowa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {vehicle.insurance_policy_number ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Numer polisy:</span>
                  <span className="font-bold text-foreground">{vehicle.insurance_policy_number}</span>
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
              <p className="text-sm text-muted-foreground text-center py-4">
                Brak danych o polisie ubezpieczeniowej
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Badanie techniczne</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Przypomnienia</CardTitle>
            <CardDescription>Nadchodzące terminy</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VehicleDetails;
