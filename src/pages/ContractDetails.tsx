import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, FileText, User, Car, CreditCard, AlertCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";

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
  
  const contract = id ? contractsData[id] : null;

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
            <h1 className="text-4xl font-bold text-foreground">Umowa {contract.umowa_numer}</h1>
            <Badge variant="outline" className={statusConfig[contract.status as keyof typeof statusConfig].className}>
              {statusConfig[contract.status as keyof typeof statusConfig].label}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-2">Szczegóły umowy najmu</p>
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
            <div>
              <p className="text-sm text-muted-foreground">Nazwa firmy</p>
              <p className="font-medium text-foreground">{contract.nazwa_firmy}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium text-foreground">{contract.email}</p>
            </div>
            {contract.telefony && contract.telefony.map((tel: string, idx: number) => (
              <div key={idx}>
                <p className="text-sm text-muted-foreground">Telefon {idx + 1}</p>
                <p className="font-medium text-foreground">{tel}</p>
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
              <div>
                <p className="text-sm text-muted-foreground">Nazwa</p>
                <p className="font-medium text-foreground">{contract.wynajmujacy.nazwa}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Adres</p>
                <p className="font-medium text-foreground">{contract.wynajmujacy.adres}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Telefon</p>
                <p className="font-medium text-foreground">{contract.wynajmujacy.tel}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">WWW</p>
                <p className="font-medium text-foreground">{contract.wynajmujacy.www}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium text-foreground">{contract.wynajmujacy.email}</p>
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
              <div>
                <p className="text-sm text-muted-foreground">Data rozpoczęcia</p>
                <p className="font-medium text-foreground">{contract.okres_najmu.od}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data zakończenia</p>
                <p className="font-medium text-foreground">{contract.okres_najmu.do}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Miejsce</p>
                <p className="font-medium text-foreground">{contract.okres_najmu.miejsce}</p>
              </div>
              {contract.okres_najmu.zwrot_do && (
                <div>
                  <p className="text-sm text-muted-foreground">Zwrot do</p>
                  <p className="font-medium text-foreground">{contract.okres_najmu.zwrot_do}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Najemca (Główny kierowca) */}
      {contract.najemca && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Najemca (Główny kierowca)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Imię i nazwisko</p>
                <p className="font-medium text-foreground">{contract.najemca.imie_nazwisko}</p>
              </div>
              {contract.najemca.email && (
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium text-foreground">{contract.najemca.email}</p>
                </div>
              )}
              {contract.najemca.tel && (
                <div>
                  <p className="text-sm text-muted-foreground">Telefon</p>
                  <p className="font-medium text-foreground">{contract.najemca.tel}</p>
                </div>
              )}
              {contract.najemca.adres_zamieszkania && (
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground">Adres zamieszkania</p>
                  <p className="font-medium text-foreground">{contract.najemca.adres_zamieszkania}</p>
                </div>
              )}
            </div>
            
            {contract.najemca.dokument_towzaszosc && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold text-foreground mb-3">Dokument tożsamości</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Rodzaj</p>
                      <p className="font-medium text-foreground">{contract.najemca.dokument_towzaszosc.rodzaj}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Numer</p>
                      <p className="font-medium text-foreground">{contract.najemca.dokument_towzaszosc.numer}</p>
                    </div>
                    {contract.najemca.dokument_towzaszosc.organ_wydający && (
                      <div>
                        <p className="text-sm text-muted-foreground">Organ wydający</p>
                        <p className="font-medium text-foreground">{contract.najemca.dokument_towzaszosc.organ_wydający}</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
            
            {(contract.najemca.prawo_jazdy_numer || contract.najemca.prawo_jazdy_data) && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold text-foreground mb-3">Prawo jazdy</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {contract.najemca.prawo_jazdy_numer && (
                      <div>
                        <p className="text-sm text-muted-foreground">Numer prawa jazdy</p>
                        <p className="font-medium text-foreground">{contract.najemca.prawo_jazdy_numer}</p>
                      </div>
                    )}
                    {contract.najemca.prawo_jazdy_data && (
                      <div>
                        <p className="text-sm text-muted-foreground">Data wydania</p>
                        <p className="font-medium text-foreground">{contract.najemca.prawo_jazdy_data}</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
            
            {(contract.najemca.pesel || contract.najemca.nip) && (
              <>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {contract.najemca.pesel && (
                    <div>
                      <p className="text-sm text-muted-foreground">PESEL</p>
                      <p className="font-medium text-foreground">{contract.najemca.pesel}</p>
                    </div>
                  )}
                  {contract.najemca.nip && (
                    <div>
                      <p className="text-sm text-muted-foreground">NIP</p>
                      <p className="font-medium text-foreground">{contract.najemca.nip}</p>
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
      {contract.przedmiot_najmu && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Przedmiot najmu
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contract.przedmiot_najmu.model && (
                <div>
                  <p className="text-sm text-muted-foreground">Model</p>
                  <p className="font-medium text-foreground">{contract.przedmiot_najmu.model}</p>
                </div>
              )}
              {contract.przedmiot_najmu.vin && (
                <div>
                  <p className="text-sm text-muted-foreground">VIN</p>
                  <p className="font-medium text-foreground">{contract.przedmiot_najmu.vin}</p>
                </div>
              )}
              {contract.przedmiot_najmu.nr_rej && (
                <div>
                  <p className="text-sm text-muted-foreground">Numer rejestracyjny</p>
                  <p className="font-medium text-foreground">{contract.przedmiot_najmu.nr_rej}</p>
                </div>
              )}
              {contract.przedmiot_najmu.nastepne_badanie && (
                <div>
                  <p className="text-sm text-muted-foreground">Następne badanie techniczne</p>
                  <p className="font-medium text-foreground">{contract.przedmiot_najmu.nastepne_badanie}</p>
                </div>
              )}
            </div>
            
            {contract.przedmiot_najmu.polisa && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold text-foreground mb-3">Polisa</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {contract.przedmiot_najmu.polisa.numer && (
                      <div>
                        <p className="text-sm text-muted-foreground">Numer polisy</p>
                        <p className="font-medium text-foreground">{contract.przedmiot_najmu.polisa.numer}</p>
                      </div>
                    )}
                    {contract.przedmiot_najmu.polisa.wazna_do && (
                      <div>
                        <p className="text-sm text-muted-foreground">Ważna do</p>
                        <p className="font-medium text-foreground">{contract.przedmiot_najmu.polisa.wazna_do}</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
            
            {contract.przedmiot_najmu.dodatkowe_informacje && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">Dodatkowe informacje</p>
                  <p className="font-medium text-foreground">{contract.przedmiot_najmu.dodatkowe_informacje}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Opłaty */}
      {contract.oplaty && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Opłaty
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {contract.oplaty.rezerwacyjna && (
              <div>
                <h4 className="font-semibold text-foreground mb-3">Opłata rezerwacyjna</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {contract.oplaty.rezerwacyjna.data && (
                    <div>
                      <p className="text-sm text-muted-foreground">Data</p>
                      <p className="font-medium text-foreground">{contract.oplaty.rezerwacyjna.data}</p>
                    </div>
                  )}
                  {contract.oplaty.rezerwacyjna.wysokosc && (
                    <div>
                      <p className="text-sm text-muted-foreground">Wysokość</p>
                      <p className="font-medium text-primary text-lg">{contract.oplaty.rezerwacyjna.wysokosc}</p>
                    </div>
                  )}
                  {contract.oplaty.rezerwacyjna.rachunek && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-muted-foreground">Rachunek</p>
                      <p className="font-medium text-foreground font-mono text-sm">{contract.oplaty.rezerwacyjna.rachunek}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {contract.oplaty.zasadnicza && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold text-foreground mb-3">Opłata zasadnicza</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {contract.oplaty.zasadnicza.data && (
                      <div>
                        <p className="text-sm text-muted-foreground">Data</p>
                        <p className="font-medium text-foreground">{contract.oplaty.zasadnicza.data}</p>
                      </div>
                    )}
                    {contract.oplaty.zasadnicza.wysokosc && (
                      <div>
                        <p className="text-sm text-muted-foreground">Wysokość</p>
                        <p className="font-medium text-primary text-lg">{contract.oplaty.zasadnicza.wysokosc}</p>
                      </div>
                    )}
                    {contract.oplaty.zasadnicza.rachunek && (
                      <div className="md:col-span-2">
                        <p className="text-sm text-muted-foreground">Rachunek</p>
                        <p className="font-medium text-foreground font-mono text-sm">{contract.oplaty.zasadnicza.rachunek}</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {contract.oplaty.kaucja && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold text-foreground mb-3">Kaucja</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {contract.oplaty.kaucja.data && (
                      <div>
                        <p className="text-sm text-muted-foreground">Data</p>
                        <p className="font-medium text-foreground">{contract.oplaty.kaucja.data}</p>
                      </div>
                    )}
                    {contract.oplaty.kaucja.wysokosc && (
                      <div>
                        <p className="text-sm text-muted-foreground">Wysokość</p>
                        <p className="font-medium text-primary text-lg">{contract.oplaty.kaucja.wysokosc}</p>
                      </div>
                    )}
                    {contract.oplaty.kaucja.rachunek && (
                      <div className="md:col-span-2">
                        <p className="text-sm text-muted-foreground">Rachunek</p>
                        <p className="font-medium text-foreground font-mono text-sm">{contract.oplaty.kaucja.rachunek}</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Uwagi */}
      {contract.uwagi && (
        <Card className="shadow-md border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Uwagi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground">{contract.uwagi}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ContractDetails;
