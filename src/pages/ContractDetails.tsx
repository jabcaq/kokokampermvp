import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, FileText, User, Car, CreditCard, AlertCircle, Edit2, Save, X, Link2, ClipboardCopy } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

// Mock data - w przyszłości z bazy danych
const contractsData: Record<string, any> = {
  "1": {
    umowa_numer: "UM/2024/001",
    status: "active",
    nazwa_firmy: "KOKO KAMPER",
    email: "kontakt@kokokamper.pl",
    telefony: ["+48 607 108 993", "+48 660 694 257"],
    wynajmujacy: {
      nazwa: "Koko Group Sp. z o.o.",
      adres: "ul. Lazurowa 85a/53, 01-479 Warszawa",
      tel: "+48 660 694 257",
      www: "www.kokokamper.pl",
      email: "kontakt@kokokamper.pl"
    },
    okres_najmu: {
      od: "2024-03-15 10:00",
      do: "2024-03-22 14:00",
      miejsce: "oddział Warszawa",
      zwrot_do: ""
    },
    najemca: {
      imie_nazwisko: "Jan Kowalski",
      email: "jan.kowalski@gmail.com",
      tel: "508140790",
      adres_zamieszkania: "ul. Testowa 123, 00-001 Warszawa",
      dokument_towzaszosc: {
        rodzaj: "Dowód osobisty",
        numer: "ABC123456",
        organ_wydający: "Prezydent Miasta Warszawa"
      },
      pesel: "90010112345",
      prawo_jazdy_numer: "00856/04/2808",
      prawo_jazdy_data: "2015-05-10"
    },
    przedmiot_najmu: {
      model: "RANDGER R600",
      vin: "ZFA25000002S85417",
      nr_rej: "WZ726ES",
      nastepne_badanie: "2025-03-01",
      polisa: {
        numer: "1068435310/9933",
        wazna_do: "2025-01-31"
      },
      dodatkowe_informacje: "pełne wyposażenie, brak zwierząt, bez sprzątania"
    },
    osoby_upowaznione: [
      {
        imie_nazwisko: "Anna Kowalska",
        email: "anna.kowalska@gmail.com",
        tel: "+48 500 123 456",
        dokument_towzaszosc: {
          rodzaj: "Dowód osobisty",
          numer: "DEW863370",
          organ_wydający: "Wójt gminy Stare Babice"
        },
        prawo_jazdy: "04743/06/1432"
      }
    ],
    oplaty: {
      rezerwacyjna: {
        data: "2024-03-01",
        wysokosc: "5000.00 zł",
        rachunek: "mBank: 34 1140 2004 0000 3802 8192 4912"
      },
      zasadnicza: {
        data: "n/d",
        wysokosc: "n/d",
        rachunek: "mBank: 34 1140 2004 0000 3802 8192 4912"
      },
      kaucja: {
        data: "2024-03-15",
        wysokosc: "5000.00 zł",
        rachunek: "mBank: 08 1140 2004 0000 3602 8330 2199"
      }
    },
    uwagi: "Opłaty należy dokonywać na rachunek bankowy wskazany w fakturze PRO-FORMA lub innym dokumencie księgowym wystawionym przez Wynajmującego."
  },
  "2": {
    umowa_numer: "UM/2024/002",
    status: "active",
    nazwa_firmy: "KOKO KAMPER",
    email: "kontakt@kokokamper.pl",
    telefony: ["+48 607 108 993"],
    wynajmujacy: {
      nazwa: "Koko Group Sp. z o.o.",
      adres: "ul. Lazurowa 85a/53, 01-479 Warszawa",
      tel: "+48 660 694 257",
      www: "www.kokokamper.pl",
      email: "kontakt@kokokamper.pl"
    },
    okres_najmu: {
      od: "2024-03-14 10:00",
      do: "2024-03-21 14:00",
      miejsce: "oddział Warszawa"
    },
    najemca: {
      imie_nazwisko: "Anna Nowak",
      email: "anna.nowak@gmail.com",
      tel: "600123456",
      adres_zamieszkania: "ul. Kwiatowa 45, 00-002 Warszawa",
      dokument_towzaszosc: {
        rodzaj: "Dowód osobisty",
        numer: "ABC987654"
      },
      prawo_jazdy_numer: "12345/08/2020"
    },
    przedmiot_najmu: {
      model: "Przyczepa Camp-200",
      nr_rej: "WZ123AB"
    },
    osoby_upowaznione: [],
    oplaty: {
      rezerwacyjna: {
        wysokosc: "2800.00 zł"
      }
    }
  }
};

