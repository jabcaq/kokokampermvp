import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Send, CheckCircle } from "lucide-react";
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Akcje umowy</CardTitle>
        <CardDescription>Nr umowy: {contractNumber}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        <Button 
          onClick={handleGenerateContract}
          disabled={addDocument.isPending}
        >
          <FileText className="h-4 w-4 mr-2" />
          Generuj umowę
        </Button>
        <Button 
          onClick={handleSendToClient}
          variant="outline"
          disabled={addDocument.isPending || !clientEmail}
        >
          <Send className="h-4 w-4 mr-2" />
          Wyślij do klienta
        </Button>
        <Button 
          onClick={handleSendVerification}
          variant="secondary"
          disabled={addDocument.isPending}
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Wyślij do weryfikacji
        </Button>
      </CardContent>
    </Card>
  );
};
