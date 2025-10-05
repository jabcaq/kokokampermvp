import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { User } from "lucide-react";

interface DriversTabProps {
  additionalDrivers: any[];
}

export const DriversTab = ({ additionalDrivers }: DriversTabProps) => {
  if (!additionalDrivers || additionalDrivers.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Brak dodatkowych kierowców</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Dodatkowi kierowcy
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {additionalDrivers.map((driver: any, idx: number) => (
          <div key={idx} className="p-4 border rounded-lg space-y-4">
            <h4 className="font-semibold">Kierowca #{idx + 1}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Imię i nazwisko</Label>
                <p className="font-medium text-foreground">{driver.imie_nazwisko || 'Nie podano'}</p>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <p className="font-medium text-foreground">{driver.email || 'Nie podano'}</p>
              </div>
              <div className="space-y-2">
                <Label>Telefon</Label>
                <p className="font-medium text-foreground">{driver.tel || 'Nie podano'}</p>
              </div>
              <div className="space-y-2">
                <Label>Numer prawa jazdy</Label>
                <p className="font-medium text-foreground">{driver.prawo_jazdy_numer || 'Nie podano'}</p>
              </div>
              <div className="space-y-2">
                <Label>Data wydania prawa jazdy</Label>
                <p className="font-medium text-foreground">{driver.prawo_jazdy_data || 'Nie podano'}</p>
              </div>
              <div className="space-y-2">
                <Label>Kategoria prawa jazdy</Label>
                <p className="font-medium text-foreground">{driver.prawo_jazdy_kategoria || 'Nie podano'}</p>
              </div>
              <div className="space-y-2">
                <Label>Rodzaj dokumentu</Label>
                <p className="font-medium text-foreground">{driver.dokument_rodzaj || 'Nie podano'}</p>
              </div>
              <div className="space-y-2">
                <Label>Numer dokumentu</Label>
                <p className="font-medium text-foreground">{driver.dokument_numer || 'Nie podano'}</p>
              </div>
              <div className="space-y-2">
                <Label>Organ wydający</Label>
                <p className="font-medium text-foreground">{driver.dokument_organ || 'Nie podano'}</p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
