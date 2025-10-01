import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, FileText, Upload, AlertCircle, Truck, Caravan } from "lucide-react";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import { pl } from "date-fns/locale";

interface Vehicle {
  id: string;
  name: string;
  type: "kamper" | "przyczepa";
  brand: string;
  model: string;
  year: number;
  registrationNumber: string;
  status: "dostepny" | "wynajety" | "serwis";
  location: string;
  insurancePolicyNumber: string;
  lastTechnicalInspection: Date;
  policyExpiryDate: Date;
  policyFileUrl?: string;
}

// Mock data - w przyszłości będzie z bazy danych
const mockVehicles: Vehicle[] = [
  {
    id: "1",
    name: "Kamper XYZ",
    type: "kamper",
    brand: "Fiat",
    model: "Ducato Roller Team",
    year: 2022,
    registrationNumber: "WW 12345",
    status: "dostepny",
    location: "Warszawa",
    insurancePolicyNumber: "POL/2024/12345",
    lastTechnicalInspection: new Date(2024, 3, 15),
    policyExpiryDate: new Date(2025, 5, 30),
  },
  {
    id: "2",
    name: "Przyczepa ABC",
    type: "przyczepa",
    brand: "Niewiadów",
    model: "N126E",
    year: 2021,
    registrationNumber: "KR 67890",
    status: "wynajety",
    location: "Kraków",
    insurancePolicyNumber: "POL/2024/67890",
    lastTechnicalInspection: new Date(2024, 1, 20),
    policyExpiryDate: new Date(2025, 3, 15),
  },
  {
    id: "3",
    name: "Kamper 123",
    type: "kamper",
    brand: "Mercedes",
    model: "Sprinter Hymer",
    year: 2023,
    registrationNumber: "GD 11223",
    status: "dostepny",
    location: "Gdańsk",
    insurancePolicyNumber: "POL/2024/11223",
    lastTechnicalInspection: new Date(2024, 6, 10),
    policyExpiryDate: new Date(2025, 8, 20),
  },
  {
    id: "4",
    name: "Przyczepa Mini",
    type: "przyczepa",
    brand: "Knaus",
    model: "Sport 400",
    year: 2020,
    registrationNumber: "PO 33445",
    status: "serwis",
    location: "Poznań",
    insurancePolicyNumber: "POL/2024/33445",
    lastTechnicalInspection: new Date(2023, 11, 5),
    policyExpiryDate: new Date(2024, 11, 30),
  },
];

const VehicleDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState<Vehicle | undefined>(
    mockVehicles.find((v) => v.id === id)
  );
  const [uploadingFile, setUploadingFile] = useState(false);

  if (!vehicle) {
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
  const nextTechnicalInspection = new Date(vehicle.lastTechnicalInspection);
  nextTechnicalInspection.setFullYear(nextTechnicalInspection.getFullYear() + 1);
  
  const daysToInspection = differenceInDays(nextTechnicalInspection, today);
  const daysToPolicy = differenceInDays(vehicle.policyExpiryDate, today);

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
    // Symulacja uploadu - w przyszłości będzie upload do bazy
    setTimeout(() => {
      setVehicle({
        ...vehicle,
        policyFileUrl: URL.createObjectURL(file),
      });
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
          <h1 className="text-4xl font-bold text-foreground">{vehicle.name}</h1>
          <p className="text-muted-foreground">
            {vehicle.brand} {vehicle.model} ({vehicle.year})
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
              <span className="font-bold text-lg text-foreground">{vehicle.registrationNumber}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Typ pojazdu:</span>
              <span className="font-medium text-foreground">
                {vehicle.type === "kamper" ? "Kamper" : "Przyczepa"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Lokalizacja:</span>
              <span className="font-medium text-foreground">{vehicle.location}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Status:</span>
              <Badge>
                {vehicle.status === "dostepny"
                  ? "Dostępny"
                  : vehicle.status === "wynajety"
                  ? "Wynajęty"
                  : "W serwisie"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Polisa ubezpieczeniowa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Numer polisy:</span>
              <span className="font-bold text-foreground">{vehicle.insurancePolicyNumber}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Data wygaśnięcia:</span>
              <span className="font-medium text-foreground">
                {format(vehicle.policyExpiryDate, "dd MMMM yyyy", { locale: pl })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Czas do odnowienia:</span>
              <Badge
                className={
                  daysToPolicy < 0
                    ? "bg-destructive/10 text-destructive"
                    : daysToPolicy <= 30
                    ? "bg-orange-500/10 text-orange-600"
                    : "bg-primary/10 text-primary"
                }
              >
                <policyBadge.icon className="h-3 w-3 mr-1" />
                {policyBadge.label}
              </Badge>
            </div>
            <div className="pt-2 border-t">
              <Label htmlFor="policy-file" className="text-sm text-muted-foreground mb-2 block">
                Plik polisy
              </Label>
              <div className="flex gap-2">
                <Input
                  id="policy-file"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  disabled={uploadingFile}
                  className="flex-1"
                />
                {vehicle.policyFileUrl && (
                  <Button variant="outline" asChild>
                    <a href={vehicle.policyFileUrl} target="_blank" rel="noopener noreferrer">
                      <FileText className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Badanie techniczne</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Ostatnie badanie:</span>
              <span className="font-medium text-foreground">
                {format(vehicle.lastTechnicalInspection, "dd MMMM yyyy", { locale: pl })}
              </span>
            </div>
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
                  daysToInspection < 0
                    ? "bg-destructive/10 text-destructive"
                    : daysToInspection <= 30
                    ? "bg-orange-500/10 text-orange-600"
                    : "bg-primary/10 text-primary"
                }
              >
                <inspectionBadge.icon className="h-3 w-3 mr-1" />
                {inspectionBadge.label}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Przypomnienia</CardTitle>
            <CardDescription>Nadchodzące terminy</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {daysToInspection <= 60 && (
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
            {daysToPolicy <= 60 && (
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
                      : `Za ${daysToPolicy} dni - ${format(vehicle.policyExpiryDate, "dd.MM.yyyy")}`}
                  </p>
                </div>
              </div>
            )}
            {daysToInspection > 60 && daysToPolicy > 60 && (
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
