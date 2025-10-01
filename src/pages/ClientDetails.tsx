import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mail, Phone, FileText, Calendar, MapPin, Loader2, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useClient, useDeleteClient } from "@/hooks/useClients";
import { useContractsByClient } from "@/hooks/useContracts";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

const ClientDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const { data: client, isLoading: clientLoading } = useClient(id);
  const { data: contracts = [], isLoading: contractsLoading } = useContractsByClient(id);
  const deleteClientMutation = useDeleteClient();

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive"; label: string }> = {
      active: { variant: "default", label: "Aktywna" },
      completed: { variant: "secondary", label: "Zakończona" },
      cancelled: { variant: "destructive", label: "Anulowana" },
      pending: { variant: "secondary", label: "Oczekująca" },
    };
    const config = variants[status] || variants.active;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleDeleteClient = async () => {
    if (!id) return;
    
    try {
      await deleteClientMutation.mutateAsync(id);
      toast({
        title: "Sukces",
        description: "Klient został usunięty.",
      });
      navigate("/clients");
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się usunąć klienta. Sprawdź czy nie ma przypisanych umów.",
        variant: "destructive",
      });
    }
  };

  if (clientLoading || contractsLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Button variant="ghost" size="icon" onClick={() => navigate("/clients")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Nie znaleziono klienta</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeContracts = contracts.filter(c => c.status === 'active').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/clients")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              {client.name}
            </h1>
            <p className="text-muted-foreground mt-1">Szczegóły klienta</p>
          </div>
        </div>
        <Button
          variant="destructive"
          onClick={() => setShowDeleteDialog(true)}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Usuń klienta
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informacje kontaktowe */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Informacje kontaktowe
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{client.email}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Telefon</p>
              <p className="font-medium">{client.phone || 'Brak danych'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Statystyki */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Statystyki
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Data dołączenia
              </p>
              <p className="font-medium">
                {client.created_at ? format(new Date(client.created_at), 'dd.MM.yyyy') : 'Brak danych'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="bg-gradient-subtle rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-primary">{contracts.length}</p>
                <p className="text-sm text-muted-foreground mt-1">Wszystkie umowy</p>
              </div>
              <div className="bg-gradient-subtle rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-secondary">{activeContracts}</p>
                <p className="text-sm text-muted-foreground mt-1">Aktywne umowy</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista umów */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Historia umów
            </span>
            <Button onClick={() => navigate("/contracts")}>
              Dodaj nową umowę
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {contracts.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">Brak umów dla tego klienta</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numer umowy</TableHead>
                  <TableHead>Pojazd</TableHead>
                  <TableHead>Data rozpoczęcia</TableHead>
                  <TableHead>Data zakończenia</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Kwota</TableHead>
                  <TableHead>Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell className="font-medium">{contract.contract_number}</TableCell>
                    <TableCell>{contract.vehicle_model}</TableCell>
                    <TableCell>{format(new Date(contract.start_date), 'dd.MM.yyyy')}</TableCell>
                    <TableCell>{format(new Date(contract.end_date), 'dd.MM.yyyy')}</TableCell>
                    <TableCell>{getStatusBadge(contract.status)}</TableCell>
                    <TableCell className="font-medium">
                      {contract.value ? `${contract.value.toFixed(2)} zł` : 'Brak danych'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/contracts/${contract.id}`)}
                      >
                        Zobacz
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Czy na pewno chcesz usunąć tego klienta?</AlertDialogTitle>
            <AlertDialogDescription>
              Ta operacja jest nieodwracalna. Wszystkie dane klienta zostaną trwale usunięte.
              Upewnij się, że klient nie ma aktywnych umów.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteClient}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ClientDetails;
