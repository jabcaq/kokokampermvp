import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Check, ChevronsUpDown, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface Vehicle {
  id: string;
  model: string;
  vin: string;
  registration_number: string;
  next_inspection_date?: string | null;
  insurance_policy_number?: string | null;
  insurance_valid_until?: string | null;
  additional_info?: string | null;
  type?: string | null;
}

export interface SelectedVehicle {
  vehicleId: string;
  model: string;
  vin: string;
  registration_number: string;
  next_inspection_date: string;
  insurance_policy_number: string;
  insurance_valid_until: string;
  additional_info: string;
  type: string;
  cleaning: string;
  animals: string;
  extra_equipment: string;
}

interface MultiVehicleSelectorProps {
  vehicles: Vehicle[];
  selectedVehicles: SelectedVehicle[];
  onVehiclesChange: (vehicles: SelectedVehicle[]) => void;
}

export const MultiVehicleSelector = ({
  vehicles,
  selectedVehicles,
  onVehiclesChange,
}: MultiVehicleSelectorProps) => {
  const [openPopoverIndex, setOpenPopoverIndex] = useState<number | null>(null);

  const addVehicle = () => {
    onVehiclesChange([
      ...selectedVehicles,
      {
        vehicleId: "",
        model: "",
        vin: "",
        registration_number: "",
        next_inspection_date: "",
        insurance_policy_number: "",
        insurance_valid_until: "",
        additional_info: "",
        type: "",
        cleaning: "",
        animals: "",
        extra_equipment: "",
      },
    ]);
  };

  const removeVehicle = (index: number) => {
    const updated = selectedVehicles.filter((_, i) => i !== index);
    onVehiclesChange(updated);
  };

  const selectVehicle = (index: number, vehicleId: string) => {
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    if (!vehicle) return;

    const updated = [...selectedVehicles];
    updated[index] = {
      vehicleId: vehicle.id,
      model: vehicle.model,
      vin: vehicle.vin,
      registration_number: vehicle.registration_number,
      next_inspection_date: vehicle.next_inspection_date || "",
      insurance_policy_number: vehicle.insurance_policy_number || "",
      insurance_valid_until: vehicle.insurance_valid_until || "",
      additional_info: vehicle.additional_info || "",
      type: vehicle.type || "",
      cleaning: "",
      animals: "",
      extra_equipment: "",
    };
    onVehiclesChange(updated);
    setOpenPopoverIndex(null);
  };

  const updateVehicleField = (index: number, field: keyof SelectedVehicle, value: string) => {
    const updated = [...selectedVehicles];
    updated[index] = { ...updated[index], [field]: value };
    onVehiclesChange(updated);
  };

  // Filter out already selected vehicles
  const getAvailableVehicles = (currentIndex: number) => {
    const selectedIds = selectedVehicles
      .map((v, i) => (i !== currentIndex ? v.vehicleId : null))
      .filter(Boolean);
    return vehicles.filter((v) => !selectedIds.includes(v.id));
  };

  return (
    <div className="space-y-6">
      {selectedVehicles.map((selected, index) => (
        <div key={index} className="border border-border rounded-lg p-4 space-y-4 bg-muted/30">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-foreground">
              Pojazd #{index + 1}
            </h4>
            {selectedVehicles.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeVehicle(index)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Usuń
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <Label>Wybierz pojazd z bazy</Label>
            <Popover 
              open={openPopoverIndex === index} 
              onOpenChange={(open) => setOpenPopoverIndex(open ? index : null)}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openPopoverIndex === index}
                  className="w-full justify-between"
                >
                  {selected.vehicleId ? (
                    <span className="flex items-center gap-2">
                      <span className="font-medium">{selected.registration_number}</span>
                      <span className="text-muted-foreground">-</span>
                      <span>{selected.model}</span>
                      {selected.type && (
                        <span className="text-xs text-muted-foreground">({selected.type})</span>
                      )}
                    </span>
                  ) : (
                    "Wybierz pojazd..."
                  )}
                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[500px] p-0 bg-popover" align="start">
                <Command className="bg-popover">
                  <CommandInput placeholder="Szukaj po rejestracji, modelu lub typie..." />
                  <CommandList>
                    <CommandEmpty>Nie znaleziono pojazdu.</CommandEmpty>
                    <CommandGroup>
                      {getAvailableVehicles(index).map((vehicle) => (
                        <CommandItem
                          key={vehicle.id}
                          value={`${vehicle.model} ${vehicle.registration_number} ${vehicle.type || ''}`}
                          onSelect={() => selectVehicle(index, vehicle.id)}
                          className="cursor-pointer"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selected.vehicleId === vehicle.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {vehicle.registration_number} - {vehicle.model}
                            </span>
                            {vehicle.type && (
                              <span className="text-sm opacity-70">{vehicle.type}</span>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {selected.vehicleId && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Model</Label>
                <Input value={selected.model} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Nr rejestracyjny</Label>
                <Input value={selected.registration_number} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>VIN</Label>
                <Input value={selected.vin} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Typ</Label>
                <Input value={selected.type} readOnly className="bg-muted" />
              </div>
            </div>
          )}
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={addVehicle}
        className="w-full gap-2"
      >
        <Plus className="h-4 w-4" />
        Dodaj kolejny pojazd
      </Button>
    </div>
  );
};
