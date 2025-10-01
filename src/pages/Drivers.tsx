import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Send } from "lucide-react";
import { toast } from "sonner";

const Drivers = () => {
  const [formData, setFormData] = useState({
    contractNumber: "",
    driverName: "",
    driverEmail: "",
    driverPhone: "",
    licenseNumber: "",
    licenseIssueDate: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Formularz zgłoszenia kierowcy został wysłany!", {
      description: `Dla umowy: ${formData.contractNumber}`,
    });
    setFormData({
      contractNumber: "",
      driverName: "",
      driverEmail: "",
      driverPhone: "",
      licenseNumber: "",
      licenseIssueDate: "",
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Zgłoszenie kierowców</h1>
        <p className="text-muted-foreground">Formularz rejestracji kierowców do umowy</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Dane kierowcy
            </CardTitle>
            <CardDescription>
              Wypełnij formularz, aby zgłosić kierowcę do wybranej umowy
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="contractNumber">Numer umowy *</Label>
                <Select
                  value={formData.contractNumber}
                  onValueChange={(value) =>
                    setFormData({ ...formData, contractNumber: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz umowę" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UM/2024/001">UM/2024/001 - Jan Kowalski</SelectItem>
                    <SelectItem value="UM/2024/002">UM/2024/002 - Anna Nowak</SelectItem>
                    <SelectItem value="UM/2024/003">UM/2024/003 - Piotr Wiśniewski</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="driverName">Imię i nazwisko kierowcy *</Label>
                  <Input
                    id="driverName"
                    value={formData.driverName}
                    onChange={(e) =>
                      setFormData({ ...formData, driverName: e.target.value })
                    }
                    placeholder="Jan Kowalski"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="driverEmail">Email kierowcy *</Label>
                  <Input
                    id="driverEmail"
                    type="email"
                    value={formData.driverEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, driverEmail: e.target.value })
                    }
                    placeholder="kierowca@email.com"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="driverPhone">Telefon kierowcy *</Label>
                  <Input
                    id="driverPhone"
                    value={formData.driverPhone}
                    onChange={(e) =>
                      setFormData({ ...formData, driverPhone: e.target.value })
                    }
                    placeholder="+48 500 123 456"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="licenseNumber">Numer prawa jazdy *</Label>
                  <Input
                    id="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, licenseNumber: e.target.value })
                    }
                    placeholder="ABC123456"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="licenseIssueDate">Data wydania prawa jazdy *</Label>
                <Input
                  id="licenseIssueDate"
                  type="date"
                  value={formData.licenseIssueDate}
                  onChange={(e) =>
                    setFormData({ ...formData, licenseIssueDate: e.target.value })
                  }
                  required
                />
              </div>

              <Button type="submit" className="w-full gap-2 shadow-md">
                <Send className="h-4 w-4" />
                Wyślij zgłoszenie
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Informacje</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="font-medium text-foreground mb-1">Wymagane dokumenty:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Prawo jazdy kategorii B</li>
                  <li>Dokument tożsamości</li>
                  <li>Min. 2 lata doświadczenia</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Ważne:</p>
                <p className="text-muted-foreground">
                  Każda umowa może mieć maksymalnie 3 zgłoszonych kierowców.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md bg-gradient-subtle border-primary/20">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                Potrzebujesz dodać więcej kierowców lub masz pytania? Skontaktuj się z naszym
                działem obsługi klienta.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Drivers;
