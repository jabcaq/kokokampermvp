import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Send, CheckCircle, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAddContractDocument } from "@/hooks/useContractDocuments";

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

  const handleSendVerification = async () => {
    try {
      await addDocument.mutateAsync({
        contract_id: contractId,
        document_type: 'verification',
        status: 'sent',
        generated_at: new Date().toISOString(),
        sent_at: new Date().toISOString(),
        sent_to_email: null,
        file_url: null,
      });
      
      toast({
        title: "Sukces",
        description: "Wysłano do weryfikacji",
      });
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się wysłać do weryfikacji",
        variant: "destructive",
      });
    }
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
  );
};
