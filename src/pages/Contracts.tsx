import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Calendar, Edit, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface Contract {
  id: number;
  contractNumber: string;
  clientName: string;
  vehicle: string;
  startDate: string;
  endDate: string;
  status: "active" | "pending" | "completed";
  value: string;
}

const contracts: Contract[] = [
  {
    id: 1,
    contractNumber: "UM/2024/001",
    clientName: "Jan Kowalski",
    vehicle: "Kamper XL-450",
    startDate: "2024-03-15",
    endDate: "2024-03-22",
    status: "active",
    value: "4,500 zł",
  },
  {
    id: 2,
    contractNumber: "UM/2024/002",
    clientName: "Anna Nowak",
    vehicle: "Przyczepa Camp-200",
    startDate: "2024-03-14",
    endDate: "2024-03-21",
    status: "active",
    value: "2,800 zł",
  },
  {
    id: 3,
    contractNumber: "UM/2024/003",
    clientName: "Piotr Wiśniewski",
    vehicle: "Kamper Comfort-300",
    startDate: "2024-03-20",
    endDate: "2024-03-27",
    status: "pending",
    value: "3,600 zł",
  },
  {
    id: 4,
    contractNumber: "UM/2024/004",
    clientName: "Maria Wójcik",
    vehicle: "Kamper Family-500",
    startDate: "2024-03-10",
    endDate: "2024-03-17",
    status: "completed",
    value: "5,200 zł",
  },
];

const statusConfig = {
  active: { label: "Aktywna", className: "bg-primary/10 text-primary border-primary/20" },
  pending: { label: "Oczekująca", className: "bg-secondary/10 text-secondary border-secondary/20" },
  completed: { label: "Zakończona", className: "bg-muted text-muted-foreground border-muted" },
};

