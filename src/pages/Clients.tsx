import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Mail, Phone, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useClients, useAddClient } from "@/hooks/useClients";
import { useToast } from "@/hooks/use-toast";

const Clients = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  
  const { data: clients = [], isLoading } = useClients();
  const addClientMutation = useAddClient();

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddClient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      await addClientMutation.mutateAsync({
        name: formData.get("name") as string,
        email: formData.get("email") as string,
        phone: formData.get("phone") as string,
      });
      
      toast({
        title: "Sukces",
        description: "Klient został dodany pomyślnie.",
      });
      
      setIsDialogOpen(false);
      e.currentTarget.reset();
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się dodać klienta.",
        variant: "destructive",
      });
    }
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

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredClients.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">Nie znaleziono klientów</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((client) => (
            <Card
              key={client.id}
              className="transition-all hover:shadow-lg hover:-translate-y-1 duration-300 cursor-pointer"
              onClick={() => navigate(`/clients/${client.id}`)}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{client.name}</span>
                  <span className="text-sm font-normal bg-primary/10 text-primary px-3 py-1 rounded-full">
                    {client.contracts_count} umów
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{client.email}</span>
                </div>
                {client.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{client.phone}</span>
                  </div>
                )}
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/clients/${client.id}`);
                  }}
                >
                  Zobacz szczegóły
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Clients;
