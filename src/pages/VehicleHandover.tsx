import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, FileText, Edit, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAddVehicleHandover, useUpdateVehicleHandover, useVehicleHandovers } from "@/hooks/useVehicleHandovers";
import { useCreateNotification } from "@/hooks/useNotifications";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

const VehicleHandover = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const addHandoverMutation = useAddVehicleHandover();
  const updateHandoverMutation = useUpdateVehicleHandover();
  const createNotificationMutation = useCreateNotification();
  
  
  const contractId = searchParams.get('contractId');
  const contractNumber = searchParams.get('contractNumber');
  const tenantName = searchParams.get('tenantName');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const vehicleModel = searchParams.get('vehicleModel');

  const { data: existingHandovers } = useVehicleHandovers(contractId || undefined);
  const existingHandover = existingHandovers?.[0];

  const [isEditMode, setIsEditMode] = useState(false);

  const [formData, setFormData] = useState({
    mileage: "",
    fuelLevel: "",
    handoverProtocol: null as File[] | null,
    photos: null as File[] | null,
  });

  const [existingFiles, setExistingFiles] = useState<{
    protocols: string[];
    photos: string[];
  }>({
    protocols: [],
    photos: [],
  });

  // Load existing data when available
  useEffect(() => {
    if (existingHandover) {
      setFormData({
        mileage: existingHandover.mileage.toString(),
        fuelLevel: existingHandover.fuel_level.toString(),
        handoverProtocol: null,
        photos: null,
      });
      setExistingFiles({
        protocols: existingHandover.handover_protocol_files || [],
        photos: existingHandover.photos || [],
      });
    }
  }, [existingHandover]);

  const uploadFiles = async (files: File[], folder: string): Promise<string[]> => {
    const uploadPromises = files.map(async (file) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('vehicle-documents')
        .upload(filePath, file);

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
    
    try {
      // Upload new files to storage
      const newProtocolUrls = formData.handoverProtocol 
        ? await uploadFiles(formData.handoverProtocol, 'handover-protocols')
        : [];
      
      const newPhotoUrls = formData.photos 
        ? await uploadFiles(formData.photos, 'handover-photos')
        : [];

      // Combine existing files (that weren't removed) with new uploads
      const allProtocolUrls = [...existingFiles.protocols, ...newProtocolUrls];
      const allPhotoUrls = [...existingFiles.photos, ...newPhotoUrls];

      const handoverData = {
        contract_id: contractId,
        mileage: parseInt(formData.mileage),
        fuel_level: parseInt(formData.fuelLevel),
        handover_protocol_files: allProtocolUrls,
        photos: allPhotoUrls,
      };

      if (existingHandover) {
        // Update existing record
        await updateHandoverMutation.mutateAsync({
          id: existingHandover.id,
          ...handoverData,
        });
      } else {
        // Create new record
        await addHandoverMutation.mutateAsync(handoverData);
        
        // Create notification for new handover
        await createNotificationMutation.mutateAsync({
          type: 'handover_new',
          title: 'Nowy formularz wydania pojazdu',
          message: `Wypełniono formularz wydania dla umowy ${contractNumber} (${vehicleModel})`,
          link: `/contracts/${contractId}`,
        });
      }

      // Reset new files only
      setFormData(prev => ({
        ...prev,
        handoverProtocol: null,
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

  const removeExistingFile = (type: 'protocols' | 'photos', url: string) => {
    setExistingFiles(prev => ({
      ...prev,
      [type]: prev[type].filter(fileUrl => fileUrl !== url),
    }));
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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Formularz wydania</CardTitle>
                <CardDescription>
                  Ten formularz służy do rejestracji procesu wydania kampera. Prosimy o dodanie protokołu zdawczego oraz zdjęć dokumentujących wydanie pojazdu. Upewnij się, że wszystkie załączniki są kompletne i czytelne.
                </CardDescription>
              </div>
              {existingHandover && (
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mileage">Ilość KM na liczniku</Label>
                  <Input
                    id="mileage"
                    type="number"
                    required
                    value={formData.mileage}
                    onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                    disabled={existingHandover && !isEditMode}
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
                    disabled={existingHandover && !isEditMode}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="handoverProtocol">Protokół z wydania</Label>
                <div className="border-2 border-dashed rounded-lg p-6">
                  {(!existingHandover || isEditMode) && (
                    <div className="text-center mb-4">
                      <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                      <input
                        id="handoverProtocol"
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileChange('handoverProtocol')}
                      />
                      <label htmlFor="handoverProtocol" className="cursor-pointer">
                        <span className="text-primary hover:underline">Przeciągnij pliki lub kliknij aby wybrać</span>
                      </label>
                    </div>
                  )}
                  
                  {/* Existing protocol files */}
                  {existingFiles.protocols.length > 0 && (
                    <div className="mb-4 space-y-2">
                      <p className="text-sm font-medium">Istniejące pliki:</p>
                      {existingFiles.protocols.map((url, index) => (
                        <div key={`existing-${index}`} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                          <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline truncate">
                            <FileText className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">Protokół {index + 1}</span>
                          </a>
                          {isEditMode && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeExistingFile('protocols', url)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* New protocol files */}
                  {formData.handoverProtocol && formData.handoverProtocol.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Nowe pliki:</p>
                      {formData.handoverProtocol.map((file, index) => (
                        <div key={`new-${index}`} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                          <span className="truncate">{file.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newFiles = formData.handoverProtocol?.filter((_, i) => i !== index) || null;
                              setFormData({ ...formData, handoverProtocol: newFiles?.length ? newFiles : null });
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="photos">Zdjęcia</Label>
                <div className="border-2 border-dashed rounded-lg p-6">
                  {(!existingHandover || isEditMode) && (
                    <div className="text-center mb-4">
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
                        <span className="text-primary hover:underline">Przeciągnij zdjęcia lub kliknij aby wybrać</span>
                      </label>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-4 gap-2">
                    {/* Existing photos */}
                    {existingFiles.photos.map((url, index) => (
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
                              onClick={() => removeExistingFile('photos', url)}
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

              {(!existingHandover || isEditMode) && (
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleClearForm}
                    className="gap-2"
                  >
                    Clear form
                  </Button>
                  <Button type="submit" disabled={addHandoverMutation.isPending || updateHandoverMutation.isPending}>
                    {(addHandoverMutation.isPending || updateHandoverMutation.isPending) ? 'Zapisywanie...' : (existingHandover ? 'Zaktualizuj' : 'Wyślij')}
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

export default VehicleHandover;
