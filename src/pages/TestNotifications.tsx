import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useVehicles } from "@/hooks/useVehicles";
import { useContracts } from "@/hooks/useContracts";
import { useToast } from "@/hooks/use-toast";
import { Bell, Loader2, Unplug, Plug } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const TestNotifications = () => {
  const { data: vehicles, isLoading: vehiclesLoading } = useVehicles();
  const { data: contracts, isLoading: contractsLoading } = useContracts();
  
  // Insurance notification state
  const [selectedVehicleInsurance, setSelectedVehicleInsurance] = useState<string>("");
  const [connectionStatusInsurance, setConnectionStatusInsurance] = useState<"disconnected" | "connected">("disconnected");
  const [isSendingInsurance, setIsSendingInsurance] = useState(false);
  
  // Inspection notification state
  const [selectedVehicleInspection, setSelectedVehicleInspection] = useState<string>("");
  const [connectionStatusInspection, setConnectionStatusInspection] = useState<"disconnected" | "connected">("disconnected");
  const [isSendingInspection, setIsSendingInspection] = useState(false);
  
  // Rental notification state (3 days)
  const [selectedDateRental, setSelectedDateRental] = useState<string>("");
  const [connectionStatusRental, setConnectionStatusRental] = useState<"disconnected" | "connected">("disconnected");
  const [isSendingRental, setIsSendingRental] = useState(false);
  
  // Rental notification state (2 days)
  const [selectedDateRental2Days, setSelectedDateRental2Days] = useState<string>("");
  const [connectionStatusRental2Days, setConnectionStatusRental2Days] = useState<"disconnected" | "connected">("disconnected");
  const [isSendingRental2Days, setIsSendingRental2Days] = useState(false);
  
  const { toast } = useToast();

  // Group contracts by start date
  const contractsByDate = useMemo(() => {
    if (!contracts) return {};
    
    return contracts.reduce((acc: Record<string, any[]>, contract: any) => {
      const startDate = contract.start_date ? new Date(contract.start_date).toISOString().split('T')[0] : '';
      if (startDate) {
        if (!acc[startDate]) {
          acc[startDate] = [];
        }
        acc[startDate].push(contract);
      }
      return acc;
    }, {});
  }, [contracts]);

  const handleSendInsuranceNotification = async () => {
    if (connectionStatusInsurance === "disconnected") {
      toast({
        title: "Błąd",
        description: "Najpierw połącz webhook (zmień status na 'Połączone')",
        variant: "destructive",
      });
      return;
    }

    if (!selectedVehicleInsurance) {
      toast({
        title: "Błąd",
        description: "Wybierz pojazd",
        variant: "destructive",
      });
      return;
    }

    const vehicle = vehicles?.find(v => v.id === selectedVehicleInsurance);
    if (!vehicle) return;

    setIsSendingInsurance(true);
    try {
      const response = await fetch("https://hook.eu2.make.com/11vxcpks3jhhnqkjxbrx4mc6murktf45", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vehicle_id: vehicle.id,
          vehicle_model: vehicle.model,
          registration_number: vehicle.registration_number,
          insurance_valid_until: vehicle.insurance_valid_until,
          notification_type: "insurance_expiring_30_days",
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Webhook error: ${response.status}`);
      }

      toast({
        title: "Sukces",
        description: `Powiadomienie o ubezpieczeniu wysłane dla pojazdu: ${vehicle.registration_number} (${vehicle.model})`,
      });
    } catch (error: any) {
      console.error("Error sending notification:", error);
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się wysłać powiadomienia",
        variant: "destructive",
      });
    } finally {
      setIsSendingInsurance(false);
    }
  };

  const handleSendInspectionNotification = async () => {
    if (connectionStatusInspection === "disconnected") {
      toast({
        title: "Błąd",
        description: "Najpierw połącz webhook (zmień status na 'Połączone')",
        variant: "destructive",
      });
      return;
    }

    if (!selectedVehicleInspection) {
      toast({
        title: "Błąd",
        description: "Wybierz pojazd",
        variant: "destructive",
      });
      return;
    }

    const vehicle = vehicles?.find(v => v.id === selectedVehicleInspection);
    if (!vehicle) return;

    setIsSendingInspection(true);
    try {
      const response = await fetch("https://hook.eu2.make.com/ucs1ch4canx8daqlqrh903tqtb8q7bi5", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vehicle_id: vehicle.id,
          vehicle_model: vehicle.model,
          registration_number: vehicle.registration_number,
          next_inspection_date: vehicle.next_inspection_date,
          notification_type: "inspection_expiring_30_days",
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Webhook error: ${response.status}`);
      }

      toast({
        title: "Sukces",
        description: `Powiadomienie o przeglądzie wysłane dla pojazdu: ${vehicle.registration_number} (${vehicle.model})`,
      });
    } catch (error: any) {
      console.error("Error sending notification:", error);
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się wysłać powiadomienia",
        variant: "destructive",
      });
    } finally {
      setIsSendingInspection(false);
    }
  };

  const handleSendRentalNotification = async () => {
    if (connectionStatusRental === "disconnected") {
      toast({
        title: "Błąd",
        description: "Najpierw połącz webhook (zmień status na 'Połączone')",
        variant: "destructive",
      });
      return;
    }

    if (!selectedDateRental) {
      toast({
        title: "Błąd",
        description: "Wybierz datę",
        variant: "destructive",
      });
      return;
    }

    const contractsForDate = contractsByDate[selectedDateRental];
    if (!contractsForDate || contractsForDate.length === 0) return;

    setIsSendingRental(true);
    try {
      const response = await fetch("https://hook.eu2.make.com/luarjrss1fx7b39bmr12fpkinx61sesk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notification_type: "rental_starting_3_days",
          rental_date: selectedDateRental,
          contracts_count: contractsForDate.length,
          contracts: contractsForDate,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Webhook error: ${response.status}`);
      }

      toast({
        title: "Sukces",
        description: `Powiadomienie wysłane dla ${contractsForDate.length} umów z dnia ${new Date(selectedDateRental).toLocaleDateString("pl-PL")}`,
      });
    } catch (error: any) {
      console.error("Error sending notification:", error);
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się wysłać powiadomienia",
        variant: "destructive",
      });
    } finally {
      setIsSendingRental(false);
    }
  };

  const handleSendRental2DaysNotification = async () => {
    if (connectionStatusRental2Days === "disconnected") {
      toast({
        title: "Błąd",
        description: "Najpierw połącz webhook (zmień status na 'Połączone')",
        variant: "destructive",
      });
      return;
    }

    if (!selectedDateRental2Days) {
      toast({
        title: "Błąd",
        description: "Wybierz datę",
        variant: "destructive",
      });
      return;
    }

    const contractsForDate = contractsByDate[selectedDateRental2Days];
    if (!contractsForDate || contractsForDate.length === 0) return;

    setIsSendingRental2Days(true);
    try {
      const response = await fetch("https://hook.eu2.make.com/g28f6wb4s5xyiul9kx82ydqgcpgkxxl2", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notification_type: "rental_starting_2_days",
          rental_date: selectedDateRental2Days,
          contracts_count: contractsForDate.length,
          contracts: contractsForDate,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Webhook error: ${response.status}`);
      }

      toast({
        title: "Sukces",
        description: `Powiadomienie wysłane dla ${contractsForDate.length} umów z dnia ${new Date(selectedDateRental2Days).toLocaleDateString("pl-PL")}`,
      });
    } catch (error: any) {
      console.error("Error sending notification:", error);
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się wysłać powiadomienia",
        variant: "destructive",
      });
    } finally {
      setIsSendingRental2Days(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Panel testowania powiadomień webhook
          </CardTitle>
          <CardDescription>
            Testuj powiadomienia wysyłane na zewnętrzne webhooki
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Insurance Notification */}
          <div className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  30 dni do wygaśnięcia polisy ubezpieczeniowej pojazdu
                </h3>
                <Badge 
                  variant={connectionStatusInsurance === "connected" ? "default" : "secondary"}
                  className="gap-1"
                >
                  {connectionStatusInsurance === "connected" ? (
                    <>
                      <Plug className="h-3 w-3" />
                      Połączone
                    </>
                  ) : (
                    <>
                      <Unplug className="h-3 w-3" />
                      Niepołączone
                    </>
                  )}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Wysyła powiadomienie o zbliżającym się terminie wygaśnięcia polisy ubezpieczeniowej pojazdu
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="connection-status-insurance">Status połączenia webhook</Label>
              <Select
                value={connectionStatusInsurance}
                onValueChange={(value) => setConnectionStatusInsurance(value as "disconnected" | "connected")}
                disabled={isSendingInsurance}
              >
                <SelectTrigger id="connection-status-insurance">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="disconnected">
                    <div className="flex items-center gap-2">
                      <Unplug className="h-4 w-4" />
                      Niepołączone
                    </div>
                  </SelectItem>
                  <SelectItem value="connected">
                    <div className="flex items-center gap-2">
                      <Plug className="h-4 w-4" />
                      Połączone
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicle-select-insurance">Wybierz pojazd</Label>
              <Select
                value={selectedVehicleInsurance}
                onValueChange={setSelectedVehicleInsurance}
                disabled={vehiclesLoading || isSendingInsurance}
              >
                <SelectTrigger id="vehicle-select-insurance">
                  <SelectValue placeholder="Wybierz pojazd..." />
                </SelectTrigger>
                <SelectContent>
                  {vehicles?.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.registration_number} - {vehicle.model}
                      {vehicle.insurance_valid_until && 
                        ` (polisa: ${new Date(vehicle.insurance_valid_until).toLocaleDateString("pl-PL")})`
                      }
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleSendInsuranceNotification} 
              disabled={!selectedVehicleInsurance || isSendingInsurance || connectionStatusInsurance === "disconnected"}
              className="w-full sm:w-auto"
            >
              {isSendingInsurance && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Wyślij powiadomienie
            </Button>
            {connectionStatusInsurance === "disconnected" && (
              <p className="text-sm text-muted-foreground">
                Zmień status na "Połączone" aby wysłać powiadomienie
              </p>
            )}
          </div>

          {/* Inspection Notification */}
          <div className="space-y-4 pt-6 border-t">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  30 dni do wygaśnięcia przeglądu technicznego
                </h3>
                <Badge 
                  variant={connectionStatusInspection === "connected" ? "default" : "secondary"}
                  className="gap-1"
                >
                  {connectionStatusInspection === "connected" ? (
                    <>
                      <Plug className="h-3 w-3" />
                      Połączone
                    </>
                  ) : (
                    <>
                      <Unplug className="h-3 w-3" />
                      Niepołączone
                    </>
                  )}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Wysyła powiadomienie o zbliżającym się terminie wygaśnięcia przeglądu technicznego pojazdu
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="connection-status-inspection">Status połączenia webhook</Label>
              <Select
                value={connectionStatusInspection}
                onValueChange={(value) => setConnectionStatusInspection(value as "disconnected" | "connected")}
                disabled={isSendingInspection}
              >
                <SelectTrigger id="connection-status-inspection">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="disconnected">
                    <div className="flex items-center gap-2">
                      <Unplug className="h-4 w-4" />
                      Niepołączone
                    </div>
                  </SelectItem>
                  <SelectItem value="connected">
                    <div className="flex items-center gap-2">
                      <Plug className="h-4 w-4" />
                      Połączone
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicle-select-inspection">Wybierz pojazd</Label>
              <Select
                value={selectedVehicleInspection}
                onValueChange={setSelectedVehicleInspection}
                disabled={vehiclesLoading || isSendingInspection}
              >
                <SelectTrigger id="vehicle-select-inspection">
                  <SelectValue placeholder="Wybierz pojazd..." />
                </SelectTrigger>
                <SelectContent>
                  {vehicles?.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.registration_number} - {vehicle.model}
                      {vehicle.next_inspection_date && 
                        ` (przegląd: ${new Date(vehicle.next_inspection_date).toLocaleDateString("pl-PL")})`
                      }
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleSendInspectionNotification} 
              disabled={!selectedVehicleInspection || isSendingInspection || connectionStatusInspection === "disconnected"}
              className="w-full sm:w-auto"
            >
              {isSendingInspection && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Wyślij powiadomienie
            </Button>
            {connectionStatusInspection === "disconnected" && (
              <p className="text-sm text-muted-foreground">
                Zmień status na "Połączone" aby wysłać powiadomienie
              </p>
            )}
          </div>

          {/* Rental Notification */}
          <div className="space-y-4 pt-6 border-t">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  3 dni przed zbliżającym się okresem wynajmu pojazdu
                </h3>
                <Badge 
                  variant={connectionStatusRental === "connected" ? "default" : "secondary"}
                  className="gap-1"
                >
                  {connectionStatusRental === "connected" ? (
                    <>
                      <Plug className="h-3 w-3" />
                      Połączone
                    </>
                  ) : (
                    <>
                      <Unplug className="h-3 w-3" />
                      Niepołączone
                    </>
                  )}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Wysyła powiadomienie z danymi umowy 3 dni przed rozpoczęciem wynajmu
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="connection-status-rental">Status połączenia webhook</Label>
              <Select
                value={connectionStatusRental}
                onValueChange={(value) => setConnectionStatusRental(value as "disconnected" | "connected")}
                disabled={isSendingRental}
              >
                <SelectTrigger id="connection-status-rental">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="disconnected">
                    <div className="flex items-center gap-2">
                      <Unplug className="h-4 w-4" />
                      Niepołączone
                    </div>
                  </SelectItem>
                  <SelectItem value="connected">
                    <div className="flex items-center gap-2">
                      <Plug className="h-4 w-4" />
                      Połączone
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-select-rental">Wybierz datę rozpoczęcia wynajmu</Label>
              <Select
                value={selectedDateRental}
                onValueChange={setSelectedDateRental}
                disabled={contractsLoading || isSendingRental}
              >
                <SelectTrigger id="date-select-rental">
                  <SelectValue placeholder="Wybierz datę..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(contractsByDate)
                    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
                    .map(([date, contracts]) => (
                      <SelectItem key={date} value={date}>
                        {new Date(date).toLocaleDateString("pl-PL")} - {contracts.length} {contracts.length === 1 ? 'umowa' : contracts.length < 5 ? 'umowy' : 'umów'}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleSendRentalNotification} 
              disabled={!selectedDateRental || isSendingRental || connectionStatusRental === "disconnected"}
              className="w-full sm:w-auto"
            >
              {isSendingRental && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Wyślij powiadomienie
            </Button>
            {connectionStatusRental === "disconnected" && (
              <p className="text-sm text-muted-foreground">
                Zmień status na "Połączone" aby wysłać powiadomienie
              </p>
            )}
          </div>

          {/* Rental Notification 2 Days */}
          <div className="space-y-4 pt-6 border-t">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  2 dni przed zbliżającym się okresem wynajmu pojazdu
                </h3>
                <Badge 
                  variant={connectionStatusRental2Days === "connected" ? "default" : "secondary"}
                  className="gap-1"
                >
                  {connectionStatusRental2Days === "connected" ? (
                    <>
                      <Plug className="h-3 w-3" />
                      Połączone
                    </>
                  ) : (
                    <>
                      <Unplug className="h-3 w-3" />
                      Niepołączone
                    </>
                  )}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Wysyła powiadomienie z danymi umowy 2 dni przed rozpoczęciem wynajmu
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="connection-status-rental-2days">Status połączenia webhook</Label>
              <Select
                value={connectionStatusRental2Days}
                onValueChange={(value) => setConnectionStatusRental2Days(value as "disconnected" | "connected")}
                disabled={isSendingRental2Days}
              >
                <SelectTrigger id="connection-status-rental-2days">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="disconnected">
                    <div className="flex items-center gap-2">
                      <Unplug className="h-4 w-4" />
                      Niepołączone
                    </div>
                  </SelectItem>
                  <SelectItem value="connected">
                    <div className="flex items-center gap-2">
                      <Plug className="h-4 w-4" />
                      Połączone
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-select-rental-2days">Wybierz datę</Label>
              <Select
                value={selectedDateRental2Days}
                onValueChange={setSelectedDateRental2Days}
                disabled={contractsLoading || isSendingRental2Days}
              >
                <SelectTrigger id="date-select-rental-2days">
                  <SelectValue placeholder="Wybierz datę..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(contractsByDate)
                    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
                    .map(([date, contracts]) => (
                      <SelectItem key={date} value={date}>
                        {new Date(date).toLocaleDateString("pl-PL")} - {contracts.length} {contracts.length === 1 ? 'umowa' : contracts.length < 5 ? 'umowy' : 'umów'}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleSendRental2DaysNotification} 
              disabled={!selectedDateRental2Days || isSendingRental2Days || connectionStatusRental2Days === "disconnected"}
              className="w-full sm:w-auto"
            >
              {isSendingRental2Days && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Wyślij powiadomienie
            </Button>
            {connectionStatusRental2Days === "disconnected" && (
              <p className="text-sm text-muted-foreground">
                Zmień status na "Połączone" aby wysłać powiadomienie
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestNotifications;
