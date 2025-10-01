import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, Car, TrendingUp } from "lucide-react";

const stats = [
  {
    title: "Aktywni klienci",
    value: "127",
    change: "+12%",
    icon: Users,
    color: "primary",
  },
  {
    title: "Aktywne umowy",
    value: "45",
    change: "+8%",
    icon: FileText,
    color: "secondary",
  },
  {
    title: "Flota pojazdów",
    value: "23",
    change: "+2",
    icon: Car,
    color: "accent",
  },
  {
    title: "Przychód miesiąc",
    value: "87,500 zł",
    change: "+23%",
    icon: TrendingUp,
    color: "primary",
  },
];

const recentContracts = [
  { id: 1, client: "Jan Kowalski", vehicle: "Kamper XL-450", startDate: "2024-03-15", status: "active" },
  { id: 2, client: "Anna Nowak", vehicle: "Przyczepa Camp-200", startDate: "2024-03-14", status: "active" },
  { id: 3, client: "Piotr Wiśniewski", vehicle: "Kamper Comfort-300", startDate: "2024-03-13", status: "pending" },
  { id: 4, client: "Maria Wójcik", vehicle: "Kamper Family-500", startDate: "2024-03-12", status: "active" },
];

const Dashboard = () => {
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
                <div className="text-3xl font-bold">{stat.value}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  <span className="text-primary font-medium">{stat.change}</span> vs. poprzedni miesiąc
                </p>
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
          <div className="space-y-4">
            {recentContracts.map((contract) => (
              <div
                key={contract.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{contract.client}</p>
                  <p className="text-sm text-muted-foreground">{contract.vehicle}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">{contract.startDate}</p>
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        contract.status === "active"
                          ? "bg-primary/10 text-primary"
                          : "bg-secondary/10 text-secondary"
                      }`}
                    >
                      {contract.status === "active" ? "Aktywna" : "Oczekująca"}
                    </span>
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

export default Dashboard;
