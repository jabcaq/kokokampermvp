import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, Car, TrendingUp, Eye } from "lucide-react";
import { useClients } from "@/hooks/useClients";
import { useContracts } from "@/hooks/useContracts";
import { useVehicles } from "@/hooks/useVehicles";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  const { data: clients, isLoading: clientsLoading } = useClients();
  const { data: contracts, isLoading: contractsLoading } = useContracts();
  const { data: vehicles, isLoading: vehiclesLoading } = useVehicles();

  const isLoading = clientsLoading || contractsLoading || vehiclesLoading;

  const activeContracts = contracts?.filter(c => c.status === 'active') || [];
  const totalRevenue = activeContracts.reduce((sum, c) => sum + (Number(c.value) || 0), 0);
  const recentContracts = contracts?.slice(0, 4) || [];

  const stats = [
    {
      title: "Aktywni klienci",
      value: clients?.length.toString() || "0",
      icon: Users,
    },
    {
      title: "Aktywne umowy",
      value: activeContracts.length.toString(),
      icon: FileText,
    },
    {
      title: "Flota pojazdów",
      value: vehicles?.length.toString() || "0",
      icon: Car,
    },
    {
      title: "Przychód miesiąc",
      value: `${totalRevenue.toLocaleString('pl-PL')} zł`,
      icon: TrendingUp,
    },
  ];
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Witaj ponownie! Oto przegląd Twojego biznesu.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={index}
              className="transition-all hover:shadow-lg hover:-translate-y-1 duration-300"
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className="p-2 bg-gradient-primary rounded-lg">
                  <Icon className="h-4 w-4 text-primary-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-9 w-20" />
                ) : (
                  <div className="text-3xl font-bold">{stat.value}</div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Contracts */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Ostatnie umowy</CardTitle>
          <CardDescription>Przegląd najnowszych rezerwacji</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : recentContracts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Brak umów</p>
          ) : (
            <div className="space-y-4">
              {recentContracts.map((contract) => (
                <div
                  key={contract.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">
                      {contract.client?.name || contract.tenant_name || 'Brak nazwy'}
                    </p>
                    <p className="text-sm text-muted-foreground">{contract.vehicle_model}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {format(new Date(contract.start_date), 'dd MMM yyyy', { locale: pl })}
                      </p>
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          contract.status === "active"
                            ? "bg-primary/10 text-primary"
                            : contract.status === "pending"
                            ? "bg-secondary/10 text-secondary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {contract.status === "active" ? "Aktywna" : 
                         contract.status === "pending" ? "Oczekująca" :
                         contract.status === "completed" ? "Zakończona" : "Anulowana"}
                      </span>
                    </div>
                    {contract.client_id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/clients/${contract.client_id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Podgląd
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