const Contracts = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Here you would normally save to backend
    toast({
      title: "Umowa utworzona",
      description: "Nowa umowa została pomyślnie dodana do systemu.",
    });
    
    setIsDialogOpen(false);
    e.currentTarget.reset();
  };

  const filteredContracts = contracts.filter(
    (contract) =>
      contract.contractNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.vehicle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Umowy</h1>
          <p className="text-muted-foreground">Zarządzaj umowami najmu</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-md">
              <Plus className="h-4 w-4" />
              Nowa umowa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nowa umowa</DialogTitle>
              <DialogDescription>
                Wypełnij formularz, aby utworzyć nową umowę najmu
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 mt-4">
              {/* Podstawowe informacje */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Podstawowe informacje</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nazwa_firmy">Nazwa firmy</Label>
                    <Input id="nazwa_firmy" name="nazwa_firmy" placeholder="KOKO KAMPER" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" placeholder="kontakt@kokokamper.pl" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefon1">Telefon 1</Label>
                    <Input id="telefon1" name="telefon1" placeholder="+48 607 108 993" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefon2">Telefon 2</Label>
                    <Input id="telefon2" name="telefon2" placeholder="+48 660 694 257" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="umowa_numer">Numer umowy</Label>
                    <Input id="umowa_numer" name="umowa_numer" placeholder="60/2024" required />
                  </div>
                </div>
              </div>

              {/* Wynajmujący */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Wynajmujący</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="wynajmujacy_nazwa">Nazwa</Label>
                    <Input id="wynajmujacy_nazwa" name="wynajmujacy_nazwa" placeholder="Koko Group Sp. z o.o." required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wynajmujacy_adres">Adres</Label>
                    <Input id="wynajmujacy_adres" name="wynajmujacy_adres" placeholder="ul. Lazurowa 85a/53, 01-479 Warszawa" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wynajmujacy_tel">Telefon</Label>
                    <Input id="wynajmujacy_tel" name="wynajmujacy_tel" placeholder="+48 660 694 257" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wynajmujacy_www">WWW</Label>
                    <Input id="wynajmujacy_www" name="wynajmujacy_www" placeholder="www.kokokamper.pl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wynajmujacy_email">Email</Label>
                    <Input id="wynajmujacy_email" name="wynajmujacy_email" type="email" placeholder="kontakt@kokokamper.pl" required />
                  </div>
                </div>
              </div>

              {/* Okres najmu */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Okres najmu</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="okres_od">Data rozpoczęcia</Label>
                    <Input id="okres_od" name="okres_od" type="datetime-local" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="okres_do">Data zakończenia</Label>
                    <Input id="okres_do" name="okres_do" type="datetime-local" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="okres_miejsce">Miejsce</Label>
                    <Input id="okres_miejsce" name="okres_miejsce" placeholder="oddział Warszawa" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="okres_zwrot_do">Zwrot do</Label>
                    <Input id="okres_zwrot_do" name="okres_zwrot_do" />
                  </div>
                </div>
              </div>

              {/* Najemca */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Najemca</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="najemca_nazwa">Nazwa</Label>
                    <Input id="najemca_nazwa" name="najemca_nazwa" placeholder="Adam Fedio" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="najemca_nip">NIP</Label>
                    <Input id="najemca_nip" name="najemca_nip" placeholder="70110803631/00856/04/2808" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="najemca_adres">Adres</Label>
                    <Input id="najemca_adres" name="najemca_adres" placeholder="Władysława Reymona 29, Latchorzew, 05-082" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="najemca_imie_nazwisko">Imię i nazwisko</Label>
                    <Input id="najemca_imie_nazwisko" name="najemca_imie_nazwisko" placeholder="Adam Fedio" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="najemca_adres_zamieszkania">Adres zamieszkania</Label>
                    <Input id="najemca_adres_zamieszkania" name="najemca_adres_zamieszkania" placeholder="Władysława Reymona 29, Latchorzew, 05-082" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="najemca_dokument_rodzaj">Rodzaj dokumentu</Label>
                    <Input id="najemca_dokument_rodzaj" name="najemca_dokument_rodzaj" placeholder="Dowód osobisty" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="najemca_dokument_numer">Numer dokumentu</Label>
                    <Input id="najemca_dokument_numer" name="najemca_dokument_numer" placeholder="DBZ976078" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="najemca_dokument_organ">Organ wydający</Label>
                    <Input id="najemca_dokument_organ" name="najemca_dokument_organ" placeholder="Wójt gminy Stare Babice" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="najemca_pesel_prawo_jazdy">PESEL / Prawo jazdy</Label>
                    <Input id="najemca_pesel_prawo_jazdy" name="najemca_pesel_prawo_jazdy" placeholder="70110803631/00856/04/2808" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="najemca_email">Email</Label>
                    <Input id="najemca_email" name="najemca_email" type="email" placeholder="adam.fedio@gmail.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="najemca_tel">Telefon</Label>
                    <Input id="najemca_tel" name="najemca_tel" placeholder="508140790" required />
                  </div>
                </div>
              </div>

              {/* Przedmiot najmu */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Przedmiot najmu</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="przedmiot_model">Model</Label>
                    <Input id="przedmiot_model" name="przedmiot_model" placeholder="RANDGER R600" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="przedmiot_vin">VIN</Label>
                    <Input id="przedmiot_vin" name="przedmiot_vin" placeholder="ZFA25000002S85417" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="przedmiot_nr_rej">Nr rejestracyjny</Label>
                    <Input id="przedmiot_nr_rej" name="przedmiot_nr_rej" placeholder="WZ726ES" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="przedmiot_nastepne_badanie">Następne badanie</Label>
                    <Input id="przedmiot_nastepne_badanie" name="przedmiot_nastepne_badanie" type="date" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="przedmiot_polisa_numer">Numer polisy</Label>
                    <Input id="przedmiot_polisa_numer" name="przedmiot_polisa_numer" placeholder="1068435310/9933" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="przedmiot_polisa_wazna_do">Polisa ważna do</Label>
                    <Input id="przedmiot_polisa_wazna_do" name="przedmiot_polisa_wazna_do" type="date" required />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="przedmiot_dodatkowe_info">Dodatkowe informacje</Label>
                    <Textarea id="przedmiot_dodatkowe_info" name="przedmiot_dodatkowe_info" placeholder="pełne wyposażenie, brak zwierząt, bez sprzątania" />
                  </div>
                </div>
              </div>

              {/* Osoby upoważnione */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Osoby upoważnione</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="osoba_upow_imie_nazwisko">Imię i nazwisko</Label>
                    <Input id="osoba_upow_imie_nazwisko" name="osoba_upow_imie_nazwisko" placeholder="Monika Fedio" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="osoba_upow_dokument_rodzaj">Rodzaj dokumentu</Label>
                    <Input id="osoba_upow_dokument_rodzaj" name="osoba_upow_dokument_rodzaj" placeholder="Dowód osobisty" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="osoba_upow_dokument_numer">Numer dokumentu</Label>
                    <Input id="osoba_upow_dokument_numer" name="osoba_upow_dokument_numer" placeholder="DEW863370" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="osoba_upow_dokument_organ">Organ wydający</Label>
                    <Input id="osoba_upow_dokument_organ" name="osoba_upow_dokument_organ" placeholder="Wójt gminy Stare Babice" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="osoba_upow_prawo_jazdy">Prawo jazdy</Label>
                    <Input id="osoba_upow_prawo_jazdy" name="osoba_upow_prawo_jazdy" placeholder="04743/06/1432 Kat...." />
                  </div>
                </div>
              </div>

              {/* Opłaty */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Opłaty</h3>
                
                {/* Opłata rezerwacyjna */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Opłata rezerwacyjna</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="oplata_rez_data">Data</Label>
                      <Input id="oplata_rez_data" name="oplata_rez_data" type="date" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="oplata_rez_wysokosc">Wysokość</Label>
                      <Input id="oplata_rez_wysokosc" name="oplata_rez_wysokosc" placeholder="5000.00 zł" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="oplata_rez_rachunek">Rachunek</Label>
                      <Input id="oplata_rez_rachunek" name="oplata_rez_rachunek" placeholder="mBank: 34 1140 2004..." />
                    </div>
                  </div>
                </div>

                {/* Opłata zasadnicza */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Opłata zasadnicza</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="oplata_zas_data">Data</Label>
                      <Input id="oplata_zas_data" name="oplata_zas_data" type="date" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="oplata_zas_wysokosc">Wysokość</Label>
                      <Input id="oplata_zas_wysokosc" name="oplata_zas_wysokosc" placeholder="n/d" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="oplata_zas_rachunek">Rachunek</Label>
                      <Input id="oplata_zas_rachunek" name="oplata_zas_rachunek" placeholder="mBank: 34 1140 2004..." />
                    </div>
                  </div>
                </div>

                {/* Kaucja */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Kaucja</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="oplata_kaucja_data">Data</Label>
                      <Input id="oplata_kaucja_data" name="oplata_kaucja_data" type="date" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="oplata_kaucja_wysokosc">Wysokość</Label>
                      <Input id="oplata_kaucja_wysokosc" name="oplata_kaucja_wysokosc" placeholder="5000.00 zł" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="oplata_kaucja_rachunek">Rachunek</Label>
                      <Input id="oplata_kaucja_rachunek" name="oplata_kaucja_rachunek" placeholder="mBank: 08 1140 2004..." />
                    </div>
                  </div>
                </div>
              </div>

              {/* Uwagi */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Uwagi</h3>
                <div className="space-y-2">
                  <Label htmlFor="uwagi">Dodatkowe uwagi</Label>
                  <Textarea 
                    id="uwagi" 
                    name="uwagi" 
                    placeholder="Opłaty należy dokonywać na rachunek bankowy..."
                    className="min-h-[120px]"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Anuluj
                </Button>
                <Button type="submit">
                  Utwórz umowę
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Szukaj umów..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Lista umów</CardTitle>
          <CardDescription>Wszystkie umowy w systemie</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredContracts.map((contract) => (
              <div
                key={contract.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors gap-4"
              >
                <div className="flex-1 space-y-2 w-full sm:w-auto">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-semibold text-foreground">{contract.contractNumber}</span>
                    <Badge variant="outline" className={statusConfig[contract.status].className}>
                      {statusConfig[contract.status].label}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Klient: <span className="text-foreground font-medium">{contract.clientName}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Pojazd: <span className="text-foreground font-medium">{contract.vehicle}</span>
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {contract.startDate} - {contract.endDate}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="text-right flex-1 sm:flex-none">
                    <p className="text-sm text-muted-foreground">Wartość</p>
                    <p className="text-xl font-bold text-primary">{contract.value}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" className="shrink-0">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="shrink-0">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Contracts;
