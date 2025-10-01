import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, FileText, User, Car, CreditCard, AlertCircle, Edit2, Save, X, Link2, ClipboardCopy, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useContract } from "@/hooks/useContracts";
import { format } from "date-fns";

const statusConfig = {
  active: { label: "Aktywna", className: "bg-primary/10 text-primary border-primary/20" },
  pending: { label: "Oczekująca", className: "bg-secondary/10 text-secondary border-secondary/20" },
  completed: { label: "Zakończona", className: "bg-muted text-muted-foreground border-muted" },
  cancelled: { label: "Anulowana", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

const ContractDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContract, setEditedContract] = useState<any>(null);
  
  const { data: contract, isLoading } = useContract(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
            <h1 className="text-4xl font-bold text-foreground">Umowa {contract.contract_number}</h1>
            <Badge variant="outline" className={statusConfig[contract.status as keyof typeof statusConfig].className}>
              {statusConfig[contract.status as keyof typeof statusConfig].label}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-2">Szczegóły umowy najmu</p>
        </div>
      </div>

      {/* Informacje o kliencie */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Klient
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Imię i nazwisko</Label>
              <p className="font-medium text-foreground">{contract.client?.name || 'N/A'}</p>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <p className="font-medium text-foreground">{contract.client?.email || 'N/A'}</p>
            </div>
            <div className="space-y-2">
              <Label>Telefon</Label>
              <p className="font-medium text-foreground">{contract.client?.phone || 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Okres najmu */}
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
              <p className="font-medium text-foreground">
                {contract.start_date ? format(new Date(contract.start_date), 'dd.MM.yyyy HH:mm') : 'N/A'}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Data zakończenia</Label>
              <p className="font-medium text-foreground">
                {contract.end_date ? format(new Date(contract.end_date), 'dd.MM.yyyy HH:mm') : 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Przedmiot najmu */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Przedmiot najmu
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Model</Label>
              <p className="font-medium text-foreground">{contract.vehicle_model}</p>
            </div>
            <div className="space-y-2">
              <Label>Nr rejestracyjny</Label>
              <p className="font-medium text-foreground">{contract.registration_number}</p>
            </div>
            {contract.value && (
              <div className="space-y-2">
                <Label>Wartość umowy</Label>
                <p className="font-medium text-foreground">{contract.value} zł</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Linki szybkiego dostępu */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Dokumenty
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button 
            variant="outline" 
            className="w-full justify-start gap-2"
            onClick={() => navigate(`/vehicle-handover?contractId=${id}`)}
          >
            <FileText className="h-4 w-4" />
            Protokół wydania pojazdu
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start gap-2"
            onClick={() => navigate(`/vehicle-return?contractId=${id}`)}
          >
            <FileText className="h-4 w-4" />
            Protokół zwrotu pojazdu
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};


export default ContractDetails;
