import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { FileText, Send, CheckCircle, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAddContractDocument } from "@/hooks/useContractDocuments";
import { useContract } from "@/hooks/useContracts";

interface ContractActionsPanelProps {
  contractId: string;
  contractNumber: string;
  clientEmail?: string;
}

export const ContractActionsPanel = ({ 
  contractId, 
  contractNumber,
  clientEmail 
}: ContractActionsPanelProps) => {
  const { toast } = useToast();
  const addDocument = useAddContractDocument();
  const { data: contract } = useContract(contractId);
  const [showVerificationData, setShowVerificationData] = useState(false);

  const generateVerificationText = () => {
    if (!contract) return "";
    
    const lines = [
      "=== DANE NAJEMCY - WERYFIKACJA ===",
      "",
      "INFORMACJE PODSTAWOWE:",
      contract.tenant_company_name ? `Nazwa firmy: ${contract.tenant_company_name}` : null,
      contract.tenant_nip ? `NIP: ${contract.tenant_nip}` : null,
      `Numer umowy: ${contract.contract_number}`,
      contract.umowa_text ? `Numer umowy (stary system): ${contract.umowa_text}` : null,
      "",
      "DANE OSOBOWE NAJEMCY:",
      `Imię i nazwisko: ${contract.tenant_name || 'Nie podano'}`,
      `Email: ${contract.tenant_email || 'Nie podano'}`,
      `Telefon: ${contract.tenant_phone || 'Nie podano'}`,
      `Adres zamieszkania: ${contract.tenant_address || 'Nie podano'}`,
      "",
      "DOKUMENT TOŻSAMOŚCI:",
      `Rodzaj dokumentu: ${contract.tenant_id_type || 'Nie podano'}`,
      `Numer dokumentu: ${contract.tenant_id_number || 'Nie podano'}`,
      `Organ wydający: ${contract.tenant_id_issuer || 'Nie podano'}`,
      "",
      "DANE IDENTYFIKACYJNE:",
      `PESEL: ${contract.tenant_pesel || 'Nie podano'}`,
      `NIP: ${contract.tenant_nip || 'Nie podano'}`,
      "",
      "PRAWO JAZDY:",
      `Numer prawa jazdy: ${contract.tenant_license_number || 'Nie podano'}`,
      `Data wydania prawa jazdy: ${contract.tenant_license_date || 'Nie podano'}`,
      "",
      "OKRES NAJMU:",
      `Data rozpoczęcia: ${contract.start_date || 'Nie podano'}`,
      `Data zakończenia: ${contract.end_date || 'Nie podano'}`,
      "",
      "PRZEDMIOT NAJMU:",
      `Model pojazdu: ${contract.vehicle_model || 'Nie podano'}`,
      `Nr rejestracyjny: ${contract.registration_number || 'Nie podano'}`,
      `VIN: ${contract.vehicle_vin || 'Nie podano'}`,
      `Następne badanie: ${contract.vehicle_next_inspection || 'Nie podano'}`,
      `Numer polisy: ${contract.vehicle_insurance_number || 'Nie podano'}`,
      `Polisa ważna do: ${contract.vehicle_insurance_valid_until || 'Nie podano'}`,
      contract.vehicle_additional_info ? `Dodatkowe informacje: ${contract.vehicle_additional_info}` : null,
      "",
      "PŁATNOŚCI:",
      contract.value ? `Wartość umowy: ${contract.value} PLN` : null,
      contract.payments && typeof contract.payments === 'object' && 'rezerwacyjna' in contract.payments ? `Opłata rezerwacyjna: ${(contract.payments as any).rezerwacyjna.wysokosc} (data: ${(contract.payments as any).rezerwacyjna.data})` : null,
      contract.payments && typeof contract.payments === 'object' && 'zasadnicza' in contract.payments ? `Opłata zasadnicza: ${(contract.payments as any).zasadnicza.wysokosc} (data: ${(contract.payments as any).zasadnicza.data})` : null,
      contract.payments && typeof contract.payments === 'object' && 'kaucja' in contract.payments ? `Kaucja: ${(contract.payments as any).kaucja.wysokosc} (data: ${(contract.payments as any).kaucja.data})` : null,
      "",
      "DODATKOWI KIEROWCY:",
    ];

    if (contract.additional_drivers && Array.isArray(contract.additional_drivers) && contract.additional_drivers.length > 1) {
      contract.additional_drivers.slice(1).forEach((driver: any, idx: number) => {
        lines.push(
          ``,
          `Kierowca ${idx + 1}:`,
          `  Imię i nazwisko: ${driver.imie_nazwisko || 'Nie podano'}`,
          `  Email: ${driver.email || 'Nie podano'}`,
          `  Telefon: ${driver.tel || 'Nie podano'}`,
          `  Numer prawa jazdy: ${driver.prawo_jazdy_numer || 'Nie podano'}`,
          `  Data wydania prawa jazdy: ${driver.prawo_jazdy_data || 'Nie podano'}`,
          `  Rodzaj dokumentu: ${driver.dokument_rodzaj || 'Nie podano'}`,
          `  Numer dokumentu: ${driver.dokument_numer || 'Nie podano'}`,
          `  Organ wydający: ${driver.dokument_organ || 'Nie podano'}`
        );
      });
    } else {
      lines.push("Brak dodatkowych kierowców");
    }

    if (contract.notes) {
      lines.push("", "UWAGI:", contract.notes);
    }

    return lines.filter(line => line !== null).join('\n');
  };

  const handleGenerateContract = async () => {
    try {
      await addDocument.mutateAsync({
        contract_id: contractId,
        document_type: 'contract',
        status: 'generated',
        generated_at: new Date().toISOString(),
        sent_at: null,
        sent_to_email: null,
        file_url: null,
      });
      
      toast({
        title: "Sukces",
        description: "Umowa została wygenerowana",
      });
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się wygenerować umowy",
        variant: "destructive",
      });
    }
  };

  const handleSendToClient = async () => {
    if (!clientEmail) {
      toast({
        title: "Błąd",
        description: "Brak adresu email klienta",
        variant: "destructive",
      });
      return;
    }

    try {
      await addDocument.mutateAsync({
        contract_id: contractId,
        document_type: 'contract',
        status: 'sent',
        generated_at: new Date().toISOString(),
        sent_at: new Date().toISOString(),
        sent_to_email: clientEmail,
        file_url: null,
      });
      
      toast({
        title: "Sukces",
        description: `Umowa została wysłana do ${clientEmail}`,
      });
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się wysłać umowy",
        variant: "destructive",
      });
    }
  };

  const handleSendVerification = () => {
    setShowVerificationData(true);
  };

  const handleCopyDriverForm = () => {
    const driverFormLink = `${window.location.origin}/driver-form/${encodeURIComponent(contractNumber)}`;
    navigator.clipboard.writeText(driverFormLink);
    toast({
      title: "Link skopiowany",
      description: "Link do formularza kierowcy został skopiowany do schowka",
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Akcje umowy</CardTitle>
          <CardDescription>Nr umowy: {contractNumber}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button 
              onClick={handleGenerateContract}
              disabled={addDocument.isPending}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <FileText className="h-3 w-3 mr-1.5" />
              Generuj umowę
            </Button>
            <Button 
              onClick={handleSendToClient}
              variant="outline"
              disabled={addDocument.isPending || !clientEmail}
              size="sm"
              className="border-gray-400 text-gray-700 hover:bg-gray-100"
            >
              <Send className="h-3 w-3 mr-1.5" />
              Wyślij do klienta
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button 
              onClick={handleCopyDriverForm}
              variant="outline"
              size="sm"
              className="border-purple-400 text-purple-700 hover:bg-purple-50"
            >
              <UserPlus className="h-3 w-3 mr-1.5" />
              Formularz kierowcy
            </Button>
            <Button 
              onClick={handleSendVerification}
              size="sm"
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <CheckCircle className="h-3 w-3 mr-1.5" />
              Wyślij do weryfikacji
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showVerificationData} onOpenChange={setShowVerificationData}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Dane do weryfikacji</DialogTitle>
            <DialogDescription>
              Wszystkie informacje o najemcy z umowy {contractNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <pre className="whitespace-pre-wrap bg-muted p-4 rounded-lg text-sm font-mono">
              {generateVerificationText()}
            </pre>
            <div className="mt-4 flex gap-2">
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(generateVerificationText());
                  toast({
                    title: "Skopiowano",
                    description: "Dane zostały skopiowane do schowka",
                  });
                }}
                variant="outline"
              >
                Kopiuj do schowka
              </Button>
              <Button onClick={() => setShowVerificationData(false)}>
                Zamknij
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
