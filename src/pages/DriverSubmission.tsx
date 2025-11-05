import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { UserPlus, Send, CheckCircle2, FileText, Plus, Info } from "lucide-react";
import { toast } from "sonner";
import { useContractByNumber, useUpdateContract, useContract } from "@/hooks/useContracts";
import { useCreateNotification } from "@/hooks/useNotifications";
import { useUpdateClient } from "@/hooks/useClients";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { pl } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

const WARSAW_TZ = "Europe/Warsaw";

const DriverSubmission = () => {
  const { contractId } = useParams<{ contractId: string }>();
  const navigate = useNavigate();
  const decodedId = contractId ? decodeURIComponent(contractId) : undefined;
  
  // Check if contractId is UUID (contains hyphens) or contract number
  const isUUID = decodedId?.includes('-');
  
  // Fetch contract by UUID or by number
  const { data: contractByUUID, isLoading: isLoadingByUUID, isError: isErrorByUUID } = useContract(isUUID ? decodedId : undefined);
  const { data: contractByNumber, isLoading: isLoadingByNumber, isError: isErrorByNumber } = useContractByNumber(!isUUID ? decodedId : undefined);
  
  // Use the appropriate contract data
  const contract = isUUID ? contractByUUID : contractByNumber;
  const isLoading = isUUID ? isLoadingByUUID : isLoadingByNumber;
  const isError = isUUID ? isErrorByUUID : isErrorByNumber;
  const updateContract = useUpdateContract();
  const createNotificationMutation = useCreateNotification();
  const updateClient = useUpdateClient();
  const [submitted, setSubmitted] = useState(false);
  const [additionalDrivers, setAdditionalDrivers] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    invoiceType: "receipt" as "receipt" | "invoice",
    companyName: "",
    nip: "",
    numberOfTravelers: "",
    driverName: "",
    driverEmail: "",
    driverPhone: "",
    driverAddress: "",
    driverPesel: "",
    licenseNumber: "",
    licenseIssueDate: "",
    hasCategoryB: false,
    documentType: "dowod",
    documentNumber: "",
    documentIssuedBy: "",
    trailerLicenseCategory: "" as "" | "B" | "B96" | "B+E",
    trailerF1Mass: "",
    trailerO1Mass: "",
  });

  const [additionalDriversHasCategoryB, setAdditionalDriversHasCategoryB] = useState<Record<number, boolean>>({});

  // Pre-fill form with contract tenant data when contract loads
  useEffect(() => {
    if (contract) {
      const existingCategories = contract.tenant_license_category 
        ? contract.tenant_license_category.split(',').map(c => c.trim()).filter(Boolean)
        : [];
      const hasBCategory = existingCategories.includes('B');
      
      setFormData({
        invoiceType: (contract.invoice_type as "receipt" | "invoice") || "receipt",
        companyName: contract.tenant_company_name || "",
        nip: contract.tenant_nip || "",
        numberOfTravelers: contract.number_of_travelers?.toString() || "",
        driverName: contract.tenant_name || "",
        driverEmail: contract.tenant_email || "",
        driverPhone: contract.tenant_phone || "",
        driverAddress: contract.tenant_address || "",
        driverPesel: contract.tenant_pesel || "",
        licenseNumber: contract.tenant_license_number || "",
        licenseIssueDate: contract.tenant_license_date || "",
        hasCategoryB: hasBCategory,
        documentType: contract.tenant_id_type || "dowod",
        documentNumber: contract.tenant_id_number || "",
        documentIssuedBy: contract.tenant_id_issuer || "",
        trailerLicenseCategory: (contract.tenant_trailer_license_category as "" | "B" | "B96" | "B+E") || "",
        trailerF1Mass: contract.vehicle_f1_mass?.toString() || "",
        trailerO1Mass: contract.vehicle_o1_mass?.toString() || "",
      });
    }
  }, [contract]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contract?.id) return;

    // Validate category B confirmation
    if (!formData.hasCategoryB) {
      toast.error("Błąd walidacji", {
        description: "Musisz potwierdzić posiadanie prawa jazdy kategorii B"
      });
      return;
    }

    // Validate number of travelers
    if (!formData.numberOfTravelers || Number(formData.numberOfTravelers) < 1) {
      toast.error("Błąd walidacji", {
        description: "Musisz podać liczbę podróżujących osób (minimum 1)"
      });
      return;
    }

    // Validate F1 and O1 fields only if contract has trailer
    if (contract.has_trailer) {
      if (!formData.trailerF1Mass || !formData.trailerO1Mass) {
        toast.error("Błąd walidacji", {
          description: "Musisz podać wartości F1 i O1 z dowodu rejestracyjnego"
        });
        return;
      }

      // Validate trailer license category
      if (!formData.trailerLicenseCategory) {
        toast.error("Błąd walidacji", {
          description: "Musisz wybrać kategorię prawa jazdy dla przyczepy"
        });
        return;
      }

      const f1 = Number(formData.trailerF1Mass);
      const trailerMass = Number(contract.trailer_mass);
      const o1 = Number(formData.trailerO1Mass);

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
        prawo_jazdy_kategoria: 'B',
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
        prawo_jazdy_kategoria: 'B',
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
          number_of_travelers: Number(formData.numberOfTravelers),
          tenant_name: formData.driverName,
          tenant_email: formData.driverEmail,
          tenant_phone: formData.driverPhone,
          tenant_address: formData.driverAddress,
          tenant_pesel: formData.driverPesel,
          tenant_license_number: formData.licenseNumber,
          tenant_license_date: formData.licenseIssueDate,
          tenant_license_category: 'B',
          tenant_id_type: formData.documentType,
          tenant_id_number: formData.documentNumber,
          tenant_id_issuer: formData.documentIssuedBy,
          tenant_trailer_license_category: formData.trailerLicenseCategory || null,
          vehicle_f1_mass: formData.trailerF1Mass ? Number(formData.trailerF1Mass) : null,
          vehicle_o1_mass: formData.trailerO1Mass ? Number(formData.trailerO1Mass) : null,
        } as any,
      });

      // Synchronizuj wszystkie dane najemcy z profilem klienta
      if (contract.client_id) {
        const clientUpdates: any = {};
        
        // Podstawowe dane kontaktowe
        if (formData.driverName) clientUpdates.name = formData.driverName;
        if (formData.driverEmail) clientUpdates.email = formData.driverEmail;
        if (formData.driverPhone) clientUpdates.phone = formData.driverPhone;
        if (formData.driverAddress) clientUpdates.address = formData.driverAddress;
        
        // Dokumenty tożsamości
        if (formData.documentType) clientUpdates.id_type = formData.documentType;
        if (formData.documentNumber) clientUpdates.id_number = formData.documentNumber;
        if (formData.documentIssuedBy) clientUpdates.id_issuer = formData.documentIssuedBy;
        if (formData.driverPesel) clientUpdates.pesel = formData.driverPesel;
        if (formData.nip) clientUpdates.nip = formData.nip;
        
        // Prawo jazdy
        if (formData.licenseNumber) clientUpdates.license_number = formData.licenseNumber;
        if (formData.hasCategoryB) {
          clientUpdates.license_category = 'B';
        }
        if (formData.licenseIssueDate) clientUpdates.license_date = formData.licenseIssueDate;
        if (formData.trailerLicenseCategory) clientUpdates.trailer_license_category = formData.trailerLicenseCategory;
        
        // Dane firmowe
        if (formData.companyName) clientUpdates.company_name = formData.companyName;
        
        // Aktualizuj tylko jeśli są jakieś zmiany
        if (Object.keys(clientUpdates).length > 0) {
          await updateClient.mutateAsync({
            id: contract.client_id,
            updates: clientUpdates,
          });
          console.log('Client profile updated with:', clientUpdates);
        }
      }

      // Create notification for new drivers
      const driversCount = allDrivers.length;
      await createNotificationMutation.mutateAsync({
        type: 'driver_new',
        title: 'Nowy formularz dodatkowych kierowców',
        message: `Dodano ${driversCount} ${driversCount === 1 ? 'kierowcę' : 'kierowców'} dla umowy ${contract.contract_number}`,
        link: `/contracts/${contract.id}`,
      });

      // Send webhook notification
      try {
        await supabase.functions.invoke('notify-driver-submission', {
          body: {
            contractId: contract.id,
            contractNumber: contract.contract_number,
          }
        });
      } catch (webhookError) {
        console.error('Error sending webhook:', webhookError);
        // Don't block submission if webhook fails
      }

      toast.success("Zgłoszenie wysłane pomyślnie!", {
        description: `Dziękujemy za przesłanie danych ${driversCount} ${driversCount === 1 ? 'kierowcy' : 'kierowców'}`,
      });
      setSubmitted(true);
    } catch (error: any) {
      console.error('Error submitting driver data:', error);
      const errorMessage = error?.message || 'Nieznany błąd';
      toast.error("Wystąpił błąd podczas zapisywania danych", {
        description: errorMessage
      });
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
                <span className="font-medium text-foreground">
                  {contract.start_date ? format(toZonedTime(new Date(contract.start_date), WARSAW_TZ), "dd.MM.yyyy, HH:mm", { locale: pl }) : 'Nie podano'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Data zakończenia:</span>
                <span className="font-medium text-foreground">
                  {contract.end_date ? format(toZonedTime(new Date(contract.end_date), WARSAW_TZ), "dd.MM.yyyy, HH:mm", { locale: pl }) : 'Nie podano'}
                </span>
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

              {/* Pole przeniesione do sekcji Dane głównego kierowcy */}
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

              <div className="space-y-2">
                <Label htmlFor="numberOfTravelers">Liczba podróżujących osób *</Label>
                <Input
                  id="numberOfTravelers"
                  type="number"
                  min="1"
                  value={formData.numberOfTravelers}
                  onChange={(e) =>
                    setFormData({ ...formData, numberOfTravelers: e.target.value })
                  }
                  placeholder="Ile osób będzie podróżować?"
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
                  <Label>Prawo jazdy - kategoria dla kampera *</Label>
                  <div className="p-4 border rounded-lg bg-muted/30">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="category-b-confirm"
                        checked={formData.hasCategoryB}
                        onCheckedChange={(checked) => {
                          setFormData({
                            ...formData,
                            hasCategoryB: checked === true
                          });
                        }}
                      />
                      <div className="space-y-1">
                        <label
                          htmlFor="category-b-confirm"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer select-none"
                        >
                          Potwierdzam posiadanie prawa jazdy kategorii B
                        </label>
                        <p className="text-xs text-muted-foreground">
                          Do prowadzenia kampera wymagana jest kategoria B
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {contract?.has_trailer && (
                  <TooltipProvider>
                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 min-h-[48px]">
                          <Label htmlFor="trailerF1Mass">F1 - Maksymalna masa całkowita pojazdu (kamper) *</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground cursor-help flex-shrink-0" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p>Wartość z dowodu rejestracyjnego <strong>kempera</strong> w polu F1. Określa maksymalną dopuszczalną masę całkowitą pojazdu wraz z ładunkiem.</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Input
                          id="trailerF1Mass"
                          type="number"
                          value={formData.trailerF1Mass}
                          onChange={(e) =>
                            setFormData({ ...formData, trailerF1Mass: e.target.value })
                          }
                          placeholder="np. 3500"
                          required
                        />
                        <p className="text-xs text-muted-foreground">Wartość w kg z dowodu rejestracyjnego <strong>kempera</strong></p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 min-h-[48px]">
                          <Label htmlFor="trailerO1Mass">O1 - Maksymalna masa przyczepy z hamulcem *</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground cursor-help flex-shrink-0" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p>Wartość z dowodu rejestracyjnego <strong>kempera</strong> w polu O1. Określa maksymalną dopuszczalną masę przyczepy wyposażonej w hamulce, którą może holować dany pojazd.</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Input
                          id="trailerO1Mass"
                          type="number"
                          value={formData.trailerO1Mass}
                          onChange={(e) =>
                            setFormData({ ...formData, trailerO1Mass: e.target.value })
                          }
                          placeholder="np. 750"
                          required
                        />
                        <p className="text-xs text-muted-foreground">Wartość w kg z dowodu rejestracyjnego <strong>kempera</strong></p>
                      </div>
                    </div>
                  </TooltipProvider>
                )}
              </div>

              {contract?.has_trailer && (
                <div className="space-y-4 p-4 border rounded-lg bg-primary/5 border-primary/20">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Informacja o przyczepach</h4>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p className="font-medium">Dla kamperów wystarczające jest prawo jazdy kategorii B.</p>
                        <p>Jeśli wynajem obejmuje przyczepę, musisz podać dane z dowodu rejestracyjnego kempera:</p>
                        <ul className="list-disc list-inside ml-2 space-y-0.5">
                          <li><strong>F1</strong> - maksymalna masa całkowita pojazdu (kamper)</li>
                          <li><strong>O1</strong> - maksymalna masa przyczepy z hamulcem</li>
                        </ul>
                        <p className="pt-1 font-medium">Wymagana kategoria prawa jazdy dla przyczepy:</p>
                        <ul className="list-disc list-inside ml-2 space-y-0.5">
                          <li><strong>B</strong> - przyczepy do 750 kg (bez dodatkowego szkolenia)</li>
                          <li><strong>B96</strong> - gdy F1 + masa przyczepy ≤ 4250 kg</li>
                          <li><strong>B+E</strong> - gdy F1 + masa przyczepy ≤ 3500 kg</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 pt-2">
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
                        <SelectItem value="B">Kat. B (przyczepy do 750 kg)</SelectItem>
                        <SelectItem value="B96">Kat. B96 (F1 + masa przyczepy ≤ 4250 kg)</SelectItem>
                        <SelectItem value="B+E">Kat. B+E (F1 + masa przyczepy ≤ 3500 kg)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      System automatycznie sprawdzi czy wybrana kategoria jest odpowiednia dla masy przyczepy
                    </p>
                  </div>

                  {formData.trailerLicenseCategory && (
                    <div className="p-4 bg-background rounded-lg border-2 border-primary/20 text-xs space-y-3">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-sm mb-1">Weryfikacja wybranej kategorii: {formData.trailerLicenseCategory}</p>
                          <p className="text-muted-foreground mb-2">System automatycznie sprawdzi czy kategoria jest odpowiednia</p>
                        </div>
                      </div>
                      
                      <div className="bg-muted/50 p-3 rounded space-y-2">
                        <p className="font-semibold">Wymagania dla kategorii {formData.trailerLicenseCategory}:</p>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                          {(formData.trailerLicenseCategory === 'B' || formData.trailerLicenseCategory === 'B+E') && (
                            <>
                              <li>F1 + masa przyczepy nie może przekraczać 3500 kg</li>
                              <li>Masa przyczepy nie może przekraczać wartości O1 z dowodu rejestracyjnego kempera</li>
                            </>
                          )}
                          {formData.trailerLicenseCategory === 'B96' && (
                            <>
                              <li>F1 + masa przyczepy nie może przekraczać 4250 kg</li>
                              <li>Masa przyczepy nie może przekraczać wartości O1 z dowodu rejestracyjnego kempera</li>
                            </>
                          )}
                        </ul>
                      </div>
                      
                      {formData.trailerF1Mass && contract?.trailer_mass && formData.trailerO1Mass && (
                        <div className="bg-primary/5 p-3 rounded space-y-1.5">
                          <p className="font-semibold">Wprowadzone dane:</p>
                          <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                            <div>
                              <p className="text-xs opacity-75">F1 (masa kempera):</p>
                              <p className="font-semibold text-foreground">{formData.trailerF1Mass} kg</p>
                            </div>
                            <div>
                              <p className="text-xs opacity-75">Masa przyczepy:</p>
                              <p className="font-semibold text-foreground">{contract.trailer_mass} kg</p>
                            </div>
                            <div>
                              <p className="text-xs opacity-75">O1 (maks. dla przyczepy):</p>
                              <p className="font-semibold text-foreground">{formData.trailerO1Mass} kg</p>
                            </div>
                            <div>
                              <p className="text-xs opacity-75">Suma F1 + przyczepa:</p>
                              <p className="font-semibold text-primary">{Number(formData.trailerF1Mass) + Number(contract.trailer_mass)} kg</p>
                            </div>
                          </div>
                          
                          {(() => {
                            const totalMass = Number(formData.trailerF1Mass) + Number(contract.trailer_mass);
                            const trailerMass = Number(contract.trailer_mass);
                            const o1 = Number(formData.trailerO1Mass);
                            const limit = formData.trailerLicenseCategory === 'B96' ? 4250 : 3500;
                            
                            const isWithinLimit = totalMass <= limit;
                            const isTrailerValid = trailerMass <= o1;
                            
                            if (isWithinLimit && isTrailerValid) {
                              return (
                                <div className="mt-2 p-2 bg-green-500/10 border border-green-500/20 rounded flex items-center gap-2">
                                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                                  <p className="text-green-700 dark:text-green-400 font-medium">
                                    ✓ Dane są poprawne dla kategorii {formData.trailerLicenseCategory}
                                  </p>
                                </div>
                              );
                            } else {
                              return (
                                <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded">
                                  <p className="text-destructive font-medium text-xs">
                                    ⚠ Uwaga: {!isWithinLimit && `Suma przekracza limit ${limit} kg dla kategorii ${formData.trailerLicenseCategory}`}
                                    {!isWithinLimit && !isTrailerValid && ' oraz '}
                                    {!isTrailerValid && `Masa przyczepy przekracza O1 (${o1} kg)`}
                                  </p>
                                </div>
                              );
                            }
                          })()}
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
                          <Label>Prawo jazdy - kategoria dla kampera *</Label>
                          <div className="p-4 border rounded-lg bg-muted/30">
                            <div className="flex items-start gap-3">
                              <Checkbox
                                id={`add-driver-${driverIndex}-category-b`}
                                checked={additionalDriversHasCategoryB[driverIndex] || false}
                                onCheckedChange={(checked) => {
                                  setAdditionalDriversHasCategoryB({
                                    ...additionalDriversHasCategoryB,
                                    [driverIndex]: checked === true
                                  });
                                }}
                              />
                              <div className="space-y-1">
                                <label
                                  htmlFor={`add-driver-${driverIndex}-category-b`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer select-none"
                                >
                                  Potwierdzam posiadanie prawa jazdy kategorii B
                                </label>
                                <p className="text-xs text-muted-foreground">
                                  Do prowadzenia kampera wymagana jest kategoria B
                                </p>
                              </div>
                            </div>
                          </div>
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

              <Button 
                type="submit" 
                className="w-full gap-2 shadow-md"
                disabled={updateContract.isPending || createNotificationMutation.isPending}
              >
                <Send className="h-4 w-4" />
                {(updateContract.isPending || createNotificationMutation.isPending) 
                  ? 'Wysyłanie...' 
                  : `Wyślij zgłoszenie ${additionalDrivers.length > 0 ? `(${1 + additionalDrivers.length} ${additionalDrivers.length === 1 ? 'kierowca' : 'kierowców'})` : ''}`
                }
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
