import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Truck, Upload, Plus } from "lucide-react";
import { format } from "date-fns";
import type { VehicleHandover } from "@/hooks/useVehicleHandovers";

interface HandoverTabProps {
  contractId: string;
  handovers: VehicleHandover[] | undefined;
  onSubmit: (data: any) => void;
}

export const HandoverTab = ({ contractId, handovers, onSubmit }: HandoverTabProps) => {
  const [formData, setFormData] = useState({
    mileage: "",
    fuelLevel: "",
    photos: [] as string[],
    handoverProtocolFiles: [] as string[],
  });
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      contract_id: contractId,
      mileage: parseInt(formData.mileage),
      fuel_level: parseInt(formData.fuelLevel),
      photos: formData.photos,
      handover_protocol_files: formData.handoverProtocolFiles,
    });
    setFormData({
      mileage: "",
      fuelLevel: "",
      photos: [],
      handoverProtocolFiles: [],
    });
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Existing handovers */}
      {handovers && handovers.length > 0 && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Historia wydań
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {handovers.map((handover) => (
              <div key={handover.id} className="p-4 border rounded-lg space-y-2">
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
      )}

      {/* New handover form */}
      {!showForm ? (
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Dodaj protokół wydania
        </Button>
      ) : (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Nowy protokół wydania
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mileage">Przebieg (km) *</Label>
                  <Input
                    id="mileage"
                    type="number"
                    required
                    value={formData.mileage}
                    onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fuelLevel">Poziom paliwa (%) *</Label>
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
              <div className="flex gap-2">
                <Button type="submit">Zapisz protokół</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Anuluj
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {handovers && handovers.length === 0 && !showForm && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Brak protokołów wydania</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
