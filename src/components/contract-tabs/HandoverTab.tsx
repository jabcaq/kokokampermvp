import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Truck, ExternalLink, Edit } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
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
    </div>
  );
};
