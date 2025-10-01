import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Send, CheckCircle2, FileText, Plus } from "lucide-react";
import { toast } from "sonner";

// Mock data - w przyszłości z bazy danych
const contractsData: Record<string, { clientName: string; vehicle: string; startDate: string }> = {
  "UM/2024/001": { clientName: "Jan Kowalski", vehicle: "Kamper XYZ", startDate: "2024-03-15" },
  "UM/2024/002": { clientName: "Anna Nowak", vehicle: "Przyczepa ABC", startDate: "2024-04-01" },
  "UM/2024/003": { clientName: "Piotr Wiśniewski", vehicle: "Kamper 123", startDate: "2024-03-20" },
};

const DriverSubmission = () => {
  const { contractId } = useParams<{ contractId: string }>();
  const navigate = useNavigate();
  const [contract, setContract] = useState<typeof contractsData[string] | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [additionalDrivers, setAdditionalDrivers] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    driverName: "",
    driverEmail: "",
    driverPhone: "",
    licenseNumber: "",
    licenseIssueDate: "",
    documentType: "dowod",
    documentNumber: "",
    documentIssuedBy: "",
  });

  useEffect(() => {
    if (contractId) {
      const decodedId = decodeURIComponent(contractId);
      const contractInfo = contractsData[decodedId];
      if (contractInfo) {
        setContract(contractInfo);
      } else {
        toast.error("Nie znaleziono umowy");
        navigate("/");
      }
    }
  }, [contractId, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Tutaj będzie wysyłanie danych do backendu
    const driversCount = 1 + additionalDrivers.length;
    toast.success("Zgłoszenie wysłane pomyślnie!", {
      description: `Dziękujemy za przesłanie danych ${driversCount} ${driversCount === 1 ? 'kierowcy' : 'kierowców'}`,
    });
    setSubmitted(true);
  };

  const addAdditionalDriver = () => {
    if (additionalDrivers.length < 2) {
      setAdditionalDrivers([...additionalDrivers, additionalDrivers.length]);
    }
  };

  const removeAdditionalDriver = (index: number) => {
    setAdditionalDrivers(additionalDrivers.filter((_, i) => i !== index));
  };

  if (!contract) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Ładowanie...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Zgłoszenie wysłane!</h2>
              <p className="text-muted-foreground">
                Dziękujemy za przesłanie danych. Skontaktujemy się wkrótce.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6 animate-fade-in">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">Formularz zgłoszenia kierowcy</h1>
          <p className="text-muted-foreground">Wypełnij formularz, aby zgłosić się jako kierowca</p>
        </div>

        <Card className="shadow-lg border-primary/20">
          <CardHeader className="bg-gradient-subtle">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Informacje o umowie
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Numer umowy:</span>
                <span className="font-medium text-foreground">{decodeURIComponent(contractId || "")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Klient:</span>
                <span className="font-medium text-foreground">{contract.clientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pojazd:</span>
                <span className="font-medium text-foreground">{contract.vehicle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Data rozpoczęcia:</span>
                <span className="font-medium text-foreground">{contract.startDate}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Dane głównego kierowcy (najemca)
            </CardTitle>
            <CardDescription>
              Podaj swoje dane jako główny kierowca tej umowy
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="driverName">Imię i nazwisko *</Label>
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

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="driverEmail">Email *</Label>
                  <Input
                    id="driverEmail"
                    type="email"
                    value={formData.driverEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, driverEmail: e.target.value })
                    }
                    placeholder="email@example.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="driverPhone">Telefon *</Label>
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
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="documentType">Rodzaj dokumentu tożsamości *</Label>
                <Select 
                  value={formData.documentType}
                  onValueChange={(value) => setFormData({ ...formData, documentType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz dokument" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dowod">Dowód osobisty</SelectItem>
                    <SelectItem value="paszport">Paszport</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="documentNumber">Numer dokumentu *</Label>
                  <Input
                    id="documentNumber"
                    value={formData.documentNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, documentNumber: e.target.value })
                    }
                    placeholder="DBZ976078"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="documentIssuedBy">Organ wydający *</Label>
                  <Input
                    id="documentIssuedBy"
                    value={formData.documentIssuedBy}
                    onChange={(e) =>
                      setFormData({ ...formData, documentIssuedBy: e.target.value })
                    }
                    placeholder="Wójt gminy..."
                    required
                  />
                </div>
              </div>

              {/* Dodatkowi kierowcy */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Dodatkowi kierowcy</h3>
                    <p className="text-sm text-muted-foreground">Możesz dodać maksymalnie 2 dodatkowych kierowców</p>
                  </div>
                  {additionalDrivers.length < 2 && (
                    <Button type="button" variant="outline" size="sm" onClick={addAdditionalDriver}>
                      <Plus className="h-4 w-4 mr-2" />
                      Dodaj
                    </Button>
                  )}
                </div>

                {additionalDrivers.map((driverIndex, arrayIndex) => (
                  <Card key={driverIndex} className="border-2 bg-muted/30">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Dodatkowy kierowca #{arrayIndex + 1}</CardTitle>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeAdditionalDriver(arrayIndex)}
                        >
                          Usuń
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor={`add_driver_${driverIndex}_name`}>Imię i nazwisko *</Label>
                        <Input 
                          id={`add_driver_${driverIndex}_name`} 
                          name={`add_driver_${driverIndex}_name`} 
                          placeholder="Monika Fedio" 
                          required 
                        />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor={`add_driver_${driverIndex}_email`}>Email *</Label>
                          <Input 
                            id={`add_driver_${driverIndex}_email`} 
                            name={`add_driver_${driverIndex}_email`} 
                            type="email"
                            placeholder="email@example.com" 
                            required 
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`add_driver_${driverIndex}_phone`}>Telefon *</Label>
                          <Input 
                            id={`add_driver_${driverIndex}_phone`} 
                            name={`add_driver_${driverIndex}_phone`} 
                            placeholder="+48 500 123 456" 
                            required 
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor={`add_driver_${driverIndex}_license`}>Numer prawa jazdy *</Label>
                          <Input 
                            id={`add_driver_${driverIndex}_license`} 
                            name={`add_driver_${driverIndex}_license`} 
                            placeholder="ABC123456" 
                            required 
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`add_driver_${driverIndex}_license_date`}>Data wydania prawa jazdy *</Label>
                          <Input 
                            id={`add_driver_${driverIndex}_license_date`} 
                            name={`add_driver_${driverIndex}_license_date`} 
                            type="date"
                            required 
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`add_driver_${driverIndex}_doc_type`}>Rodzaj dokumentu tożsamości *</Label>
                        <Select name={`add_driver_${driverIndex}_doc_type`} defaultValue="dowod">
                          <SelectTrigger>
                            <SelectValue placeholder="Wybierz dokument" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="dowod">Dowód osobisty</SelectItem>
                            <SelectItem value="paszport">Paszport</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor={`add_driver_${driverIndex}_doc_number`}>Numer dokumentu *</Label>
                          <Input 
                            id={`add_driver_${driverIndex}_doc_number`} 
                            name={`add_driver_${driverIndex}_doc_number`} 
                            placeholder="DEW863370" 
                            required 
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`add_driver_${driverIndex}_doc_issued`}>Organ wydający *</Label>
                          <Input 
                            id={`add_driver_${driverIndex}_doc_issued`} 
                            name={`add_driver_${driverIndex}_doc_issued`} 
                            placeholder="Wójt gminy..." 
                            required 
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Button type="submit" className="w-full gap-2 shadow-md">
                <Send className="h-4 w-4" />
                Wyślij zgłoszenie {additionalDrivers.length > 0 && `(${1 + additionalDrivers.length} ${additionalDrivers.length === 1 ? 'kierowca' : 'kierowców'})`}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-md bg-gradient-subtle border-primary/20">
          <CardContent className="pt-6">
            <div className="space-y-2 text-sm">
              <p className="font-medium text-foreground">Wymagania:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Prawo jazdy kategorii B</li>
                <li>Dokument tożsamości</li>
                <li>Minimum 2 lata doświadczenia w prowadzeniu pojazdów</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DriverSubmission;
