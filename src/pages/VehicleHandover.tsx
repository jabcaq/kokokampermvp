import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAddVehicleHandover } from "@/hooks/useVehicleHandovers";
import { format } from "date-fns";

const VehicleHandover = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const addHandoverMutation = useAddVehicleHandover();
  
  const contractId = searchParams.get('contractId');
  const contractNumber = searchParams.get('contractNumber');
  const tenantName = searchParams.get('tenantName');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const vehicleModel = searchParams.get('vehicleModel');

  const [formData, setFormData] = useState({
    mileage: "",
    fuelLevel: "",
    handoverProtocol: null as File[] | null,
    photos: null as File[] | null,
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
    
    try {
      await addHandoverMutation.mutateAsync({
        contract_id: contractId,
        mileage: parseInt(formData.mileage),
        fuel_level: parseInt(formData.fuelLevel),
        handover_protocol_files: [],
        photos: [],
      });

      // Reset form
      setFormData({
        mileage: "",
        fuelLevel: "",
        handoverProtocol: null,
        photos: null,
      });
    } catch (error) {
      // Error is handled by the mutation
    }
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
            <CardTitle>Formularz wydania</CardTitle>
            <CardDescription>
              Ten formularz służy do rejestracji procesu wydania kampera. Prosimy o dodanie protokołu zdawczego oraz zdjęć dokumentujących wydanie pojazdu. Upewnij się, że wszystkie załączniki są kompletne i czytelne.
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mileage">Ilość KM na liczniku</Label>
                  <Input
                    id="mileage"
                    type="number"
                    required
                    value={formData.mileage}
                    onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fuelLevel">Ilość paliwa</Label>
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="handoverProtocol">Protokół z wydania</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                  <input
                    id="handoverProtocol"
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileChange('handoverProtocol')}
                  />
                  <label htmlFor="handoverProtocol" className="cursor-pointer">
                    <span className="text-primary hover:underline">Drop files here or browse</span>
                  </label>
                  {formData.handoverProtocol && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {formData.handoverProtocol.length} plików wybranych
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="photos">Zdjęcia</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                  <input
                    id="photos"
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange('photos')}
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

              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleClearForm}
                  className="gap-2"
                >
                  Clear form
                </Button>
                <Button type="submit" disabled={addHandoverMutation.isPending}>
                  {addHandoverMutation.isPending ? 'Wysyłanie...' : 'Wyślij'}
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
