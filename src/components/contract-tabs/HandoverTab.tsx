import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Truck, ExternalLink, Edit, FileText, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import type { VehicleHandover } from "@/hooks/useVehicleHandovers";

interface HandoverTabProps {
  contractId: string;
  contractNumber: string;
  tenantName: string;
  startDate: string;
  endDate: string;
  vehicleModel: string;
  handovers: VehicleHandover[] | undefined;
}

export const HandoverTab = ({ contractId, contractNumber, tenantName, startDate, endDate, vehicleModel, handovers }: HandoverTabProps) => {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [previewHandover, setPreviewHandover] = useState<VehicleHandover | null>(null);
  
  const handleOpenForm = () => {
    const params = new URLSearchParams({
      contractId,
      contractNumber,
      tenantName,
      startDate,
      endDate,
      vehicleModel
    });
    navigate(`/vehicle-handover?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      {/* Button to open handover form */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Formularz wydania pojazdu
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Otwórz formularz wydania pojazdu dla pracownika. Dane umowy zostaną automatycznie przekazane.
          </p>
          <Button onClick={handleOpenForm} className="gap-2">
            <ExternalLink className="h-4 w-4" />
            Otwórz formularz wydania
          </Button>
        </CardContent>
      </Card>

      {/* Existing handovers */}
      {handovers && handovers.length > 0 ? (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Historia wydań
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {handovers.map((handover) => (
              <div key={handover.id} className="p-4 border rounded-lg space-y-4">
                <div className="flex justify-between items-start">
                  <h4 className="font-semibold">Protokół wydania</h4>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setPreviewHandover(handover)}
                      className="gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      Podgląd
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleOpenForm}
                      className="gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Edytuj
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Przebieg</Label>
                    <p className="font-medium">{handover.mileage} km</p>
                  </div>
                  <div>
                    <Label>Poziom paliwa</Label>
                    <p className="font-medium">{handover.fuel_level}%</p>
                  </div>
                  <div>
                    <Label>Data wydania</Label>
                    <p className="font-medium">{format(new Date(handover.created_at), 'dd.MM.yyyy HH:mm')}</p>
                  </div>
                </div>

                {/* Protocol Files */}
                {handover.handover_protocol_files && Array.isArray(handover.handover_protocol_files) && handover.handover_protocol_files.length > 0 && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Pliki protokołu
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {handover.handover_protocol_files.map((file: any, index: number) => (
                        <a 
                          key={index}
                          href={file.url || file}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 bg-muted rounded-md text-sm hover:bg-muted/80 transition-colors flex items-center gap-2"
                        >
                          <FileText className="h-4 w-4" />
                          Plik {index + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Photos Gallery */}
                {handover.photos && Array.isArray(handover.photos) && handover.photos.length > 0 && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Zdjęcia ({handover.photos.length})
                    </Label>
                    <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                      {handover.photos.map((photo: any, index: number) => {
                        const photoUrl = photo.url || photo;
                        return (
                          <button
                            key={index}
                            onClick={() => setSelectedImage(photoUrl)}
                            className="aspect-square rounded-lg overflow-hidden border-2 border-border hover:border-primary transition-colors cursor-pointer"
                          >
                            <img 
                              src={photoUrl}
                              alt={`Zdjęcie ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Brak protokołów wydania. Użyj formularza powyżej, aby dodać protokół.</p>
          </CardContent>
        </Card>
      )}

      {/* Image Preview Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Podgląd zdjęcia</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <img 
              src={selectedImage}
              alt="Podgląd"
              className="w-full h-auto rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Handover Preview Dialog */}
      <Dialog open={!!previewHandover} onOpenChange={() => setPreviewHandover(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Podgląd protokołu wydania</DialogTitle>
          </DialogHeader>
          {previewHandover && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Przebieg</Label>
                  <p className="font-medium text-lg">{previewHandover.mileage} km</p>
                </div>
                <div>
                  <Label>Poziom paliwa</Label>
                  <p className="font-medium text-lg">{previewHandover.fuel_level}%</p>
                </div>
                <div>
                  <Label>Data wydania</Label>
                  <p className="font-medium text-lg">{format(new Date(previewHandover.created_at), 'dd.MM.yyyy HH:mm')}</p>
                </div>
              </div>

              {/* Protocol Files */}
              {previewHandover.handover_protocol_files && Array.isArray(previewHandover.handover_protocol_files) && previewHandover.handover_protocol_files.length > 0 && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Pliki protokołu
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {previewHandover.handover_protocol_files.map((file: any, index: number) => (
                      <a 
                        key={index}
                        href={file.url || file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 bg-muted rounded-md text-sm hover:bg-muted/80 transition-colors flex items-center gap-2"
                      >
                        <FileText className="h-4 w-4" />
                        Plik {index + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Photos Gallery */}
              {previewHandover.photos && Array.isArray(previewHandover.photos) && previewHandover.photos.length > 0 && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Zdjęcia ({previewHandover.photos.length})
                  </Label>
                  <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                    {previewHandover.photos.map((photo: any, index: number) => {
                      const photoUrl = photo.url || photo;
                      return (
                        <button
                          key={index}
                          onClick={() => setSelectedImage(photoUrl)}
                          className="aspect-square rounded-lg overflow-hidden border-2 border-border hover:border-primary transition-colors cursor-pointer"
                        >
                          <img 
                            src={photoUrl}
                            alt={`Zdjęcie ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
