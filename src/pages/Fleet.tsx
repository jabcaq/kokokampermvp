import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Truck, Caravan, Plus, Search, Calendar, MapPin, Trash2 } from "lucide-react";
import { toast } from "sonner";
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

type VehicleType = "kamper" | "przyczepa";
type VehicleStatus = "dostepny" | "wynajety" | "serwis";

interface Vehicle {
  id: string;
  name: string;
  type: VehicleType;
  brand: string;
  model: string;
  year: number;
  registrationNumber: string;
  status: VehicleStatus;
  location: string;
}

const mockVehicles: Vehicle[] = [
  {
    id: "1",
    name: "Kamper XYZ",
    type: "kamper",
    brand: "Fiat",
    model: "Ducato Roller Team",
    year: 2022,
    registrationNumber: "WW 12345",
    status: "dostepny",
    location: "Warszawa",
  },
  {
    id: "2",
    name: "Przyczepa ABC",
    type: "przyczepa",
    brand: "Niewiadów",
    model: "N126E",
    year: 2021,
    registrationNumber: "KR 67890",
    status: "wynajety",
    location: "Kraków",
  },
  {
    id: "3",
    name: "Kamper 123",
    type: "kamper",
    brand: "Mercedes",
    model: "Sprinter Hymer",
    year: 2023,
    registrationNumber: "GD 11223",
    status: "dostepny",
    location: "Gdańsk",
  },
  {
    id: "4",
    name: "Przyczepa Mini",
    type: "przyczepa",
    brand: "Knaus",
    model: "Sport 400",
    year: 2020,
    registrationNumber: "PO 33445",
    status: "serwis",
    location: "Poznań",
  },
];

