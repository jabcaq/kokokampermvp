import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Package, ExternalLink, Edit, Image as ImageIcon, FileText, Copy, Link as LinkIcon, CalendarCheck } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import type { VehicleReturn } from "@/hooks/useVehicleReturns";
import { useToast } from "@/hooks/use-toast";

interface ReturnTabProps {
  contractId: string;
  contractNumber: string;
  tenantName: string;
  startDate: string;
  endDate: string;
  vehicleModel: string;
  returns: VehicleReturn[] | undefined;
  scheduledReturn?: any;
}

export const ReturnTab = ({ contractId, contractNumber, tenantName, startDate, endDate, vehicleModel, returns, scheduledReturn }: ReturnTabProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [previewReturn, setPreviewReturn] = useState<VehicleReturn | null>(null);
  
  const returnBookingLink = `/return-booking/${contractId}?contractNumber=${encodeURIComponent(contractNumber)}&tenantName=${encodeURIComponent(tenantName)}&vehicleModel=${encodeURIComponent(vehicleModel)}&startDate=${startDate}&endDate=${endDate}`;

  const copyBookingLink = () => {
    navigator.clipboard.writeText(returnBookingLink);
    toast({
      title: "Link skopiowany",
      description: "Link do rezerwacji terminu zwrotu został skopiowany.",
    });
  };
  
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
      {/* Booking link card */}
      <Card className="shadow-md border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5" />
            Rezerwacja terminu zwrotu
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Wyślij klientowi link do rezerwacji terminu zwrotu kampera. Klient wybierze dogodny termin w kalendarzu.
          </p>
          {scheduledReturn && (
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <Label className="text-sm font-semibold">Zarezerwowany termin:</Label>
              <div className="flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-primary" />
                <span className="font-medium">
                  {format(new Date(scheduledReturn.scheduled_return_date), "dd.MM.yyyy")} o {scheduledReturn.scheduled_return_time}
                </span>
              </div>
              {scheduledReturn.booking_notes && (
                <p className="text-sm text-muted-foreground mt-2">
                  Uwagi: {scheduledReturn.booking_notes}
                </p>
              )}
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={copyBookingLink} variant="outline" className="gap-2 flex-1">
              <Copy className="h-4 w-4" />
              Skopiuj link do rezerwacji
            </Button>
            <Button 
              onClick={() => navigate(returnBookingLink)} 
              variant="outline"
              className="gap-2"
            >
              <LinkIcon className="h-4 w-4" />
              Otwórz
            </Button>
          </div>
        </CardContent>
      </Card>

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
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setPreviewReturn(returnData)}
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

      {/* Return Preview Dialog */}
      <Dialog open={!!previewReturn} onOpenChange={() => setPreviewReturn(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Podgląd protokołu zwrotu</DialogTitle>
          </DialogHeader>
          {previewReturn && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Przebieg</Label>
                  <p className="font-medium text-lg">{previewReturn.mileage} km</p>
                </div>
                <div>
                  <Label>Poziom paliwa</Label>
                  <p className="font-medium text-lg">{previewReturn.fuel_level}%</p>
                </div>
                <div>
                  <Label>Data zwrotu</Label>
                  <p className="font-medium text-lg">{format(new Date(previewReturn.created_at), 'dd.MM.yyyy HH:mm')}</p>
                </div>
                <div>
                  <Label>Pracownik</Label>
                  <p className="font-medium text-lg">{previewReturn.employee_name}</p>
                </div>
                <div>
                  <Label>Zwrot kaucji</Label>
                  <p className="font-medium text-lg">{previewReturn.can_refund_deposit ? 'Tak' : 'Nie'}</p>
                </div>
                <div>
                  <Label>Usterki</Label>
                  <p className="font-medium text-lg">{previewReturn.vehicle_issue ? 'Tak' : 'Nie'}</p>
                </div>
              </div>

              {previewReturn.return_notes && (
                <div>
                  <Label>Uwagi</Label>
                  <p className="text-muted-foreground text-base">{previewReturn.return_notes}</p>
                </div>
              )}

              {/* Photos Gallery */}
              {previewReturn.photos && Array.isArray(previewReturn.photos) && previewReturn.photos.length > 0 && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Zdjęcia ({previewReturn.photos.length})
                  </Label>
                  <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                    {previewReturn.photos.map((photo: any, index: number) => {
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
