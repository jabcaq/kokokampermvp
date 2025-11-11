import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { FileText, Send, CheckCircle, UserPlus, Check } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useUpsertContractDocument } from "@/hooks/useContractDocuments";
import { useContract } from "@/hooks/useContracts";
import { useCreateNotificationLog } from "@/hooks/useNotificationLogs";
import { toZonedTime } from "date-fns-tz";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  const createLog = useCreateNotificationLog();

  // Fetch contract documents to check completion status
  const { data: contractDocuments } = useQuery({
    queryKey: ["contract_documents", contractId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contract_documents")
        .select("*")
        .eq("contract_id", contractId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!contractId,
  });

  // Checklist state
  const [checklist, setChecklist] = useState({
    driverForm: false,
    verification: false,
    generated: false,
    sent: false,
  });

  // Update checklist based on contract documents
  useEffect(() => {
    if (contractDocuments) {
      const hasGenerated = contractDocuments.some(
        (doc) => doc.document_type === "contract" && doc.status === "generated"
      );
      const hasSent = contractDocuments.some(
        (doc) => doc.document_type === "contract" && doc.status === "sent"
      );
      
      setChecklist((prev) => ({
        ...prev,
        generated: hasGenerated || prev.generated,
        sent: hasSent || prev.sent,
      }));
    }
  }, [contractDocuments]);

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
      
      // Log the action
      await createLog.mutateAsync({
        notification_type: 'contract_generated',
        notification_title: 'Wygenerowano umowę',
        action_description: `Umowa ${contractNumber} została wygenerowana`,
        contract_id: contractId,
        contract_number: contractNumber,
        metadata: { action: 'generate_contract' }
      });

      toast({
        title: "Sukces",
        description: "Umowa została wygenerowana",
      });

      // Mark as completed in checklist
      setChecklist((prev) => ({ ...prev, generated: true }));
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
      
      // Log the action
      await createLog.mutateAsync({
        notification_type: 'contract_sent',
        notification_title: 'Wysłano umowę do klienta',
        action_description: `Umowa ${contractNumber} wysłana na ${clientEmail}`,
        contract_id: contractId,
        contract_number: contractNumber,
        metadata: { action: 'send_to_client', email: clientEmail }
      });

      toast({
        title: "Sukces",
        description: `Umowa została wysłana do ${clientEmail}`,
      });

      // Mark as completed in checklist
      setChecklist((prev) => ({ ...prev, sent: true }));
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
      
      // Log the action
      await createLog.mutateAsync({
        notification_type: 'verification_sent',
        notification_title: 'Wysłano dane do weryfikacji',
        action_description: `Dane umowy ${contractNumber} wysłane do weryfikacji`,
        contract_id: contractId,
        contract_number: contractNumber,
        metadata: { action: 'send_verification' }
      });

      toast({
        title: "Sukces",
        description: "Dane zostały wysłane do weryfikacji",
      });

      // Mark as completed in checklist
      setChecklist((prev) => ({ ...prev, verification: true }));
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
      
      // Log the action
      await createLog.mutateAsync({
        notification_type: 'driver_form_sent',
        notification_title: 'Wysłano formularz kierowcy',
        action_description: `Formularz kierowcy dla umowy ${contractNumber}`,
        contract_id: contractId,
        contract_number: contractNumber,
        metadata: { action: 'copy_driver_form', link: driverFormLink }
      });

      toast({
        title: "Link skopiowany i wysłany",
        description: "Link do formularza kierowcy został skopiowany i wysłany",
      });

      // Mark as completed in checklist
      setChecklist((prev) => ({ ...prev, driverForm: true }));
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
      <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-b">
          <CardTitle className="text-lg">Akcje umowy</CardTitle>
          <CardDescription className="text-xs">Nr umowy: {contractNumber}</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Checklist */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Lista zadań</h3>
            <TooltipProvider>
              <div className="space-y-2">
                {/* Formularz dla kierowców */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={`flex items-center gap-3 p-3 rounded-lg transition-all cursor-help ${
                      checklist.driverForm 
                        ? 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800' 
                        : 'bg-muted/30 border border-border'
                    }`}>
                      <div className={`flex items-center justify-center w-5 h-5 rounded-full border-2 transition-all ${
                        checklist.driverForm 
                          ? 'bg-green-600 border-green-600' 
                          : 'border-muted-foreground/30'
                      }`}>
                        {checklist.driverForm && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <span className={`text-sm ${checklist.driverForm ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        Formularz dla kierowców
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Zaznacza się automatycznie po wysłaniu formularza kierowcy</p>
                  </TooltipContent>
                </Tooltip>

                {/* Wysłanie do weryfikacji */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={`flex items-center gap-3 p-3 rounded-lg transition-all cursor-help ${
                      checklist.verification 
                        ? 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800' 
                        : 'bg-muted/30 border border-border'
                    }`}>
                      <div className={`flex items-center justify-center w-5 h-5 rounded-full border-2 transition-all ${
                        checklist.verification 
                          ? 'bg-green-600 border-green-600' 
                          : 'border-muted-foreground/30'
                      }`}>
                        {checklist.verification && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <span className={`text-sm ${checklist.verification ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        Wysłanie do weryfikacji
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Zaznacza się automatycznie po wysłaniu do weryfikacji</p>
                  </TooltipContent>
                </Tooltip>

                {/* Wygenerowanie umowy */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={`flex items-center gap-3 p-3 rounded-lg transition-all cursor-help ${
                      checklist.generated 
                        ? 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800' 
                        : 'bg-muted/30 border border-border'
                    }`}>
                      <div className={`flex items-center justify-center w-5 h-5 rounded-full border-2 transition-all ${
                        checklist.generated 
                          ? 'bg-green-600 border-green-600' 
                          : 'border-muted-foreground/30'
                      }`}>
                        {checklist.generated && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <span className={`text-sm ${checklist.generated ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        Wygenerowanie umowy
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Zaznacza się automatycznie po wygenerowaniu umowy</p>
                  </TooltipContent>
                </Tooltip>

                {/* Wysłanie umowy */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={`flex items-center gap-3 p-3 rounded-lg transition-all cursor-help ${
                      checklist.sent 
                        ? 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800' 
                        : 'bg-muted/30 border border-border'
                    }`}>
                      <div className={`flex items-center justify-center w-5 h-5 rounded-full border-2 transition-all ${
                        checklist.sent 
                          ? 'bg-green-600 border-green-600' 
                          : 'border-muted-foreground/30'
                      }`}>
                        {checklist.sent && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <span className={`text-sm ${checklist.sent ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        Wysłanie umowy
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Zaznacza się automatycznie po wysłaniu umowy do klienta</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 justify-center pt-4 border-t">
            {/* Generuj umowę */}
            <Button 
              onClick={handleGenerateContract}
              disabled={upsertDocument.isPending}
              size="sm"
              className="group relative bg-blue-600 hover:bg-blue-700 text-white overflow-hidden transition-all duration-300 ease-in-out w-12 hover:w-auto px-3 hover:px-4 shadow-md hover:shadow-lg"
            >
              <FileText className="h-4 w-4 flex-shrink-0" />
              <span className="max-w-0 group-hover:max-w-xs overflow-hidden transition-all duration-300 ease-in-out group-hover:ml-2 whitespace-nowrap">
                Generuj umowę
              </span>
            </Button>

            {/* Wyślij do klienta */}
            <Button 
              onClick={handleSendToClient}
              disabled={upsertDocument.isPending || !clientEmail}
              size="sm"
              className="group relative bg-background hover:bg-muted border-2 border-input hover:border-primary/50 overflow-hidden transition-all duration-300 ease-in-out w-12 hover:w-auto px-3 hover:px-4 shadow-md hover:shadow-lg"
            >
              <Send className="h-4 w-4 flex-shrink-0 text-foreground" />
              <span className="max-w-0 group-hover:max-w-xs overflow-hidden transition-all duration-300 ease-in-out group-hover:ml-2 whitespace-nowrap text-foreground">
                Wyślij do klienta
              </span>
            </Button>

            {/* Formularz kierowcy */}
            <Button 
              onClick={handleCopyDriverForm}
              size="sm"
              className="group relative bg-purple-600 hover:bg-purple-700 text-white overflow-hidden transition-all duration-300 ease-in-out w-12 hover:w-auto px-3 hover:px-4 shadow-md hover:shadow-lg"
            >
              <UserPlus className="h-4 w-4 flex-shrink-0" />
              <span className="max-w-0 group-hover:max-w-xs overflow-hidden transition-all duration-300 ease-in-out group-hover:ml-2 whitespace-nowrap">
                Formularz kierowcy
              </span>
            </Button>

            {/* Wyślij do weryfikacji */}
            <Button 
              onClick={handleSendVerification}
              size="sm"
              className="group relative bg-orange-500 hover:bg-orange-600 text-white overflow-hidden transition-all duration-300 ease-in-out w-12 hover:w-auto px-3 hover:px-4 shadow-md hover:shadow-lg"
            >
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              <span className="max-w-0 group-hover:max-w-xs overflow-hidden transition-all duration-300 ease-in-out group-hover:ml-2 whitespace-nowrap">
                Wyślij do weryfikacji
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>

    </>
  );
};
