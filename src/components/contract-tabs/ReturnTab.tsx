import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Package, Plus } from "lucide-react";
import { format } from "date-fns";
import type { VehicleReturn } from "@/hooks/useVehicleReturns";

interface ReturnTabProps {
  contractId: string;
  returns: VehicleReturn[] | undefined;
  onSubmit: (data: any) => void;
}

export const ReturnTab = ({ contractId, returns, onSubmit }: ReturnTabProps) => {
  const [formData, setFormData] = useState({
    mileage: "",
    fuelLevel: "",
    employeeName: "",
    employeeId: "",
    canRefundDeposit: false,
    depositRefundedCash: false,
    vehicleIssue: false,
    returnNotes: "",
    photos: [] as string[],
  });
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      contract_id: contractId,
      mileage: parseInt(formData.mileage),
      fuel_level: parseInt(formData.fuelLevel),
      employee_name: formData.employeeName,
      employee_id: formData.employeeId || null,
      can_refund_deposit: formData.canRefundDeposit,
      deposit_refunded_cash: formData.depositRefundedCash,
      vehicle_issue: formData.vehicleIssue,
      return_notes: formData.returnNotes || null,
      photos: formData.photos,
    });
    setFormData({
      mileage: "",
      fuelLevel: "",
      employeeName: "",
      employeeId: "",
      canRefundDeposit: false,
      depositRefundedCash: false,
      vehicleIssue: false,
      returnNotes: "",
      photos: [],
    });
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Existing returns */}
      {returns && returns.length > 0 && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Historia zwrotów
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {returns.map((returnData) => (
              <div key={returnData.id} className="p-4 border rounded-lg space-y-2">
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
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* New return form */}
      {!showForm ? (
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Dodaj protokół zdania
        </Button>
      ) : (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Nowy protokół zdania
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
                <div className="space-y-2">
                  <Label htmlFor="employeeName">Imię i nazwisko pracownika *</Label>
                  <Input
                    id="employeeName"
                    required
                    value={formData.employeeName}
                    onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employeeId">ID pracownika</Label>
                  <Input
                    id="employeeId"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="canRefundDeposit"
                    checked={formData.canRefundDeposit}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, canRefundDeposit: checked as boolean })
                    }
                  />
                  <Label htmlFor="canRefundDeposit" className="cursor-pointer">
                    Możliwy zwrot kaucji
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
                    Kaucja zwrócona gotówką
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
                    Pojazd wymaga naprawy
                  </Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="returnNotes">Uwagi</Label>
                <Textarea
                  id="returnNotes"
                  value={formData.returnNotes}
                  onChange={(e) => setFormData({ ...formData, returnNotes: e.target.value })}
                  rows={4}
                />
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

      {returns && returns.length === 0 && !showForm && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Brak protokołów zdania</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
