import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, X, Edit, Eye, ArrowLeft, Trash2, CheckCircle, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAddVehicleReturn, useUpdateVehicleReturn, useVehicleReturns, useDeleteVehicleReturn } from "@/hooks/useVehicleReturns";
import { useCreateNotification } from "@/hooks/useNotifications";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

const VehicleReturn = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const addReturnMutation = useAddVehicleReturn();
  const updateReturnMutation = useUpdateVehicleReturn();
  const deleteReturnMutation = useDeleteVehicleReturn();
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
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);

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
        
        // Create notification for deposit refund to account
        if (formData.canRefundDeposit && !formData.depositRefundedCash) {
          await createNotificationMutation.mutateAsync({
            type: 'deposit_refund',
            title: 'Zwrot kaucji na konto',
            message: `Kaucja dla umowy ${contractNumber} (${tenantName}) może zostać zwrócona na konto`,
            link: `/contracts/${contractId}`,
          });
        }
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

  const handleDelete = async () => {
    if (!existingReturn) return;
    
    try {
      await deleteReturnMutation.mutateAsync(existingReturn.id);
      toast({
        title: "Sukces",
        description: "Protokół zwrotu został usunięty.",
      });
      navigate(-1);
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const openImageDialog = (index: number) => {
    setSelectedImageIndex(index);
    setIsImageDialogOpen(true);
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    if (selectedImageIndex === null) return;
    
    const newIndex = direction === 'prev' 
      ? (selectedImageIndex - 1 + existingPhotos.length) % existingPhotos.length
      : (selectedImageIndex + 1) % existingPhotos.length;
    
    setSelectedImageIndex(newIndex);
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
          onClick={() => navigate(`/contracts/${contractId}`)}
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
                <div className="flex gap-2 ml-4">
                  <Button
                    variant={isEditMode ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsEditMode(!isEditMode)}
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
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Usuń
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Czy na pewno chcesz usunąć?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Ta akcja nie może być cofnięta. Protokół zwrotu zostanie trwale usunięty.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Anuluj</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>Usuń</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
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

            {existingReturn && !isEditMode ? (
              <div className="space-y-6">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Osoba wypełniająca formularz</p>
                  <p className="text-lg font-semibold">{formData.employeeName}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-muted rounded-lg flex items-center gap-3">
                    {formData.canRefundDeposit ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground">Zwrot kaucji - konto</p>
                      <p className="font-medium">{formData.canRefundDeposit ? "Tak" : "Nie"}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg flex items-center gap-3">
                    {formData.depositRefundedCash ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground">Kaucja zwrócona gotówką</p>
                      <p className="font-medium">{formData.depositRefundedCash ? "Tak" : "Nie"}</p>
                    </div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg flex items-center gap-3">
                    {formData.vehicleIssue ? (
                      <XCircle className="h-5 w-5 text-red-500" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground">Problem z kamperem</p>
                      <p className="font-medium">{formData.vehicleIssue ? "Tak" : "Nie"}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Ilość paliwa</p>
                    <p className="text-lg font-semibold">{formData.fuelLevel}%</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Ilość KM na liczniku</p>
                    <p className="text-lg font-semibold">{formData.mileage}</p>
                  </div>
                </div>

                {existingPhotos.length > 0 && (
                  <div className="space-y-2">
                    <Label>Zdjęcia ({existingPhotos.length})</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {existingPhotos.map((url, index) => (
                        <div
                          key={index}
                          onClick={() => openImageDialog(index)}
                          className="relative aspect-square group cursor-pointer"
                        >
                          <img
                            src={url}
                            alt={`Zdjęcie ${index + 1}`}
                            className="w-full h-full object-cover rounded-lg hover:opacity-90 transition-opacity"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {formData.returnNotes && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Notatka ze zwrotu</p>
                    <p className="text-sm whitespace-pre-wrap">{formData.returnNotes}</p>
                  </div>
                )}
              </div>
            ) : (
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
                  <div className="border-2 border-dashed rounded-lg p-6">
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
                    
                    <div className="grid grid-cols-4 gap-2">
                      {existingPhotos.map((url, index) => (
                        <div key={`existing-${index}`} className="relative group aspect-square">
                          <img
                            src={url}
                            alt={`Istniejące ${index + 1}`}
                            className="w-full h-full object-cover rounded-lg"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeExistingPhoto(url)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      
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
                  <Button type="submit" disabled={addReturnMutation.isPending || updateReturnMutation.isPending}>
                    {(addReturnMutation.isPending || updateReturnMutation.isPending) ? 'Zapisywanie...' : (existingReturn ? 'Zaktualizuj' : 'Wyślij')}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
          <DialogContent className="max-w-4xl w-full p-0">
            {selectedImageIndex !== null && (
              <div className="relative">
                <img
                  src={existingPhotos[selectedImageIndex]}
                  alt={`Zdjęcie ${selectedImageIndex + 1}`}
                  className="w-full h-auto max-h-[80vh] object-contain"
                />
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-background/80 backdrop-blur-sm px-4 py-2 rounded-full">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigateImage('prev')}
                    disabled={existingPhotos.length <= 1}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <span className="text-sm font-medium">
                    {selectedImageIndex + 1} / {existingPhotos.length}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigateImage('next')}
                    disabled={existingPhotos.length <= 1}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default VehicleReturn;
