import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, X, Edit, Eye, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAddVehicleReturn, useUpdateVehicleReturn, useVehicleReturns } from "@/hooks/useVehicleReturns";
import { useCreateNotification } from "@/hooks/useNotifications";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

const VehicleReturn = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const addReturnMutation = useAddVehicleReturn();
  const updateReturnMutation = useUpdateVehicleReturn();
  const createNotificationMutation = useCreateNotification();
  
  
  const contractId = searchParams.get('contractId');
  const contractNumber = searchParams.get('contractNumber');
  const tenantName = searchParams.get('tenantName');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const vehicleModel = searchParams.get('vehicleModel');

  const { data: existingReturns } = useVehicleReturns(contractId || undefined);
  const existingReturn = existingReturns?.[0];

  const [isEditMode, setIsEditMode] = useState(false);

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

  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);

  // Load existing data when available
  useEffect(() => {
    if (existingReturn) {
      setFormData({
        employeeName: existingReturn.employee_name,
        employeeId: existingReturn.employee_id || "",
        canRefundDeposit: existingReturn.can_refund_deposit,
        depositRefundedCash: existingReturn.deposit_refunded_cash,
        vehicleIssue: existingReturn.vehicle_issue,
        fuelLevel: existingReturn.fuel_level.toString(),
        mileage: existingReturn.mileage.toString(),
        photos: null,
        returnNotes: existingReturn.return_notes || "",
      });
      setExistingPhotos(existingReturn.photos || []);
    }
  }, [existingReturn]);

  const uploadPhotos = async (photos: File[]): Promise<string[]> => {
    const uploadPromises = photos.map(async (photo) => {
      const fileExt = photo.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `return-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('vehicle-documents')
        .upload(filePath, photo);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('vehicle-documents')
        .getPublicUrl(filePath);

      return publicUrl;
    });

    return Promise.all(uploadPromises);
  };

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
      // Upload new photos to storage
      const newPhotoUrls = formData.photos 
        ? await uploadPhotos(formData.photos)
        : [];

      // Combine existing photos (that weren't removed) with new uploads
      const allPhotoUrls = [...existingPhotos, ...newPhotoUrls];

      const returnData = {
        contract_id: contractId,
        mileage: parseInt(formData.mileage),
        fuel_level: parseInt(formData.fuelLevel),
        employee_name: formData.employeeName,
        employee_id: formData.employeeId || null,
        can_refund_deposit: formData.canRefundDeposit,
        deposit_refunded_cash: formData.depositRefundedCash,
        vehicle_issue: formData.vehicleIssue,
        return_notes: formData.returnNotes || null,
        photos: allPhotoUrls,
      };

      if (existingReturn) {
        // Update existing record
        await updateReturnMutation.mutateAsync({
          id: existingReturn.id,
          ...returnData,
        });
        // Disable edit mode after successful update
        setIsEditMode(false);
      } else {
        // Create new record
        await addReturnMutation.mutateAsync(returnData);
        
        // Create notification for new return
        await createNotificationMutation.mutateAsync({
          type: 'return_new',
          title: 'Nowy formularz zwrotu pojazdu',
          message: `Wypełniono formularz zwrotu dla umowy ${contractNumber} (${vehicleModel})`,
          link: `/contracts/${contractId}`,
        });
      }

      // Reset new photos only
      setFormData(prev => ({
        ...prev,
        photos: null,
      }));
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się przesłać danych.",
        variant: "destructive",
      });
    }
  };

  const removeExistingPhoto = (url: string) => {
    setExistingPhotos(prev => prev.filter(photoUrl => photoUrl !== url));
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
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Powrót
        </Button>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Formularz zwrotu kampera</CardTitle>
                <CardDescription>
                  Proszę wypełnić poniższy formularz, aby potwierdzić stan kampera przy zwrocie. Upewnij się, że wszystkie sekcje zostały dokładnie sprawdzone, a wszelkie uszkodzenia lub brakujące elementy odnotowane. Na podstawie tych informacji podejmiemy decyzję o zwrocie kaucji. Dziękujemy za współpracę!
                </CardDescription>
              </div>
              {existingReturn && (
                <Button
                  variant={isEditMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsEditMode(!isEditMode)}
                  className="ml-4"
                >
                  {isEditMode ? (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Podgląd
                    </>
                  ) : (
                    <>
                      <Edit className="h-4 w-4 mr-2" />
                      Edytuj
                    </>
                  )}
                </Button>
              )}
            </div>
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
                  disabled={existingReturn && !isEditMode}
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
                    disabled={existingReturn && !isEditMode}
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
                    disabled={existingReturn && !isEditMode}
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
                    disabled={existingReturn && !isEditMode}
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
                    disabled={existingReturn && !isEditMode}
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
                    disabled={existingReturn && !isEditMode}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="photos">Zdjęcia *</Label>
                <div className="border-2 border-dashed rounded-lg p-6">
                  {(!existingReturn || isEditMode) && (
                    <div className="text-center mb-4">
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
                        <span className="text-primary hover:underline">Przeciągnij zdjęcia lub kliknij aby wybrać</span>
                      </label>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-4 gap-2">
                    {/* Existing photos */}
                    {existingPhotos.map((url, index) => (
                      <div key={`existing-${index}`} className="relative group aspect-square">
                        <img
                          src={url}
                          alt={`Istniejące ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                        {isEditMode && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeExistingPhoto(url)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                    
                    {/* New photos */}
                    {formData.photos && formData.photos.map((file, index) => (
                      <div key={`new-${index}`} className="relative group aspect-square">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Nowe ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            const newPhotos = formData.photos?.filter((_, i) => i !== index) || null;
                            setFormData({ ...formData, photos: newPhotos?.length ? newPhotos : null });
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
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
                  disabled={existingReturn && !isEditMode}
                />
              </div>

              {(!existingReturn || isEditMode) && (
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleClearForm}
                    className="gap-2"
                  >
                    Clear form
                  </Button>
                  <Button type="submit" disabled={addReturnMutation.isPending || updateReturnMutation.isPending}>
                    {(addReturnMutation.isPending || updateReturnMutation.isPending) ? 'Zapisywanie...' : (existingReturn ? 'Zaktualizuj' : 'Wyślij')}
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VehicleReturn;
