import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAddVehicleReturn } from "@/hooks/useVehicleReturns";
import { format } from "date-fns";

const VehicleReturn = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const addReturnMutation = useAddVehicleReturn();
  
  const contractId = searchParams.get('contractId');
  const contractNumber = searchParams.get('contractNumber');
  const tenantName = searchParams.get('tenantName');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const vehicleModel = searchParams.get('vehicleModel');

  const [formData, setFormData] = useState({
    employeeName: "",
    employeeId: "",
    canRefundDeposit: false,
    depositRefundedCash: false,
    vehicleIssue: false,
    fuelLevel: "",
    mileage: "",
    photos: null as File[] | null,
    returnNotes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contractId) {
      toast({
        title: "Błąd",
        description: "Brak ID umowy.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.employeeName) {
      toast({
        title: "Błąd",
        description: "Wybierz osobę wypełniającą formularz.",
        variant: "destructive",
      });
      return;
    }

    try {
      await addReturnMutation.mutateAsync({
        contract_id: contractId,
        mileage: parseInt(formData.mileage),
        fuel_level: parseInt(formData.fuelLevel),
        employee_name: formData.employeeName,
        employee_id: formData.employeeId || null,
        can_refund_deposit: formData.canRefundDeposit,
        deposit_refunded_cash: formData.depositRefundedCash,
        vehicle_issue: formData.vehicleIssue,
        return_notes: formData.returnNotes || null,
        photos: [],
      });

      // Reset form
      setFormData({
        employeeName: "",
        employeeId: "",
        canRefundDeposit: false,
        depositRefundedCash: false,
        vehicleIssue: false,
        fuelLevel: "",
        mileage: "",
        photos: null,
        returnNotes: "",
      });
    } catch (error) {
      // Error is handled by the mutation
    }
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
      employeeName: "",
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

  if (!contractId || !contractNumber) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Błąd</CardTitle>
            <CardDescription>Brak wymaganych parametrów umowy. Sprawdź poprawność linku.</CardDescription>
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
            <CardTitle>Formularz zwrotu kampera</CardTitle>
            <CardDescription>
              Proszę wypełnić poniższy formularz, aby potwierdzić stan kampera przy zwrocie. Upewnij się, że wszystkie sekcje zostały dokładnie sprawdzone, a wszelkie uszkodzenia lub brakujące elementy odnotowane. Na podstawie tych informacji podejmiemy decyzję o zwrocie kaucji. Dziękujemy za współpracę!
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Contract info */}
            <div className="mb-6 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Dane umowy:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <p><span className="font-medium">Numer umowy:</span> {contractNumber}</p>
                <p><span className="font-medium">Najemca:</span> {tenantName}</p>
                <p><span className="font-medium">Pojazd:</span> {vehicleModel}</p>
                <p><span className="font-medium">Okres najmu:</span> {startDate && format(new Date(startDate), 'dd.MM.yyyy')} - {endDate && format(new Date(endDate), 'dd.MM.yyyy')}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="employeeName">Osoba wypełniająca formularz *</Label>
                <Input
                  id="employeeName"
                  required
                  value={formData.employeeName}
                  onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })}
                  placeholder="Imię i nazwisko pracownika"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="canRefundDeposit"
                    checked={formData.canRefundDeposit}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, canRefundDeposit: checked as boolean })
                    }
                  />
                  <Label htmlFor="canRefundDeposit" className="cursor-pointer">
                    Czy można zwrócić kaucję - konto
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="depositRefundedCash"
                    checked={formData.depositRefundedCash}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, depositRefundedCash: checked as boolean })
                    }
                  />
                  <Label htmlFor="depositRefundedCash" className="cursor-pointer">
                    Czy kaucja zwrócona gotówką?
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="vehicleIssue"
                    checked={formData.vehicleIssue}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, vehicleIssue: checked as boolean })
                    }
                  />
                  <Label htmlFor="vehicleIssue" className="cursor-pointer">
                    Problem z kamperem
                  </Label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fuelLevel">Ilość paliwa *</Label>
                  <Input
                    id="fuelLevel"
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={formData.fuelLevel}
                    onChange={(e) => setFormData({ ...formData, fuelLevel: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mileage">Ilość KM na liczniku *</Label>
                  <Input
                    id="mileage"
                    type="number"
                    required
                    value={formData.mileage}
                    onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="photos">Zdjęcia *</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                  <input
                    id="photos"
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <label htmlFor="photos" className="cursor-pointer">
                    <span className="text-primary hover:underline">Drop files here or browse</span>
                  </label>
                  {formData.photos && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {formData.photos.length} zdjęć wybranych
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="returnNotes">Notatka ze zwrotu</Label>
                <Textarea
                  id="returnNotes"
                  value={formData.returnNotes}
                  onChange={(e) => setFormData({ ...formData, returnNotes: e.target.value })}
                  rows={4}
                  placeholder="Dodatkowe uwagi dotyczące zwrotu pojazdu..."
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleClearForm}
                  className="gap-2"
                >
                  Clear form
                </Button>
                <Button type="submit" disabled={addReturnMutation.isPending}>
                  {addReturnMutation.isPending ? 'Wysyłanie...' : 'Wyślij'}
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
