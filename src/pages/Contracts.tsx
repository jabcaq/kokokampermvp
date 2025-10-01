import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Calendar, Edit, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

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
        <Button className="gap-2 shadow-md">
          <Plus className="h-4 w-4" />
          Nowa umowa
        </Button>
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
