import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Mail, Phone } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  contractsCount: number;
}

const initialClients: Client[] = [
  { id: 1, name: "Jan Kowalski", email: "jan.kowalski@email.com", phone: "+48 500 123 456", contractsCount: 3 },
  { id: 2, name: "Anna Nowak", email: "anna.nowak@email.com", phone: "+48 600 234 567", contractsCount: 2 },
  { id: 3, name: "Piotr Wiśniewski", email: "piotr.wisniewski@email.com", phone: "+48 700 345 678", contractsCount: 1 },
  { id: 4, name: "Maria Wójcik", email: "maria.wojcik@email.com", phone: "+48 800 456 789", contractsCount: 4 },
];

const Clients = () => {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddClient = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newClient: Client = {
      id: clients.length + 1,
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      contractsCount: 0,
    };
    setClients([...clients, newClient]);
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Klienci</h1>
          <p className="text-muted-foreground">Zarządzaj bazą klientów</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-md">
              <Plus className="h-4 w-4" />
              Dodaj klienta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dodaj nowego klienta</DialogTitle>
              <DialogDescription>
                Wypełnij formularz, aby dodać klienta do systemu
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddClient} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Imię i nazwisko</Label>
                <Input id="name" name="name" placeholder="Jan Kowalski" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="jan@example.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input id="phone" name="phone" placeholder="+48 500 123 456" required />
              </div>
              <Button type="submit" className="w-full">Dodaj klienta</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Szukaj klientów..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredClients.map((client) => (
          <Card
            key={client.id}
            className="transition-all hover:shadow-lg hover:-translate-y-1 duration-300 cursor-pointer"
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{client.name}</span>
                <span className="text-sm font-normal bg-primary/10 text-primary px-3 py-1 rounded-full">
                  {client.contractsCount} umów
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span className="truncate">{client.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{client.phone}</span>
              </div>
              <Button variant="outline" className="w-full mt-4">
                Zobacz szczegóły
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Clients;
