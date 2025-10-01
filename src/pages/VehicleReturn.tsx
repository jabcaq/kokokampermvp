import { useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

const employees = [
  { id: "1", name: "Jan Nowak" },
  { id: "2", name: "Anna Kowalska" },
  { id: "3", name: "Piotr Wiśniewski" },
];

const VehicleReturn = () => {
  const { contractId } = useParams<{ contractId: string }>();
  const { toast } = useToast();
  const contract = contractId ? contractsData[contractId] : null;

  const [formData, setFormData] = useState({
    employeeId: "",
    canRefundDeposit: false,
    depositRefundedCash: false,
    vehicleIssue: false,
    fuelLevel: "",
    mileage: "",
    photos: null as File[] | null,
    returnNotes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.employeeId) {
      toast({
        title: "Błąd",
        description: "Wybierz osobę wypełniającą formularz.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Formularz wysłany",
      description: "Protokół zwrotu został zapisany pomyślnie.",
    });

    // Reset form
    setFormData({
      employeeId: "",
      canRefundDeposit: false,
      depositRefundedCash: false,
      vehicleIssue: false,
      fuelLevel: "",
      mileage: "",
      photos: null,
      returnNotes: "",
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData(prev => ({
        ...prev,
        photos: Array.from(e.target.files!)
      }));
    }
  };

  const handleClearForm = () => {
    setFormData({
      employeeId: "",
      canRefundDeposit: false,
      depositRefundedCash: false,
      vehicleIssue: false,
      fuelLevel: "",
      mileage: "",
      photos: null,
      returnNotes: "",
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
            <CardTitle className="text-2xl">Formularz zwrotu kampera</CardTitle>
            <CardDescription className="text-base">
              Proszę wypełnić poniższy formularz, aby potwierdzić stan kampera przy zwrocie. Upewnij się, że wszystkie sekcje zostały dokładnie sprawdzone, a wszelkie uszkodzenia lub brakujące elementy odnotowane. Na podstawie tych informacji podejmiemy decyzję o zwrocie kaucji. Dziękujemy za współpracę!
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
              <div className="space-y-2">
                <Label htmlFor="employee">
                  Osoba wypełniająca formularz <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.employeeId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, employeeId: value }))}
                  required
                >
                  <SelectTrigger id="employee">
                    <SelectValue placeholder="Wybierz pracownika" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="canRefundDeposit"
                    checked={formData.canRefundDeposit}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, canRefundDeposit: checked as boolean }))
                    }
                  />
                  <Label htmlFor="canRefundDeposit" className="text-sm font-normal cursor-pointer">
                    Czy można zwrócić kaucję - konto
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="depositRefundedCash"
                    checked={formData.depositRefundedCash}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, depositRefundedCash: checked as boolean }))
                    }
                  />
                  <Label htmlFor="depositRefundedCash" className="text-sm font-normal cursor-pointer">
                    Czy kaucja zwrócona gotówką?
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="vehicleIssue"
                    checked={formData.vehicleIssue}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, vehicleIssue: checked as boolean }))
                    }
                  />
                  <Label htmlFor="vehicleIssue" className="text-sm font-normal cursor-pointer">
                    Problem z kamperem
                  </Label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fuelLevel">
                    Ilość paliwa <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="fuelLevel"
                    value={formData.fuelLevel}
                    onChange={(e) => setFormData(prev => ({ ...prev, fuelLevel: e.target.value }))}
                    placeholder="np. 3/4 baku"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mileage">
                    Ilość KM na liczniku <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="mileage"
                    type="number"
                    value={formData.mileage}
                    onChange={(e) => setFormData(prev => ({ ...prev, mileage: e.target.value }))}
                    placeholder="np. 45500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="photos">
                  Zdjęcia <span className="text-destructive">*</span>
                </Label>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                  <input
                    id="photos"
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*"
                    required
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

              <div className="space-y-2">
                <Label htmlFor="returnNotes">Notatka ze zwrotu</Label>
                <Textarea
                  id="returnNotes"
                  value={formData.returnNotes}
                  onChange={(e) => setFormData(prev => ({ ...prev, returnNotes: e.target.value }))}
                  placeholder="Dodatkowe uwagi dotyczące stanu pojazdu..."
                  rows={6}
                />
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

export default VehicleReturn;
