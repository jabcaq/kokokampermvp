import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useVehicles } from "@/hooks/useVehicles";
import { useToast } from "@/hooks/use-toast";
import { Bell, Loader2, Unplug, Plug } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const TestNotifications = () => {
  const { data: vehicles, isLoading: vehiclesLoading } = useVehicles();
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connected">("disconnected");
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const handleSendNotification = async () => {
    if (connectionStatus === "disconnected") {
      toast({
        title: "Błąd",
        description: "Najpierw połącz webhook (zmień status na 'Połączone')",
        variant: "destructive",
      });
      return;
    }

    if (!selectedVehicle) {
      toast({
        title: "Błąd",
        description: "Wybierz pojazd",
        variant: "destructive",
      });
      return;
    }

    const vehicle = vehicles?.find(v => v.id === selectedVehicle);
    if (!vehicle) return;

    setIsSending(true);
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
        description: `Powiadomienie wysłane dla pojazdu: ${vehicle.registration_number} (${vehicle.model})`,
      });
    } catch (error: any) {
      console.error("Error sending notification:", error);
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się wysłać powiadomienia",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
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
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  30 dni do wygaśnięcia polisy ubezpieczeniowej pojazdu
                </h3>
                <Badge 
                  variant={connectionStatus === "connected" ? "default" : "secondary"}
                  className="gap-1"
                >
                  {connectionStatus === "connected" ? (
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
              <Label htmlFor="connection-status">Status połączenia webhook</Label>
              <Select
                value={connectionStatus}
                onValueChange={(value) => setConnectionStatus(value as "disconnected" | "connected")}
                disabled={isSending}
              >
                <SelectTrigger id="connection-status">
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
              <Label htmlFor="vehicle-select">Wybierz pojazd</Label>
              <Select
                value={selectedVehicle}
                onValueChange={setSelectedVehicle}
                disabled={vehiclesLoading || isSending}
              >
                <SelectTrigger id="vehicle-select">
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
              onClick={handleSendNotification} 
              disabled={!selectedVehicle || isSending || connectionStatus === "disconnected"}
              className="w-full sm:w-auto"
            >
              {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Wyślij powiadomienie
            </Button>
            {connectionStatus === "disconnected" && (
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
