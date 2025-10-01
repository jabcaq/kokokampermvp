import { useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock data - w przyszłości z bazy danych
const contractsData: Record<string, any> = {
  "1": {
    umowa_numer: "UM/2024/001",
    okres_najmu: {
      od: "2024-03-15 10:00",
      do: "2024-03-22 14:00",
    },
    przedmiot_najmu: {
      model: "RANDGER R600",
      nr_rej: "WZ726ES",
    }
  },
  "2": {
    umowa_numer: "UM/2024/002",
    okres_najmu: {
      od: "2024-03-14 10:00",
      do: "2024-03-21 14:00",
    },
    przedmiot_najmu: {
      model: "Przyczepa Camp-200",
      nr_rej: "WZ123AB",
    }
  }
};

const VehicleHandover = () => {
  const { contractId } = useParams<{ contractId: string }>();
  const { toast } = useToast();
  const contract = contractId ? contractsData[contractId] : null;

  const [formData, setFormData] = useState({
    mileage: "",
    fuelLevel: "",
    handoverProtocol: null as File[] | null,
    photos: null as File[] | null,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    toast({
      title: "Formularz wysłany",
      description: "Protokół wydania został zapisany pomyślnie.",
    });

    // Reset form
    setFormData({
      mileage: "",
      fuelLevel: "",
      handoverProtocol: null,
      photos: null,
    });
  };

  const handleFileChange = (field: 'handoverProtocol' | 'photos') => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData(prev => ({
        ...prev,
        [field]: Array.from(e.target.files!)
      }));
    }
  };

  const handleClearForm = () => {
    setFormData({
      mileage: "",
      fuelLevel: "",
      handoverProtocol: null,
      photos: null,
    });
  };

  if (!contract) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Nie znaleziono umowy</CardTitle>
            <CardDescription>Sprawdź poprawność linku.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Formularz wydania</CardTitle>
            <CardDescription className="text-base">
              Ten formularz służy do rejestracji procesu wydania kampera. Prosimy o dodanie protokołu zdawczego oraz zdjęć dokumentujących wydanie pojazdu. Upewnij się, że wszystkie załączniki są kompletne i czytelne.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Readonly contract info */}
            <div className="mb-6 p-4 bg-muted rounded-lg space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Numer umowy</p>
                  <p className="font-medium">{contract.umowa_numer}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pojazd</p>
                  <p className="font-medium">{contract.przedmiot_najmu.model}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nr rejestracyjny</p>
                  <p className="font-medium">{contract.przedmiot_najmu.nr_rej}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data wydania</p>
                  <p className="font-medium">{contract.okres_najmu.od}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data zwrotu</p>
                  <p className="font-medium">{contract.okres_najmu.do}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mileage">Ilość KM na liczniku</Label>
                  <Input
                    id="mileage"
                    type="number"
                    value={formData.mileage}
                    onChange={(e) => setFormData(prev => ({ ...prev, mileage: e.target.value }))}
                    placeholder="np. 45000"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fuelLevel">Ilość paliwa</Label>
                  <Input
                    id="fuelLevel"
                    value={formData.fuelLevel}
                    onChange={(e) => setFormData(prev => ({ ...prev, fuelLevel: e.target.value }))}
                    placeholder="np. 3/4 baku"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="handoverProtocol">Protokół z wydania</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                  <input
                    id="handoverProtocol"
                    type="file"
                    multiple
                    onChange={handleFileChange('handoverProtocol')}
                    className="hidden"
                    accept=".pdf,.doc,.docx,image/*"
                  />
                  <label htmlFor="handoverProtocol" className="cursor-pointer">
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Drop files here or{" "}
                      <span className="text-primary hover:underline">browse</span>
                    </p>
                    {formData.handoverProtocol && (
                      <p className="text-sm text-primary mt-2">
                        {formData.handoverProtocol.length} plik(ów) wybranych
                      </p>
                    )}
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="photos">Zdjęcia</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                  <input
                    id="photos"
                    type="file"
                    multiple
                    onChange={handleFileChange('photos')}
                    className="hidden"
                    accept="image/*"
                  />
                  <label htmlFor="photos" className="cursor-pointer">
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Drop files here or{" "}
                      <span className="text-primary hover:underline">browse</span>
                    </p>
                    {formData.photos && (
                      <p className="text-sm text-primary mt-2">
                        {formData.photos.length} zdjęć wybranych
                      </p>
                    )}
                  </label>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleClearForm}
                  className="text-primary"
                >
                  Clear form
                </Button>
                <Button type="submit" size="lg">
                  Wyślij
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VehicleHandover;
