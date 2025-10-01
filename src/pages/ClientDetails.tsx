import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mail, Phone, FileText, Calendar, MapPin } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  joinDate: string;
  totalContracts: number;
  activeContracts: number;
}

interface Contract {
  id: number;
  contractNumber: string;
  vehicle: string;
  startDate: string;
  endDate: string;
  status: "active" | "completed" | "cancelled";
  totalAmount: string;
}

const mockClient: Client = {
  id: 1,
  name: "Jan Kowalski",
  email: "jan.kowalski@email.com",
  phone: "+48 500 123 456",
  address: "ul. Przykładowa 123",
  city: "Warszawa",
  postalCode: "00-001",
  joinDate: "2023-05-15",
  totalContracts: 5,
  activeContracts: 2,
};

const mockContracts: Contract[] = [
  {
    id: 1,
    contractNumber: "CT-2024-001",
    vehicle: "Mercedes Sprinter 2023",
    startDate: "2024-01-10",
    endDate: "2024-01-20",
    status: "active",
    totalAmount: "3,500 PLN",
  },
  {
    id: 2,
    contractNumber: "CT-2024-002",
    vehicle: "Fiat Ducato 2022",
    startDate: "2024-02-05",
    endDate: "2024-02-12",
    status: "active",
    totalAmount: "2,800 PLN",
  },
  {
    id: 3,
    contractNumber: "CT-2023-045",
    vehicle: "VW California 2021",
    startDate: "2023-08-15",
    endDate: "2023-08-30",
    status: "completed",
    totalAmount: "4,200 PLN",
  },
  {
    id: 4,
    contractNumber: "CT-2023-032",
    vehicle: "Peugeot Boxer 2022",
    startDate: "2023-06-10",
    endDate: "2023-06-20",
    status: "completed",
    totalAmount: "3,100 PLN",
  },
];

const ClientDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive"; label: string }> = {
      active: { variant: "default", label: "Aktywna" },
      completed: { variant: "secondary", label: "Zakończona" },
      cancelled: { variant: "destructive", label: "Anulowana" },
    };
    const config = variants[status] || variants.active;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/clients")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            {mockClient.name}
          </h1>
          <p className="text-muted-foreground mt-1">Szczegóły klienta</p>
        </div>
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
              <p className="font-medium">{mockClient.email}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Telefon</p>
              <p className="font-medium">{mockClient.phone}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Adres
              </p>
              <p className="font-medium">{mockClient.address}</p>
              <p className="font-medium">
                {mockClient.postalCode} {mockClient.city}
              </p>
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
              <p className="font-medium">{mockClient.joinDate}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="bg-gradient-subtle rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-primary">{mockClient.totalContracts}</p>
                <p className="text-sm text-muted-foreground mt-1">Wszystkie umowy</p>
              </div>
              <div className="bg-gradient-subtle rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-secondary">{mockClient.activeContracts}</p>
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
              {mockContracts.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell className="font-medium">{contract.contractNumber}</TableCell>
                  <TableCell>{contract.vehicle}</TableCell>
                  <TableCell>{contract.startDate}</TableCell>
                  <TableCell>{contract.endDate}</TableCell>
                  <TableCell>{getStatusBadge(contract.status)}</TableCell>
                  <TableCell className="font-medium">{contract.totalAmount}</TableCell>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientDetails;