const Fleet = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>(mockVehicles);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | VehicleType>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | VehicleStatus>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteVehicleId, setDeleteVehicleId] = useState<string | null>(null);
  const [newVehicle, setNewVehicle] = useState({
    name: "",
    type: "kamper" as VehicleType,
    brand: "",
    model: "",
    year: new Date().getFullYear(),
    registrationNumber: "",
    location: "",
  });

  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    const vehicle: Vehicle = {
      id: (vehicles.length + 1).toString(),
      ...newVehicle,
      status: "dostepny",
    };
    setVehicles([...vehicles, vehicle]);
    setIsDialogOpen(false);
    toast.success("Pojazd dodany do floty!", {
      description: `${vehicle.brand} ${vehicle.model}`,
    });
    setNewVehicle({
      name: "",
      type: "kamper",
      brand: "",
      model: "",
      year: new Date().getFullYear(),
      registrationNumber: "",
      location: "",
    });
  };

  const handleDeleteVehicle = (id: string) => {
    setVehicles(vehicles.filter(v => v.id !== id));
    toast.success("Pojazd usunięty z floty!");
    setDeleteVehicleId(null);
  };

  const getStatusBadge = (status: VehicleStatus) => {
    const variants: Record<VehicleStatus, { label: string; className: string }> = {
      dostepny: { label: "Dostępny", className: "bg-primary/10 text-primary" },
      wynajety: { label: "Wynajęty", className: "bg-secondary/10 text-secondary" },
      serwis: { label: "Serwis", className: "bg-destructive/10 text-destructive" },
    };
    return variants[status];
  };

  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch =
      vehicle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || vehicle.type === filterType;
    const matchesStatus = filterStatus === "all" || vehicle.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const stats = {
    total: vehicles.length,
    kampers: vehicles.filter((v) => v.type === "kamper").length,
    trailers: vehicles.filter((v) => v.type === "przyczepa").length,
    available: vehicles.filter((v) => v.status === "dostepny").length,
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Flota pojazdów</h1>
          <p className="text-muted-foreground">Zarządzanie kamperami i przyczepami</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-md">
              <Plus className="h-4 w-4" />
              Dodaj pojazd
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Dodaj nowy pojazd</DialogTitle>
              <DialogDescription>
                Wprowadź dane pojazdu do systemu zarządzania flotą
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddVehicle} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nazwa pojazdu *</Label>
                  <Input
                    id="name"
                    value={newVehicle.name}
                    onChange={(e) => setNewVehicle({ ...newVehicle, name: e.target.value })}
                    placeholder="np. Kamper XYZ"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Typ pojazdu *</Label>
                  <Select
                    value={newVehicle.type}
                    onValueChange={(value: VehicleType) =>
                      setNewVehicle({ ...newVehicle, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kamper">Kamper</SelectItem>
                      <SelectItem value="przyczepa">Przyczepa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="brand">Marka *</Label>
                  <Input
                    id="brand"
                    value={newVehicle.brand}
                    onChange={(e) => setNewVehicle({ ...newVehicle, brand: e.target.value })}
                    placeholder="np. Fiat"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model *</Label>
                  <Input
                    id="model"
                    value={newVehicle.model}
                    onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                    placeholder="np. Ducato Roller Team"
                    required
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="year">Rok produkcji *</Label>
                  <Input
                    id="year"
                    type="number"
                    value={newVehicle.year}
                    onChange={(e) =>
                      setNewVehicle({ ...newVehicle, year: parseInt(e.target.value) })
                    }
                    min="1990"
                    max={new Date().getFullYear() + 1}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registrationNumber">Numer rejestracyjny *</Label>
                  <Input
                    id="registrationNumber"
                    value={newVehicle.registrationNumber}
                    onChange={(e) =>
                      setNewVehicle({ ...newVehicle, registrationNumber: e.target.value })
                    }
                    placeholder="np. WW 12345"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Lokalizacja *</Label>
                <Input
                  id="location"
                  value={newVehicle.location}
                  onChange={(e) => setNewVehicle({ ...newVehicle, location: e.target.value })}
                  placeholder="np. Warszawa"
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Dodaj pojazd do floty
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Łączna liczba pojazdów
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Kampery
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.kampers}</div>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Caravan className="h-4 w-4" />
              Przyczepy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.trailers}</div>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Dostępne
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stats.available}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Filtry i wyszukiwanie</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Szukaj po nazwie, marce, modelu lub numerze rejestracyjnym..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Typ pojazdu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie typy</SelectItem>
                <SelectItem value="kamper">Kampery</SelectItem>
                <SelectItem value="przyczepa">Przyczepy</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie statusy</SelectItem>
                <SelectItem value="dostepny">Dostępne</SelectItem>
                <SelectItem value="wynajety">Wynajęte</SelectItem>
                <SelectItem value="serwis">W serwisie</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredVehicles.map((vehicle) => (
          <Card key={vehicle.id} className="shadow-md hover-scale">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-gradient-primary flex items-center justify-center">
                    {vehicle.type === "kamper" ? (
                      <Truck className="h-6 w-6 text-primary-foreground" />
                    ) : (
                      <Caravan className="h-6 w-6 text-primary-foreground" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{vehicle.name}</CardTitle>
                    <CardDescription className="text-xs mt-1">
                      {vehicle.registrationNumber}
                    </CardDescription>
                  </div>
                </div>
                <Badge className={getStatusBadge(vehicle.status).className}>
                  {getStatusBadge(vehicle.status).label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Marka i model:</span>
                  <span className="font-medium text-foreground">
                    {vehicle.brand} {vehicle.model}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Rok produkcji:
                  </span>
                  <span className="font-medium text-foreground">{vehicle.year}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Lokalizacja:
                  </span>
                  <span className="font-medium text-foreground">{vehicle.location}</span>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => navigate(`/fleet/${vehicle.id}`)}
              >
                Szczegóły pojazdu
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="w-full mt-2"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteVehicleId(vehicle.id);
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Usuń pojazd
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredVehicles.length === 0 && (
        <Card className="shadow-md">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Nie znaleziono pojazdów spełniających kryteria wyszukiwania
            </p>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={!!deleteVehicleId} onOpenChange={() => setDeleteVehicleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Czy na pewno chcesz usunąć ten pojazd?</AlertDialogTitle>
            <AlertDialogDescription>
              Ta operacja jest nieodwracalna. Wszystkie dane pojazdu zostaną trwale usunięte.
              Upewnij się, że pojazd nie ma aktywnych wynajmów.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteVehicleId && handleDeleteVehicle(deleteVehicleId)}
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

export default Fleet;
