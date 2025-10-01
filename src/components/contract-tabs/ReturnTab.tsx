import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Package, ExternalLink, Edit, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import type { VehicleReturn } from "@/hooks/useVehicleReturns";

interface ReturnTabProps {
  contractId: string;
  contractNumber: string;
  tenantName: string;
  startDate: string;
  endDate: string;
  vehicleModel: string;
  returns: VehicleReturn[] | undefined;
}

export const ReturnTab = ({ contractId, contractNumber, tenantName, startDate, endDate, vehicleModel, returns }: ReturnTabProps) => {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const handleOpenForm = () => {
    const params = new URLSearchParams({
      contractId,
      contractNumber,
      tenantName,
      startDate,
      endDate,
      vehicleModel
    });
    navigate(`/vehicle-return?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      {/* Button to open return form */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Formularz zdania pojazdu
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Otwórz formularz zdania pojazdu dla pracownika. Dane umowy zostaną automatycznie przekazane.
          </p>
          <Button onClick={handleOpenForm} className="gap-2">
            <ExternalLink className="h-4 w-4" />
            Otwórz formularz zdania
          </Button>
        </CardContent>
      </Card>

      {/* Existing returns */}
      {returns && returns.length > 0 ? (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Historia zwrotów
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {returns.map((returnData) => (
              <div key={returnData.id} className="p-4 border rounded-lg space-y-4">
                <div className="flex justify-between items-start">
                  <h4 className="font-semibold">Protokół zwrotu</h4>
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Przebieg</Label>
                    <p className="font-medium">{returnData.mileage} km</p>
                  </div>
                  <div>
                    <Label>Poziom paliwa</Label>
                    <p className="font-medium">{returnData.fuel_level}%</p>
                  </div>
                  <div>
                    <Label>Data zwrotu</Label>
                    <p className="font-medium">{format(new Date(returnData.created_at), 'dd.MM.yyyy HH:mm')}</p>
                  </div>
                  <div>
                    <Label>Pracownik</Label>
                    <p className="font-medium">{returnData.employee_name}</p>
                  </div>
                  <div>
                    <Label>Zwrot kaucji</Label>
                    <p className="font-medium">{returnData.can_refund_deposit ? 'Tak' : 'Nie'}</p>
                  </div>
                  <div>
                    <Label>Usterki</Label>
                    <p className="font-medium">{returnData.vehicle_issue ? 'Tak' : 'Nie'}</p>
                  </div>
                </div>
                {returnData.return_notes && (
                  <div>
                    <Label>Uwagi</Label>
                    <p className="text-muted-foreground">{returnData.return_notes}</p>
                  </div>
                )}

                {/* Photos Gallery */}
                {returnData.photos && Array.isArray(returnData.photos) && returnData.photos.length > 0 && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Zdjęcia ({returnData.photos.length})
                    </Label>
                    <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                      {returnData.photos.map((photo: any, index: number) => {
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
            <p className="text-center text-muted-foreground">Brak protokołów zdania. Użyj formularza powyżej, aby dodać protokół.</p>
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
    </div>
  );
};
