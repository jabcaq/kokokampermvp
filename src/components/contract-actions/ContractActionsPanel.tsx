import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { FileText, Send, CheckCircle, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUpsertContractDocument } from "@/hooks/useContractDocuments";
import { useContract } from "@/hooks/useContracts";
import { toZonedTime } from "date-fns-tz";
import { format } from "date-fns";

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
  const upsertDocument = useUpsertContractDocument();
  const { data: contract } = useContract(contractId);

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
    ];

    return lines.filter(line => line !== null).join('\n');
  };

  const handleGenerateContract = async () => {
    if (!contract) {
      toast({
        title: "Błąd",
        description: "Nie znaleziono danych umowy",
        variant: "destructive",
      });
      return;
    }

    try {
      // Prepare flat JSON without arrays
      const { additional_drivers, payments, client, ...contractData } = contract;
      
      // Extract simple contract number (e.g., "K/1/2025" -> "1 2025")
      const contractNumberParts = contract.contract_number.split('/');
      const simpleContractNumber = contractNumberParts.length >= 2 
        ? `${contractNumberParts[1]} ${contractNumberParts[2] || ''}`.trim()
        : contract.contract_number;

      // Format dates to Europe/Warsaw timezone in ISO format
      const formatDateForWebhook = (dateString: string | null | undefined) => {
        if (!dateString) return null;
        try {
          const date = new Date(dateString);
          const zonedDate = toZonedTime(date, 'Europe/Warsaw');
          return format(zonedDate, "yyyy-MM-dd'T'HH:mm:ssXXX");
        } catch (e) {
          console.error('Error formatting date:', dateString, e);
          return dateString;
        }
      };

      const webhookData = {
        ...contractData,
        // Format dates properly
        start_date: formatDateForWebhook(contractData.start_date),
        end_date: formatDateForWebhook(contractData.end_date),
        // Flatten client data
        client_name: client?.name,
        client_email: client?.email,
        client_phone: client?.phone,
        // Add simple contract number format
        contract_number_simple: simpleContractNumber,
      };

      // Send webhook request with full contract data
      await fetch('https://hook.eu2.make.com/w4rawvvado11i4rj0r44amhxvycg9mhs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData),
      });

      await upsertDocument.mutateAsync({
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
      await fetch('https://hook.eu2.make.com/bkpo70mwa6qk4n6bbsrrnwo492p9ds5w', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contract_id: contractId,
        }),
      });

      await upsertDocument.mutateAsync({
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

  const handleSendVerification = async () => {
    try {
      const verificationText = generateVerificationText();
      
      await fetch('https://hook.eu2.make.com/o66tfsx4rg87tehck0mx2pm4065idl9i', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contract_number: contractNumber,
          verification_data: verificationText,
        }),
      });
      
      toast({
        title: "Sukces",
        description: "Dane zostały wysłane do weryfikacji",
      });
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się wysłać danych do weryfikacji",
        variant: "destructive",
      });
    }
  };

  const handleCopyDriverForm = async () => {
    if (!contractId || !contractNumber) {
      toast({
        title: "Błąd",
        description: "Brak danych umowy. Poczekaj na załadowanie.",
        variant: "destructive",
      });
      return;
    }

    const driverFormLink = `https://app.kokokamper.pl/driver-form/${encodeURIComponent(contractNumber)}`;
    navigator.clipboard.writeText(driverFormLink);
    
    try {
      await fetch('https://hook.eu2.make.com/u73t37l3xvdm4dkwrxfftl8yxvuku7op', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contract_id: contractId,
          contract_number: contractNumber,
          driver_form_link: driverFormLink,
          number_of_travelers: contract?.number_of_travelers || null,
        }),
      });
      
      toast({
        title: "Link skopiowany i wysłany",
        description: "Link do formularza kierowcy został skopiowany i wysłany",
      });
    } catch (error) {
      toast({
        title: "Link skopiowany",
        description: "Link został skopiowany, ale nie udało się wysłać do systemu",
        variant: "destructive",
      });
    }
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
              disabled={upsertDocument.isPending}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <FileText className="h-3 w-3 mr-1.5" />
              Generuj umowę
            </Button>
            <Button 
              onClick={handleSendToClient}
              variant="outline"
              disabled={upsertDocument.isPending || !clientEmail}
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

    </>
  );
};
