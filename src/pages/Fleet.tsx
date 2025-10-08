import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Truck, Caravan, Plus, Search, Calendar, MapPin, Trash2, Archive } from "lucide-react";
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
import { useVehicles, useAddVehicle, useUpdateVehicle, useDeleteVehicle } from "@/hooks/useVehicles";

type VehicleType = "Kamper" | "Przyczepa";
type VehicleStatus = "dostepny" | "wynajety" | "serwis";

const Fleet = () => {
  const navigate = useNavigate();
  const { data: vehicles, isLoading } = useVehicles();
  const addVehicleMutation = useAddVehicle();
  const updateVehicleMutation = useUpdateVehicle();
  const deleteVehicleMutation = useDeleteVehicle();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | VehicleType>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | VehicleStatus>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteVehicleId, setDeleteVehicleId] = useState<string | null>(null);
  const [archiveVehicleId, setArchiveVehicleId] = useState<string | null>(null);
  const [newVehicle, setNewVehicle] = useState({
    name: "",
    type: "Kamper" as VehicleType,
    brand: "",
    model: "",
    year: new Date().getFullYear(),
    registrationNumber: "",
    vin: "",
    location: "",
    trailerWeight: null as number | null,
  });

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addVehicleMutation.mutateAsync({
        name: newVehicle.name,
        type: newVehicle.type,
        brand: newVehicle.brand,
        model: newVehicle.model,
        year: newVehicle.year,
        registration_number: newVehicle.registrationNumber,
        vin: newVehicle.vin,
        location: newVehicle.location,
        status: "available",
        next_inspection_date: null,
        insurance_policy_number: null,
        insurance_valid_until: null,
        additional_info: null,
        trailer_weight: newVehicle.trailerWeight,
      } as any);
      setIsDialogOpen(false);
      toast.success("Pojazd dodany do floty!", {
        description: `${newVehicle.brand} ${newVehicle.model}`,
      });
      setNewVehicle({
        name: "",
        type: "Kamper",
        brand: "",
        model: "",
        year: new Date().getFullYear(),
        registrationNumber: "",
        vin: "",
        location: "",
        trailerWeight: null,
      });
    } catch (error) {
      toast.error("Błąd podczas dodawania pojazdu");
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    try {
      await deleteVehicleMutation.mutateAsync(id);
      toast.success("Pojazd usunięty z floty!");
      setDeleteVehicleId(null);
    } catch (error) {
      toast.error("Błąd podczas usuwania pojazdu");
    }
  };

  const handleArchiveVehicle = async (id: string) => {
    try {
      await updateVehicleMutation.mutateAsync({
        id,
        updates: { status: "archived" },
      });
      toast.success("Pojazd zarchiwizowany!");
      setArchiveVehicleId(null);
    } catch (error) {
      toast.error("Błąd podczas archiwizacji pojazdu");
    }
  };

  const mapStatus = (dbStatus: string): VehicleStatus => {
    switch (dbStatus) {
      case "available":
        return "dostepny";
      case "rented":
        return "wynajety";
      case "maintenance":
        return "serwis";
      default:
        return "dostepny";
    }
  };

  const getStatusBadge = (status: VehicleStatus) => {
    const variants: Record<VehicleStatus, { label: string; className: string }> = {
      dostepny: { label: "Dostępny", className: "bg-primary/10 text-primary" },
      wynajety: { label: "Wynajęty", className: "bg-secondary/10 text-secondary" },
      serwis: { label: "Serwis", className: "bg-destructive/10 text-destructive" },
    };
    return variants[status];
  };

  // Filter out archived vehicles and map to UI format
  const activeVehicles = (vehicles || [])
    .filter((v) => v.status !== "archived")
    .map((v) => ({
      ...v,
      name: v.name || v.model,
      registrationNumber: v.registration_number,
      uiStatus: mapStatus(v.status),
    }));

  const filteredVehicles = activeVehicles.filter((vehicle) => {
    const matchesSearch =
      (vehicle.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      (vehicle.brand?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      (vehicle.model?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      vehicle.registration_number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || vehicle.type === filterType;
    const matchesStatus = filterStatus === "all" || vehicle.uiStatus === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const stats = {
    total: activeVehicles.length,
    kampers: activeVehicles.filter((v) => v.type === "Kamper").length,
    trailers: activeVehicles.filter((v) => v.type === "Przyczepa").length,
    available: activeVehicles.filter((v) => v.status === "available").length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Ładowanie floty...</div>
      </div>
    );
  }

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
                      <SelectItem value="Kamper">Kamper</SelectItem>
                      <SelectItem value="Przyczepa">Przyczepa</SelectItem>
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
                <Label htmlFor="vin">VIN *</Label>
                <Input
                  id="vin"
                  value={newVehicle.vin}
                  onChange={(e) => setNewVehicle({ ...newVehicle, vin: e.target.value })}
                  placeholder="np. ZFA25000003X12345"
                  required
                />
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
              {newVehicle.type === "Przyczepa" && (
                <div className="space-y-2">
                  <Label htmlFor="trailerWeight">Waga przyczepy (kg)</Label>
                  <Input
                    id="trailerWeight"
                    type="number"
                    value={newVehicle.trailerWeight || ''}
                    onChange={(e) => setNewVehicle({ ...newVehicle, trailerWeight: e.target.value ? parseFloat(e.target.value) : null })}
                    placeholder="np. 750"
                  />
                </div>
              )}
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
                <SelectItem value="Kamper">Kampery</SelectItem>
                <SelectItem value="Przyczepa">Przyczepy</SelectItem>
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
                    {vehicle.type === "Kamper" ? (
                      <Truck className="h-6 w-6 text-primary-foreground" />
                    ) : (
                      <Caravan className="h-6 w-6 text-primary-foreground" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{vehicle.name}</CardTitle>
                    <CardDescription className="text-xs mt-1">
                      {vehicle.registration_number}
                    </CardDescription>
                  </div>
                </div>
                <Badge className={getStatusBadge(vehicle.uiStatus).className}>
                  {getStatusBadge(vehicle.uiStatus).label}
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
              <div className="flex gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    setArchiveVehicleId(vehicle.id);
                  }}
                >
                  <Archive className="h-4 w-4 mr-2" />
                  Archiwizuj
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteVehicleId(vehicle.id);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Usuń
                </Button>
              </div>
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
              Ta operacja jest nieodwracalna. Wszystkie dane pojazdu zostaną trwale usunięte z bazy danych.
              Upewnij się, że pojazd nie ma aktywnych wynajmów. Jeśli chcesz tylko ukryć pojazd, użyj opcji "Archiwizuj".
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

      <AlertDialog open={!!archiveVehicleId} onOpenChange={() => setArchiveVehicleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Czy na pewno chcesz zarchiwizować ten pojazd?</AlertDialogTitle>
            <AlertDialogDescription>
              Pojazd zostanie ukryty w liście floty, ale wszystkie dane pozostaną w bazie danych.
              Możesz przywrócić pojazd edytując jego status w bazie danych.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => archiveVehicleId && handleArchiveVehicle(archiveVehicleId)}
            >
              Archiwizuj
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Fleet;