const statusConfig = {
  active: { label: "Aktywna", className: "bg-primary/10 text-primary border-primary/20" },
  pending: { label: "Oczekująca", className: "bg-secondary/10 text-secondary border-secondary/20" },
  completed: { label: "Zakończona", className: "bg-muted text-muted-foreground border-muted" },
};

const ContractDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContract, setEditedContract] = useState<any>(null);
  
  const contract = id ? contractsData[id] : null;

  const handleEdit = () => {
    setEditedContract(JSON.parse(JSON.stringify(contract)));
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedContract(null);
  };

  const handleSave = () => {
    // Tutaj będzie zapisywanie do backendu
    toast({
      title: "Umowa zaktualizowana",
      description: "Zmiany zostały pomyślnie zapisane.",
    });
    setIsEditing(false);
    setEditedContract(null);
  };

  const updateField = (path: string, value: any) => {
    const keys = path.split('.');
    const newContract = { ...editedContract };
    let current: any = newContract;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    setEditedContract(newContract);
  };

  const displayContract = isEditing ? editedContract : contract;

  if (!contract) {
    return (
      <div className="space-y-8 animate-fade-in">
        <Button variant="outline" onClick={() => navigate("/contracts")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Powrót do listy umów
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Nie znaleziono umowy</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Button variant="outline" onClick={() => navigate("/contracts")} className="gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Powrót do listy umów
          </Button>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-4xl font-bold text-foreground">Umowa {displayContract.umowa_numer}</h1>
            <Badge variant="outline" className={statusConfig[displayContract.status as keyof typeof statusConfig].className}>
              {statusConfig[displayContract.status as keyof typeof statusConfig].label}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-2">Szczegóły umowy najmu</p>
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <Button onClick={handleEdit} className="gap-2">
              <Edit2 className="h-4 w-4" />
              Edytuj umowę
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleCancel} className="gap-2">
                <X className="h-4 w-4" />
                Anuluj
              </Button>
              <Button onClick={handleSave} className="gap-2">
                <Save className="h-4 w-4" />
                Zapisz zmiany
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Informacje podstawowe */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Informacje podstawowe
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nazwa firmy</Label>
              {isEditing ? (
                <Input 
                  value={displayContract.nazwa_firmy} 
                  onChange={(e) => updateField('nazwa_firmy', e.target.value)}
                />
              ) : (
                <p className="font-medium text-foreground">{displayContract.nazwa_firmy}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              {isEditing ? (
                <Input 
                  type="email"
                  value={displayContract.email} 
                  onChange={(e) => updateField('email', e.target.value)}
                />
              ) : (
                <p className="font-medium text-foreground">{displayContract.email}</p>
              )}
            </div>
            {displayContract.telefony && displayContract.telefony.map((tel: string, idx: number) => (
              <div key={idx} className="space-y-2">
                <Label>Telefon {idx + 1}</Label>
                {isEditing ? (
                  <Input 
                    value={tel} 
                    onChange={(e) => {
                      const newTelefony = [...displayContract.telefony];
                      newTelefony[idx] = e.target.value;
                      updateField('telefony', newTelefony);
                    }}
                  />
                ) : (
                  <p className="font-medium text-foreground">{tel}</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Wynajmujący */}
      {contract.wynajmujacy && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Wynajmujący</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nazwa</Label>
                {isEditing ? (
                  <Input 
                    value={displayContract.wynajmujacy.nazwa} 
                    onChange={(e) => updateField('wynajmujacy.nazwa', e.target.value)}
                  />
                ) : (
                  <p className="font-medium text-foreground">{displayContract.wynajmujacy.nazwa}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Adres</Label>
                {isEditing ? (
                  <Input 
                    value={displayContract.wynajmujacy.adres} 
                    onChange={(e) => updateField('wynajmujacy.adres', e.target.value)}
                  />
                ) : (
                  <p className="font-medium text-foreground">{displayContract.wynajmujacy.adres}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Telefon</Label>
                {isEditing ? (
                  <Input 
                    value={displayContract.wynajmujacy.tel} 
                    onChange={(e) => updateField('wynajmujacy.tel', e.target.value)}
                  />
                ) : (
                  <p className="font-medium text-foreground">{displayContract.wynajmujacy.tel}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>WWW</Label>
                {isEditing ? (
                  <Input 
                    value={displayContract.wynajmujacy.www} 
                    onChange={(e) => updateField('wynajmujacy.www', e.target.value)}
                  />
                ) : (
                  <p className="font-medium text-foreground">{displayContract.wynajmujacy.www}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                {isEditing ? (
                  <Input 
                    type="email"
                    value={displayContract.wynajmujacy.email} 
                    onChange={(e) => updateField('wynajmujacy.email', e.target.value)}
                  />
                ) : (
                  <p className="font-medium text-foreground">{displayContract.wynajmujacy.email}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Okres najmu */}
      {contract.okres_najmu && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Okres najmu
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data rozpoczęcia</Label>
                {isEditing ? (
                  <Input 
                    type="datetime-local"
                    value={displayContract.okres_najmu.od?.replace(' ', 'T')} 
                    onChange={(e) => updateField('okres_najmu.od', e.target.value.replace('T', ' '))}
                  />
                ) : (
                  <p className="font-medium text-foreground">{displayContract.okres_najmu.od}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Data zakończenia</Label>
                {isEditing ? (
                  <Input 
                    type="datetime-local"
                    value={displayContract.okres_najmu.do?.replace(' ', 'T')} 
                    onChange={(e) => updateField('okres_najmu.do', e.target.value.replace('T', ' '))}
                  />
                ) : (
                  <p className="font-medium text-foreground">{displayContract.okres_najmu.do}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Miejsce</Label>
                {isEditing ? (
                  <Input 
                    value={displayContract.okres_najmu.miejsce} 
                    onChange={(e) => updateField('okres_najmu.miejsce', e.target.value)}
                  />
                ) : (
                  <p className="font-medium text-foreground">{displayContract.okres_najmu.miejsce}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Zwrot do</Label>
                {isEditing ? (
                  <Input 
                    value={displayContract.okres_najmu.zwrot_do || ''} 
                    onChange={(e) => updateField('okres_najmu.zwrot_do', e.target.value)}
                  />
                ) : displayContract.okres_najmu.zwrot_do ? (
                  <p className="font-medium text-foreground">{displayContract.okres_najmu.zwrot_do}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">Nie podano</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Najemca (Główny kierowca) */}
      {displayContract.najemca && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Najemca (Główny kierowca)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Imię i nazwisko</Label>
                {isEditing ? (
                  <Input 
                    value={displayContract.najemca.imie_nazwisko} 
                    onChange={(e) => updateField('najemca.imie_nazwisko', e.target.value)}
                  />
                ) : (
                  <p className="font-medium text-foreground">{displayContract.najemca.imie_nazwisko}</p>
                )}
              </div>
              {(displayContract.najemca.email || isEditing) && (
                <div className="space-y-2">
                  <Label>Email</Label>
                  {isEditing ? (
                    <Input 
                      type="email"
                      value={displayContract.najemca.email || ''} 
                      onChange={(e) => updateField('najemca.email', e.target.value)}
                    />
                  ) : (
                    <p className="font-medium text-foreground">{displayContract.najemca.email}</p>
                  )}
                </div>
              )}
              {(displayContract.najemca.tel || isEditing) && (
                <div className="space-y-2">
                  <Label>Telefon</Label>
                  {isEditing ? (
                    <Input 
                      value={displayContract.najemca.tel || ''} 
                      onChange={(e) => updateField('najemca.tel', e.target.value)}
                    />
                  ) : (
                    <p className="font-medium text-foreground">{displayContract.najemca.tel}</p>
                  )}
                </div>
              )}
              {(displayContract.najemca.adres_zamieszkania || isEditing) && (
                <div className="md:col-span-2 space-y-2">
                  <Label>Adres zamieszkania</Label>
                  {isEditing ? (
                    <Input 
                      value={displayContract.najemca.adres_zamieszkania || ''} 
                      onChange={(e) => updateField('najemca.adres_zamieszkania', e.target.value)}
                    />
                  ) : (
                    <p className="font-medium text-foreground">{displayContract.najemca.adres_zamieszkania}</p>
                  )}
                </div>
              )}
            </div>
            
            {displayContract.najemca.dokument_towzaszosc && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold text-foreground mb-3">Dokument tożsamości</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Rodzaj</Label>
                      {isEditing ? (
                        <Input 
                          value={displayContract.najemca.dokument_towzaszosc.rodzaj || ''} 
                          onChange={(e) => updateField('najemca.dokument_towzaszosc.rodzaj', e.target.value)}
                        />
                      ) : (
                        <p className="font-medium text-foreground">{displayContract.najemca.dokument_towzaszosc.rodzaj}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Numer</Label>
                      {isEditing ? (
                        <Input 
                          value={displayContract.najemca.dokument_towzaszosc.numer || ''} 
                          onChange={(e) => updateField('najemca.dokument_towzaszosc.numer', e.target.value)}
                        />
                      ) : (
                        <p className="font-medium text-foreground">{displayContract.najemca.dokument_towzaszosc.numer}</p>
                      )}
                    </div>
                    {(displayContract.najemca.dokument_towzaszosc.organ_wydający || isEditing) && (
                      <div className="space-y-2">
                        <Label>Organ wydający</Label>
                        {isEditing ? (
                          <Input 
                            value={displayContract.najemca.dokument_towzaszosc.organ_wydający || ''} 
                            onChange={(e) => updateField('najemca.dokument_towzaszosc.organ_wydający', e.target.value)}
                          />
                        ) : (
                          <p className="font-medium text-foreground">{displayContract.najemca.dokument_towzaszosc.organ_wydający}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
            
            {(displayContract.najemca.prawo_jazdy_numer || displayContract.najemca.prawo_jazdy_data || isEditing) && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold text-foreground mb-3">Prawo jazdy</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(displayContract.najemca.prawo_jazdy_numer || isEditing) && (
                      <div className="space-y-2">
                        <Label>Numer prawa jazdy</Label>
                        {isEditing ? (
                          <Input 
                            value={displayContract.najemca.prawo_jazdy_numer || ''} 
                            onChange={(e) => updateField('najemca.prawo_jazdy_numer', e.target.value)}
                          />
                        ) : (
                          <p className="font-medium text-foreground">{displayContract.najemca.prawo_jazdy_numer}</p>
                        )}
                      </div>
                    )}
                    {(displayContract.najemca.prawo_jazdy_data || isEditing) && (
                      <div className="space-y-2">
                        <Label>Data wydania</Label>
                        {isEditing ? (
                          <Input 
                            type="date"
                            value={displayContract.najemca.prawo_jazdy_data || ''} 
                            onChange={(e) => updateField('najemca.prawo_jazdy_data', e.target.value)}
                          />
                        ) : (
                          <p className="font-medium text-foreground">{displayContract.najemca.prawo_jazdy_data}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
            
            {(displayContract.najemca.pesel || displayContract.najemca.nip || isEditing) && (
              <>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(displayContract.najemca.pesel || isEditing) && (
                    <div className="space-y-2">
                      <Label>PESEL</Label>
                      {isEditing ? (
                        <Input 
                          value={displayContract.najemca.pesel || ''} 
                          onChange={(e) => updateField('najemca.pesel', e.target.value)}
                        />
                      ) : (
                        <p className="font-medium text-foreground">{displayContract.najemca.pesel}</p>
                      )}
                    </div>
                  )}
                  {(displayContract.najemca.nip || isEditing) && (
                    <div className="space-y-2">
                      <Label>NIP</Label>
                      {isEditing ? (
                        <Input 
                          value={displayContract.najemca.nip || ''} 
                          onChange={(e) => updateField('najemca.nip', e.target.value)}
                        />
                      ) : (
                        <p className="font-medium text-foreground">{displayContract.najemca.nip}</p>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dodatkowi kierowcy */}
      {contract.osoby_upowaznione && contract.osoby_upowaznione.length > 0 && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Dodatkowi kierowcy ({contract.osoby_upowaznione.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {contract.osoby_upowaznione.map((osoba: any, idx: number) => (
              <div key={idx}>
                {idx > 0 && <Separator className="mb-6" />}
                <h4 className="font-semibold text-foreground mb-3">Kierowca #{idx + 1}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Imię i nazwisko</p>
                    <p className="font-medium text-foreground">{osoba.imie_nazwisko}</p>
                  </div>
                  {osoba.email && (
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium text-foreground">{osoba.email}</p>
                    </div>
                  )}
                  {osoba.tel && (
                    <div>
                      <p className="text-sm text-muted-foreground">Telefon</p>
                      <p className="font-medium text-foreground">{osoba.tel}</p>
                    </div>
                  )}
                  {osoba.prawo_jazdy && (
                    <div>
                      <p className="text-sm text-muted-foreground">Prawo jazdy</p>
                      <p className="font-medium text-foreground">{osoba.prawo_jazdy}</p>
                    </div>
                  )}
                  {osoba.dokument_towzaszosc && (
                    <>
                      <div>
                        <p className="text-sm text-muted-foreground">Dokument</p>
                        <p className="font-medium text-foreground">{osoba.dokument_towzaszosc.rodzaj}: {osoba.dokument_towzaszosc.numer}</p>
                      </div>
                      {osoba.dokument_towzaszosc.organ_wydający && (
                        <div>
                          <p className="text-sm text-muted-foreground">Organ wydający</p>
                          <p className="font-medium text-foreground">{osoba.dokument_towzaszosc.organ_wydający}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Przedmiot najmu */}
      {displayContract.przedmiot_najmu && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Przedmiot najmu
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(displayContract.przedmiot_najmu.model || isEditing) && (
                <div className="space-y-2">
                  <Label>Model</Label>
                  {isEditing ? (
                    <Input 
                      value={displayContract.przedmiot_najmu.model || ''} 
                      onChange={(e) => updateField('przedmiot_najmu.model', e.target.value)}
                    />
                  ) : (
                    <p className="font-medium text-foreground">{displayContract.przedmiot_najmu.model}</p>
                  )}
                </div>
              )}
              {(displayContract.przedmiot_najmu.vin || isEditing) && (
                <div className="space-y-2">
                  <Label>VIN</Label>
                  {isEditing ? (
                    <Input 
                      value={displayContract.przedmiot_najmu.vin || ''} 
                      onChange={(e) => updateField('przedmiot_najmu.vin', e.target.value)}
                    />
                  ) : (
                    <p className="font-medium text-foreground">{displayContract.przedmiot_najmu.vin}</p>
                  )}
                </div>
              )}
              {(displayContract.przedmiot_najmu.nr_rej || isEditing) && (
                <div className="space-y-2">
                  <Label>Numer rejestracyjny</Label>
                  {isEditing ? (
                    <Input 
                      value={displayContract.przedmiot_najmu.nr_rej || ''} 
                      onChange={(e) => updateField('przedmiot_najmu.nr_rej', e.target.value)}
                    />
                  ) : (
                    <p className="font-medium text-foreground">{displayContract.przedmiot_najmu.nr_rej}</p>
                  )}
                </div>
              )}
              {(displayContract.przedmiot_najmu.nastepne_badanie || isEditing) && (
                <div className="space-y-2">
                  <Label>Następne badanie techniczne</Label>
                  {isEditing ? (
                    <Input 
                      type="date"
                      value={displayContract.przedmiot_najmu.nastepne_badanie || ''} 
                      onChange={(e) => updateField('przedmiot_najmu.nastepne_badanie', e.target.value)}
                    />
                  ) : (
                    <p className="font-medium text-foreground">{displayContract.przedmiot_najmu.nastepne_badanie}</p>
                  )}
                </div>
              )}
            </div>
            
            {displayContract.przedmiot_najmu.polisa && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold text-foreground mb-3">Polisa</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(displayContract.przedmiot_najmu.polisa.numer || isEditing) && (
                      <div className="space-y-2">
                        <Label>Numer polisy</Label>
                        {isEditing ? (
                          <Input 
                            value={displayContract.przedmiot_najmu.polisa.numer || ''} 
                            onChange={(e) => updateField('przedmiot_najmu.polisa.numer', e.target.value)}
                          />
                        ) : (
                          <p className="font-medium text-foreground">{displayContract.przedmiot_najmu.polisa.numer}</p>
                        )}
                      </div>
                    )}
                    {(displayContract.przedmiot_najmu.polisa.wazna_do || isEditing) && (
                      <div className="space-y-2">
                        <Label>Ważna do</Label>
                        {isEditing ? (
                          <Input 
                            type="date"
                            value={displayContract.przedmiot_najmu.polisa.wazna_do || ''} 
                            onChange={(e) => updateField('przedmiot_najmu.polisa.wazna_do', e.target.value)}
                          />
                        ) : (
                          <p className="font-medium text-foreground">{displayContract.przedmiot_najmu.polisa.wazna_do}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
            
            {(displayContract.przedmiot_najmu.dodatkowe_informacje || isEditing) && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label>Dodatkowe informacje</Label>
                  {isEditing ? (
                    <Textarea 
                      value={displayContract.przedmiot_najmu.dodatkowe_informacje || ''} 
                      onChange={(e) => updateField('przedmiot_najmu.dodatkowe_informacje', e.target.value)}
                    />
                  ) : (
                    <p className="font-medium text-foreground">{displayContract.przedmiot_najmu.dodatkowe_informacje}</p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Opłaty */}
      {displayContract.oplaty && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Opłaty
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {displayContract.oplaty.rezerwacyjna && (
              <div>
                <h4 className="font-semibold text-foreground mb-3">Opłata rezerwacyjna</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(displayContract.oplaty.rezerwacyjna.data || isEditing) && (
                    <div className="space-y-2">
                      <Label>Data</Label>
                      {isEditing ? (
                        <Input 
                          type="date"
                          value={displayContract.oplaty.rezerwacyjna.data || ''} 
                          onChange={(e) => updateField('oplaty.rezerwacyjna.data', e.target.value)}
                        />
                      ) : (
                        <p className="font-medium text-foreground">{displayContract.oplaty.rezerwacyjna.data}</p>
                      )}
                    </div>
                  )}
                  {(displayContract.oplaty.rezerwacyjna.wysokosc || isEditing) && (
                    <div className="space-y-2">
                      <Label>Wysokość</Label>
                      {isEditing ? (
                        <Input 
                          value={displayContract.oplaty.rezerwacyjna.wysokosc || ''} 
                          onChange={(e) => updateField('oplaty.rezerwacyjna.wysokosc', e.target.value)}
                          placeholder="5000.00 zł"
                        />
                      ) : (
                        <p className="font-medium text-primary text-lg">{displayContract.oplaty.rezerwacyjna.wysokosc}</p>
                      )}
                    </div>
                  )}
                  {(displayContract.oplaty.rezerwacyjna.rachunek || isEditing) && (
                    <div className="md:col-span-2 space-y-2">
                      <Label>Rachunek</Label>
                      {isEditing ? (
                        <Input 
                          value={displayContract.oplaty.rezerwacyjna.rachunek || ''} 
                          onChange={(e) => updateField('oplaty.rezerwacyjna.rachunek', e.target.value)}
                          placeholder="mBank: 34 1140 2004..."
                        />
                      ) : (
                        <p className="font-medium text-foreground font-mono text-sm">{displayContract.oplaty.rezerwacyjna.rachunek}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {displayContract.oplaty.zasadnicza && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold text-foreground mb-3">Opłata zasadnicza</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(displayContract.oplaty.zasadnicza.data || isEditing) && (
                      <div className="space-y-2">
                        <Label>Data</Label>
                        {isEditing ? (
                          <Input 
                            type="date"
                            value={displayContract.oplaty.zasadnicza.data || ''} 
                            onChange={(e) => updateField('oplaty.zasadnicza.data', e.target.value)}
                          />
                        ) : (
                          <p className="font-medium text-foreground">{displayContract.oplaty.zasadnicza.data}</p>
                        )}
                      </div>
                    )}
                    {(displayContract.oplaty.zasadnicza.wysokosc || isEditing) && (
                      <div className="space-y-2">
                        <Label>Wysokość</Label>
                        {isEditing ? (
                          <Input 
                            value={displayContract.oplaty.zasadnicza.wysokosc || ''} 
                            onChange={(e) => updateField('oplaty.zasadnicza.wysokosc', e.target.value)}
                            placeholder="n/d"
                          />
                        ) : (
                          <p className="font-medium text-primary text-lg">{displayContract.oplaty.zasadnicza.wysokosc}</p>
                        )}
                      </div>
                    )}
                    {(displayContract.oplaty.zasadnicza.rachunek || isEditing) && (
                      <div className="md:col-span-2 space-y-2">
                        <Label>Rachunek</Label>
                        {isEditing ? (
                          <Input 
                            value={displayContract.oplaty.zasadnicza.rachunek || ''} 
                            onChange={(e) => updateField('oplaty.zasadnicza.rachunek', e.target.value)}
                            placeholder="mBank: 34 1140 2004..."
                          />
                        ) : (
                          <p className="font-medium text-foreground font-mono text-sm">{displayContract.oplaty.zasadnicza.rachunek}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {displayContract.oplaty.kaucja && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold text-foreground mb-3">Kaucja</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(displayContract.oplaty.kaucja.data || isEditing) && (
                      <div className="space-y-2">
                        <Label>Data</Label>
                        {isEditing ? (
                          <Input 
                            type="date"
                            value={displayContract.oplaty.kaucja.data || ''} 
                            onChange={(e) => updateField('oplaty.kaucja.data', e.target.value)}
                          />
                        ) : (
                          <p className="font-medium text-foreground">{displayContract.oplaty.kaucja.data}</p>
                        )}
                      </div>
                    )}
                    {(displayContract.oplaty.kaucja.wysokosc || isEditing) && (
                      <div className="space-y-2">
                        <Label>Wysokość</Label>
                        {isEditing ? (
                          <Input 
                            value={displayContract.oplaty.kaucja.wysokosc || ''} 
                            onChange={(e) => updateField('oplaty.kaucja.wysokosc', e.target.value)}
                            placeholder="5000.00 zł"
                          />
                        ) : (
                          <p className="font-medium text-primary text-lg">{displayContract.oplaty.kaucja.wysokosc}</p>
                        )}
                      </div>
                    )}
                    {(displayContract.oplaty.kaucja.rachunek || isEditing) && (
                      <div className="md:col-span-2 space-y-2">
                        <Label>Rachunek</Label>
                        {isEditing ? (
                          <Input 
                            value={displayContract.oplaty.kaucja.rachunek || ''} 
                            onChange={(e) => updateField('oplaty.kaucja.rachunek', e.target.value)}
                            placeholder="mBank: 08 1140 2004..."
                          />
                        ) : (
                          <p className="font-medium text-foreground font-mono text-sm">{displayContract.oplaty.kaucja.rachunek}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Formularze wydania i zwrotu */}
      <Card className="shadow-md border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Formularze wydania i zwrotu
          </CardTitle>
          <CardDescription>
            Linki do formularzy dla pracowników
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Formularz wydania kampera</Label>
              <div className="flex gap-2">
                <Input 
                  readOnly 
                  value={`${window.location.origin}/handover-form/${id}`}
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/handover-form/${id}`);
                    toast({
                      title: "Link skopiowany",
                      description: "Link do formularza wydania został skopiowany do schowka.",
                    });
                  }}
                >
                  <ClipboardCopy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Formularz zwrotu kampera</Label>
              <div className="flex gap-2">
                <Input 
                  readOnly 
                  value={`${window.location.origin}/return-form/${id}`}
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/return-form/${id}`);
                    toast({
                      title: "Link skopiowany",
                      description: "Link do formularza zwrotu został skopiowany do schowka.",
                    });
                  }}
                >
                  <ClipboardCopy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Uwagi */}
      {(displayContract.uwagi || isEditing) && (
        <Card className="shadow-md border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Uwagi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {isEditing ? (
              <>
                <Label>Dodatkowe uwagi</Label>
                <Textarea 
                  value={displayContract.uwagi || ''} 
                  onChange={(e) => updateField('uwagi', e.target.value)}
                  className="min-h-[120px]"
                />
              </>
            ) : (
              <p className="text-foreground">{displayContract.uwagi}</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ContractDetails;
