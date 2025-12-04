import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { FileText, Send, CheckCircle, UserPlus, Check, Receipt, Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useUpsertContractDocument } from "@/hooks/useContractDocuments";
import { useContract } from "@/hooks/useContracts";
import { downloadProforma, ProformaPaymentType } from "@/services/proformaService";
import { PROFORMA_PAYMENT_LABELS } from "@/config/companyData";

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

  // Proforma dialog state
  const [proformaDialogOpen, setProformaDialogOpen] = useState(false);
  const [selectedProformaType, setSelectedProformaType] = useState<ProformaPaymentType>('reservation');
  const [isGeneratingProforma, setIsGeneratingProforma] = useState(false);

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

  const handleCopyDriverFormEN = async () => {
    if (!contractId || !contractNumber) {
      toast({
        title: "Błąd",
        description: "Brak danych umowy. Poczekaj na załadowanie.",
        variant: "destructive",
      });
      return;
    }

    const driverFormLinkEN = `https://app.kokokamper.pl/driver-form-en/${encodeURIComponent(contractNumber)}`;
    navigator.clipboard.writeText(driverFormLinkEN);
    
    try {
      await fetch('https://hook.eu2.make.com/u73t37l3xvdm4dkwrxfftl8yxvuku7op', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contract_id: contractId,
          contract_number: contractNumber,
          driver_form_link: driverFormLinkEN,
          number_of_travelers: contract?.number_of_travelers || null,
          language: 'en'
        }),
      });

      toast({
        title: "Link skopiowany i wysłany",
        description: "Link do angielskiego formularza kierowcy został skopiowany i wysłany",
      });
    } catch (error) {
      toast({
        title: "Link skopiowany",
        description: "Link został skopiowany, ale nie udało się wysłać do systemu",
        variant: "destructive",
      });
    }
  };

  const getProformaAmount = (type: ProformaPaymentType): number => {
    if (!contract?.payments) return 0;
    const payments = contract.payments as any;
    
    const parseAmount = (value: any): number => {
      if (value === null || value === undefined) return 0;
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        const numericValue = value.replace(/[^\d.]/g, '');
        return parseFloat(numericValue) || 0;
      }
      return 0;
    };

    switch (type) {
      case 'reservation':
        return parseAmount(payments.rezerwacyjna?.wysokosc);
      case 'main_payment':
        return parseAmount(payments.zasadnicza?.wysokosc);
      case 'deposit':
        return parseAmount(payments.kaucja?.wysokosc);
      case 'final':
        return parseAmount(payments.kaucja?.wysokosc);
      default:
        return 0;
    }
  };

  const handleGenerateProforma = async () => {
    if (!contract) {
      toast({
        title: "Błąd",
        description: "Nie znaleziono danych umowy",
        variant: "destructive",
      });
      return;
    }

    const amount = getProformaAmount(selectedProformaType);
    if (amount <= 0) {
      toast({
        title: "Błąd",
        description: "Brak kwoty dla wybranego typu płatności",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingProforma(true);
    try {
      await downloadProforma({
        contractNumber: contract.contract_number,
        contractId: contract.id,
        paymentType: selectedProformaType,
        amount,
        vehicleModel: contract.vehicle_model,
        startDate: contract.start_date,
        endDate: contract.end_date,
        client: {
          name: contract.tenant_company_name || contract.tenant_name || 'Klient',
          address: contract.tenant_address || undefined,
          nip: contract.tenant_nip || undefined,
          email: contract.tenant_email || undefined,
        },
      });

      toast({
        title: "Sukces",
        description: "Proforma została wygenerowana i pobrana",
      });
      setProformaDialogOpen(false);
    } catch (error) {
      console.error('Error generating proforma:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się wygenerować proformy",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingProforma(false);
    }
  };

  return (
    <>
      <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 h-full">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-b">
          <CardTitle className="text-lg font-semibold">Akcje umowy</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">Nr umowy: {contractNumber}</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6 flex flex-col h-[calc(100%-5rem)]">
          {/* Checklist */}
          <div className="space-y-3 flex-1">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Lista zadań</h3>
            <TooltipProvider>
              <div className="space-y-2.5">{/* Formularz dla kierowców */}
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
          <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t mt-auto">
            {/* Row 1: Main actions */}
            <div className="flex gap-2 flex-1">
              <Button 
                onClick={handleGenerateContract}
                disabled={upsertDocument.isPending}
                size="sm"
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <FileText className="h-4 w-4 mr-2" />
                <span className="whitespace-nowrap text-xs sm:text-sm">Generuj</span>
              </Button>

              <Button 
                onClick={handleSendToClient}
                disabled={upsertDocument.isPending || !clientEmail}
                size="sm"
                className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <Send className="h-4 w-4 mr-2" />
                <span className="whitespace-nowrap text-xs sm:text-sm">Wyślij</span>
              </Button>
            </div>

            {/* Row 2: Forms */}
            <div className="flex gap-2 flex-1">
              <Button 
                onClick={handleCopyDriverForm}
                size="sm"
                className="flex-1 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                <span className="whitespace-nowrap text-xs sm:text-sm">PL</span>
              </Button>

              <Button 
                onClick={handleCopyDriverFormEN}
                size="sm"
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                <span className="whitespace-nowrap text-xs sm:text-sm">EN</span>
              </Button>

              <Button 
                onClick={handleSendVerification}
                size="sm"
                className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                <span className="whitespace-nowrap text-xs sm:text-sm">Weryfikacja</span>
              </Button>
            </div>

            {/* Row 3: Proforma */}
            <div className="flex gap-2 flex-1">
              <Button 
                onClick={() => setProformaDialogOpen(true)}
                size="sm"
                className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <Receipt className="h-4 w-4 mr-2" />
                <span className="whitespace-nowrap text-xs sm:text-sm">Proforma</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Proforma Dialog */}
      <Dialog open={proformaDialogOpen} onOpenChange={setProformaDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Generuj Proformę</DialogTitle>
            <DialogDescription>
              Wybierz typ płatności dla proformy
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <RadioGroup
              value={selectedProformaType}
              onValueChange={(value) => setSelectedProformaType(value as ProformaPaymentType)}
              className="space-y-3"
            >
              {(['reservation', 'main_payment', 'deposit'] as ProformaPaymentType[]).map((type) => {
                const amount = getProformaAmount(type);
                const isDisabled = amount <= 0;
                return (
                  <div key={type} className={`flex items-center space-x-3 p-3 rounded-lg border ${isDisabled ? 'opacity-50' : 'hover:bg-muted/50'}`}>
                    <RadioGroupItem value={type} id={type} disabled={isDisabled} />
                    <Label htmlFor={type} className={`flex-1 cursor-pointer ${isDisabled ? 'cursor-not-allowed' : ''}`}>
                      <div className="flex justify-between items-center">
                        <span>{PROFORMA_PAYMENT_LABELS[type]}</span>
                        <span className="font-semibold">
                          {amount > 0 ? `${amount.toFixed(2)} PLN` : 'Brak kwoty'}
                        </span>
                      </div>
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setProformaDialogOpen(false)}>
              Anuluj
            </Button>
            <Button 
              onClick={handleGenerateProforma}
              disabled={isGeneratingProforma || getProformaAmount(selectedProformaType) <= 0}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isGeneratingProforma ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generowanie...
                </>
              ) : (
                <>
                  <Receipt className="h-4 w-4 mr-2" />
                  Pobierz Proformę
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
