import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { UserPlus, Send, CheckCircle2, FileText, Plus } from "lucide-react";
import { toast } from "sonner";
import { useContractByNumber, useUpdateContract } from "@/hooks/useContracts";
import { useCreateNotification } from "@/hooks/useNotifications";

const DriverSubmission = () => {
  const { contractId } = useParams<{ contractId: string }>();
  const navigate = useNavigate();
  const decodedId = contractId ? decodeURIComponent(contractId) : undefined;
  const { data: contract, isLoading, isError } = useContractByNumber(decodedId);
  const updateContract = useUpdateContract();
  const createNotificationMutation = useCreateNotification();
  const [submitted, setSubmitted] = useState(false);
  const [additionalDrivers, setAdditionalDrivers] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    invoiceType: "receipt" as "receipt" | "invoice",
    companyName: "",
    nip: "",
    driverName: "",
    driverEmail: "",
    driverPhone: "",
    driverAddress: "",
    driverPesel: "",
    licenseNumber: "",
    licenseIssueDate: "",
    licenseCategory: [] as string[],
    documentType: "dowod",
    documentNumber: "",
    documentIssuedBy: "",
    trailerLicenseCategory: "" as "" | "B" | "B96" | "B+E",
  });

  const [additionalDriversLicenseCategories, setAdditionalDriversLicenseCategories] = useState<Record<number, string[]>>({});

  // Pre-fill form with contract tenant data when contract loads
  useEffect(() => {
    if (contract) {
      const existingCategories = contract.tenant_license_category 
        ? contract.tenant_license_category.split(',').map(c => c.trim()).filter(Boolean)
        : [];
      
      setFormData({
        invoiceType: (contract.invoice_type as "receipt" | "invoice") || "receipt",
        companyName: contract.tenant_company_name || "",
        nip: contract.tenant_nip || "",
        driverName: contract.tenant_name || "",
        driverEmail: contract.tenant_email || "",
        driverPhone: contract.tenant_phone || "",
        driverAddress: contract.tenant_address || "",
        driverPesel: contract.tenant_pesel || "",
        licenseNumber: contract.tenant_license_number || "",
        licenseIssueDate: contract.tenant_license_date || "",
        licenseCategory: existingCategories,
        documentType: contract.tenant_id_type || "dowod",
        documentNumber: contract.tenant_id_number || "",
        documentIssuedBy: contract.tenant_id_issuer || "",
        trailerLicenseCategory: (contract.tenant_trailer_license_category as "" | "B" | "B96" | "B+E") || "",
      });
    }
  }, [contract]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contract?.id) return;

    // Validate trailer license if contract has trailer
    if (contract.has_trailer) {
      if (!formData.trailerLicenseCategory) {
        toast.error("Błąd walidacji", {
          description: "Musisz wybrać kategorię prawa jazdy dla przyczepy"
        });
        return;
      }

      const f1 = Number(contract.vehicle_f1_mass);
      const trailerMass = Number(contract.trailer_mass);
      const o1 = Number(contract.vehicle_o1_mass);

      // Check if trailer mass exceeds O1
      if (trailerMass > o1) {
        toast.error("Błąd walidacji", {
          description: `Masa przyczepy (${trailerMass} kg) przekracza maksymalną wartość O1 (${o1} kg)`
        });
        return;
      }

      // Check category-specific limits
      const totalMass = f1 + trailerMass;
      
      if (formData.trailerLicenseCategory === 'B' || formData.trailerLicenseCategory === 'B+E') {
        if (totalMass > 3500) {
          toast.error("Błąd walidacji", {
            description: `Dla kategorii ${formData.trailerLicenseCategory}: F1 + masa przyczepy (${totalMass} kg) przekracza limit 3500 kg`
          });
          return;
        }
      } else if (formData.trailerLicenseCategory === 'B96') {
        if (totalMass > 4250) {
          toast.error("Błąd walidacji", {
            description: `Dla kategorii B96: F1 + masa przyczepy (${totalMass} kg) przekracza limit 4250 kg`
          });
          return;
        }
      }
    }

    try {
      const form = e.target as HTMLFormElement;
      
      // Przygotuj dane głównego kierowcy (najemcy)
      const mainDriver = {
        imie_nazwisko: formData.driverName,
        email: formData.driverEmail,
        tel: formData.driverPhone,
        pesel: formData.driverPesel,
        prawo_jazdy_numer: formData.licenseNumber,
        prawo_jazdy_data: formData.licenseIssueDate,
        prawo_jazdy_kategoria: formData.licenseCategory.join(', '),
        dokument_rodzaj: formData.documentType,
        dokument_numer: formData.documentNumber,
        dokument_organ: formData.documentIssuedBy,
        typ: 'najemca', // Oznacz jako główny kierowca
      };

      // Przygotuj dane dodatkowych kierowców z formularza
      const additionalDriversData = additionalDrivers.map((driverIndex) => ({
        imie_nazwisko: form[`add_driver_${driverIndex}_name`].value,
        email: form[`add_driver_${driverIndex}_email`].value,
        tel: form[`add_driver_${driverIndex}_phone`].value,
        prawo_jazdy_numer: form[`add_driver_${driverIndex}_license`].value,
        prawo_jazdy_data: form[`add_driver_${driverIndex}_license_date`].value,
        prawo_jazdy_kategoria: (additionalDriversLicenseCategories[driverIndex] || []).join(', '),
        dokument_rodzaj: form[`add_driver_${driverIndex}_doc_type`].value,
        dokument_numer: form[`add_driver_${driverIndex}_doc_number`].value,
        dokument_organ: form[`add_driver_${driverIndex}_doc_issued`].value,
        typ: 'dodatkowy',
      }));

      // Połącz wszystkich kierowców w jedną tablicę
      const allDrivers = [mainDriver, ...additionalDriversData];

      // Zaktualizuj umowę z danymi wszystkich kierowców
      await updateContract.mutateAsync({
        id: contract.id,
        updates: {
          additional_drivers: allDrivers,
          invoice_type: formData.invoiceType,
          tenant_company_name: formData.companyName,
          tenant_nip: formData.nip,
          tenant_name: formData.driverName,
          tenant_email: formData.driverEmail,
          tenant_phone: formData.driverPhone,
          tenant_address: formData.driverAddress,
          tenant_pesel: formData.driverPesel,
          tenant_license_number: formData.licenseNumber,
          tenant_license_date: formData.licenseIssueDate,
          tenant_license_category: formData.licenseCategory.join(', '),
          tenant_id_type: formData.documentType,
          tenant_id_number: formData.documentNumber,
          tenant_id_issuer: formData.documentIssuedBy,
          tenant_trailer_license_category: formData.trailerLicenseCategory || null,
        } as any,
      });

      // Create notification for new drivers
      const driversCount = allDrivers.length;
      await createNotificationMutation.mutateAsync({
        type: 'driver_new',
        title: 'Nowy formularz dodatkowych kierowców',
        message: `Dodano ${driversCount} ${driversCount === 1 ? 'kierowcę' : 'kierowców'} dla umowy ${contract.contract_number}`,
        link: `/contracts/${contract.id}`,
      });

      toast.success("Zgłoszenie wysłane pomyślnie!", {
        description: `Dziękujemy za przesłanie danych ${driversCount} ${driversCount === 1 ? 'kierowcy' : 'kierowców'}`,
      });
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting driver data:', error);
      toast.error("Wystąpił błąd podczas zapisywania danych");
    }
  };

  const addAdditionalDriver = () => {
    if (additionalDrivers.length < 2) {
      setAdditionalDrivers([...additionalDrivers, additionalDrivers.length]);
    }
  };

  const removeAdditionalDriver = (index: number) => {
    setAdditionalDrivers(additionalDrivers.filter((_, i) => i !== index));
  };

  if (isLoading) {
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

  if (isError || !contract) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-destructive">Nie znaleziono umowy o numerze: {decodedId}</p>
            <Button onClick={() => navigate("/")} className="w-full mt-4">
              Powrót do strony głównej
            </Button>
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
                <span className="font-medium text-foreground">{contract.contract_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Klient:</span>
                <span className="font-medium text-foreground">{contract.tenant_name || 'Nie podano'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pojazd:</span>
                <span className="font-medium text-foreground">{contract.vehicle_model} ({contract.registration_number})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Data rozpoczęcia:</span>
                <span className="font-medium text-foreground">{contract.start_date}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Typ dokumentu rozliczeniowego
            </CardTitle>
            <CardDescription>
              Wybierz czy potrzebujesz faktury czy paragonu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="invoiceType">Typ dokumentu *</Label>
                <Select
                  value={formData.invoiceType}
                  onValueChange={(value: "receipt" | "invoice") =>
                    setFormData({ ...formData, invoiceType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz typ dokumentu" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receipt">Paragon</SelectItem>
                    <SelectItem value="invoice">Faktura</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.invoiceType === 'invoice' && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-semibold text-sm">Dane do faktury</h4>
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Nazwa firmy *</Label>
                    <Input
                      id="companyName"
                      value={formData.companyName}
                      onChange={(e) =>
                        setFormData({ ...formData, companyName: e.target.value })
                      }
                      placeholder="Nazwa firmy"
                      required={formData.invoiceType === 'invoice'}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nip">NIP *</Label>
                    <Input
                      id="nip"
                      value={formData.nip}
                      onChange={(e) =>
                        setFormData({ ...formData, nip: e.target.value })
                      }
                      placeholder="0000000000"
                      required={formData.invoiceType === 'invoice'}
                      maxLength={10}
                    />
                  </div>
                </div>
              )}
            </form>
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

              <div className="space-y-2">
                <Label htmlFor="driverAddress">Adres zamieszkania *</Label>
                <Input
                  id="driverAddress"
                  value={formData.driverAddress}
                  onChange={(e) =>
                    setFormData({ ...formData, driverAddress: e.target.value })
                  }
                  placeholder="ul. Przykładowa 1, 00-000 Warszawa"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="driverPesel">PESEL</Label>
                <Input
                  id="driverPesel"
                  value={formData.driverPesel}
                  onChange={(e) =>
                    setFormData({ ...formData, driverPesel: e.target.value })
                  }
                  placeholder="00000000000"
                  maxLength={11}
                />
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

                <div className="space-y-3">
                  <Label>Kategoria prawa jazdy *</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 border rounded-lg bg-muted/30">
                    {['AM', 'A1', 'A2', 'A', 'B', 'B+E', 'C1', 'C', 'C+E', 'D1', 'D', 'D+E', 'T'].map((category) => (
                      <div key={category} className="flex items-center space-x-2">
                        <Checkbox
                          id={`category-${category}`}
                          checked={formData.licenseCategory.includes(category)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData({
                                ...formData,
                                licenseCategory: [...formData.licenseCategory, category]
                              });
                            } else {
                              setFormData({
                                ...formData,
                                licenseCategory: formData.licenseCategory.filter(c => c !== category)
                              });
                            }
                          }}
                        />
                        <label
                          htmlFor={`category-${category}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {category}
                        </label>
                      </div>
                    ))}
                  </div>
                  {formData.licenseCategory.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Wybrano: {formData.licenseCategory.join(', ')}
                    </p>
                  )}
                </div>
              </div>

              {contract?.has_trailer && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-semibold text-sm">Dane dla przyczepy</h4>
                  <p className="text-xs text-muted-foreground">
                    Ta umowa obejmuje przyczepę. Wymagane są dodatkowe informacje o prawie jazdy.
                  </p>
                  
                   <div className="space-y-2">
                    <Label htmlFor="trailerLicenseCategory">Kategoria prawa jazdy dla przyczepy *</Label>
                    <Select
                      value={formData.trailerLicenseCategory}
                      onValueChange={(value: "" | "B" | "B96" | "B+E") =>
                        setFormData({ ...formData, trailerLicenseCategory: value })
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Wybierz kategorię" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="B">Kat. B</SelectItem>
                        <SelectItem value="B96">Kat. B96</SelectItem>
                        <SelectItem value="B+E">Kat. B+E</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Wybierz odpowiednią kategorię zgodnie z wymaganiami poniżej
                    </p>
                  </div>

                  {formData.trailerLicenseCategory && (
                    <div className="p-3 bg-background rounded border text-xs space-y-2">
                      <p className="font-semibold">Wymagania dla kategorii {formData.trailerLicenseCategory}:</p>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        {(formData.trailerLicenseCategory === 'B' || formData.trailerLicenseCategory === 'B+E') && (
                          <>
                            <li>F1 + masa przyczepy nie może być wyższa niż 3500 kg</li>
                            <li>Masa wynajmowanej przyczepy nie może być wyższa niż wartość O1 z dowodu rejestracyjnego holownika</li>
                          </>
                        )}
                        {formData.trailerLicenseCategory === 'B96' && (
                          <>
                            <li>F1 + masa przyczepy nie może być wyższa niż 4250 kg</li>
                            <li>Masa wynajmowanej przyczepy nie może być wyższa niż wartość O1 z dowodu rejestracyjnego holownika</li>
                          </>
                        )}
                      </ul>
                      {contract?.vehicle_f1_mass && contract?.trailer_mass && contract?.vehicle_o1_mass && (
                        <div className="mt-2 pt-2 border-t space-y-1">
                          <p className="font-semibold">Dane z umowy:</p>
                          <p>F1 (masa pojazdu): {contract.vehicle_f1_mass} kg</p>
                          <p>Masa przyczepy: {contract.trailer_mass} kg</p>
                          <p>O1 (maks. masa przyczepy z hamulcem): {contract.vehicle_o1_mass} kg</p>
                          <p className="font-semibold mt-1">Suma: {Number(contract.vehicle_f1_mass) + Number(contract.trailer_mass)} kg</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

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

                        <div className="space-y-3 sm:col-span-2">
                          <Label>Kategoria prawa jazdy *</Label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 border rounded-lg bg-background">
                            {['AM', 'A1', 'A2', 'A', 'B', 'B+E', 'C1', 'C', 'C+E', 'D1', 'D', 'D+E', 'T'].map((category) => (
                              <div key={category} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`add-driver-${driverIndex}-category-${category}`}
                                  checked={(additionalDriversLicenseCategories[driverIndex] || []).includes(category)}
                                  onCheckedChange={(checked) => {
                                    const currentCategories = additionalDriversLicenseCategories[driverIndex] || [];
                                    if (checked) {
                                      setAdditionalDriversLicenseCategories({
                                        ...additionalDriversLicenseCategories,
                                        [driverIndex]: [...currentCategories, category]
                                      });
                                    } else {
                                      setAdditionalDriversLicenseCategories({
                                        ...additionalDriversLicenseCategories,
                                        [driverIndex]: currentCategories.filter(c => c !== category)
                                      });
                                    }
                                  }}
                                />
                                <label
                                  htmlFor={`add-driver-${driverIndex}-category-${category}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                >
                                  {category}
                                </label>
                              </div>
                            ))}
                          </div>
                          {(additionalDriversLicenseCategories[driverIndex] || []).length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              Wybrano: {(additionalDriversLicenseCategories[driverIndex] || []).join(', ')}
                            </p>
                          )}
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
                <li>Prawo jazdy kategorii B{contract?.has_trailer ? ' (lub B96/B+E dla przyczepy)' : ''}</li>
                <li>Dokument tożsamości</li>
                <li>Minimum 2 lata doświadczenia w prowadzeniu pojazdów</li>
              </ul>
              {contract?.has_trailer && (
                <div className="mt-3 pt-3 border-t">
                  <p className="font-medium text-foreground">Dodatkowe wymagania dla przyczepy:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 mt-2">
                    <li><strong>Kat. B:</strong> F1 + masa przyczepy ≤ 3500 kg, masa przyczepy ≤ O1</li>
                    <li><strong>Kat. B96:</strong> F1 + masa przyczepy ≤ 4250 kg, masa przyczepy ≤ O1</li>
                    <li><strong>Kat. B+E:</strong> F1 + masa przyczepy ≤ 3500 kg, masa przyczepy ≤ O1</li>
                  </ul>
                  <p className="text-xs mt-2 text-muted-foreground italic">
                    F1 = maksymalna masa całkowita pojazdu | O1 = maksymalna masa przyczepy z hamulcem
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DriverSubmission;
