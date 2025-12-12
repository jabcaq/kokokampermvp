import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Bell, Search, Filter, User, Calendar, Info, RotateCw } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Typy powiadomień które można ponownie wysłać na webhook
const resendableTypes = [
  'deposit_received',
  'deposit_notification', 
  'contract_active',
  'payment_reminder',
  'payment_overdue',
  'final_invoice_due',
];

const notificationTypeLabels: Record<string, string> = {
  status_auto_change: "Zmiana statusu",
  invoice_added: "Dodano fakturę",
  driver_form_submitted: "Formularz kierowcy",
  deposit_notification: "Powiadomienie o kaucji",
  deposit_received: "Wpłata kaucji",
  contract_active: "Aktywacja umowy",
  contract_cancelled: "Anulowanie umowy",
  handover_completed: "Wydanie pojazdu",
  return_completed: "Zwrot pojazdu",
  review_request_sent: "Prośba o opinię",
  schedule_created: "Utworzenie harmonogramu",
  schedule_updated: "Aktualizacja harmonogramu",
  payment_reminder: "Przypomnienie o płatności",
  payment_overdue: "Zaległa płatność",
  final_invoice_due: "Faktura końcowa",
  insurance_expiring: "Wygasające ubezpieczenie",
  inspection_expiring: "Wygasający przegląd",
};

const getNotificationTypeColor = (type: string): string => {
  switch (type) {
    case "status_auto_change":
      return "bg-blue-100 text-blue-800";
    case "invoice_added":
      return "bg-green-100 text-green-800";
    case "driver_form_submitted":
      return "bg-purple-100 text-purple-800";
    case "deposit_notification":
    case "deposit_received":
      return "bg-yellow-100 text-yellow-800";
    case "contract_active":
      return "bg-emerald-100 text-emerald-800";
    case "contract_cancelled":
      return "bg-red-100 text-red-800";
    case "handover_completed":
    case "return_completed":
      return "bg-cyan-100 text-cyan-800";
    case "payment_reminder":
    case "payment_overdue":
    case "final_invoice_due":
      return "bg-orange-100 text-orange-800";
    case "insurance_expiring":
    case "inspection_expiring":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function NotificationLogs() {
  const [contractFilter, setContractFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [userFilter, setUserFilter] = useState("");
  const [resendingId, setResendingId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: logs, isLoading } = useQuery({
    queryKey: ["notification_logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notification_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      
      if (error) throw error;
      return data;
    },
  });

  const handleResend = async (log: any) => {
    setResendingId(log.id);
    try {
      const { data, error } = await supabase.functions.invoke('resend-notification', {
        body: {
          notification_type: log.notification_type,
          notification_title: log.notification_title,
          action_description: log.action_description,
          contract_id: log.contract_id,
          contract_number: log.contract_number,
          inquiry_id: log.inquiry_id,
          inquiry_number: log.inquiry_number,
          metadata: log.metadata,
        }
      });

      if (error) throw error;

      toast({
        title: "Wysłano ponownie",
        description: "Powiadomienie zostało wysłane na webhook",
      });
    } catch (error: any) {
      console.error('Error resending notification:', error);
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się wysłać powiadomienia",
        variant: "destructive",
      });
    } finally {
      setResendingId(null);
    }
  };

  // Get unique notification types for filter
  const uniqueTypes = logs 
    ? [...new Set(logs.map(log => log.notification_type))]
    : [];

  // Filter logs
  const filteredLogs = logs?.filter(log => {
    const matchesContract = !contractFilter || 
      (log.contract_number?.toLowerCase().includes(contractFilter.toLowerCase())) ||
      (log.inquiry_number?.toLowerCase().includes(contractFilter.toLowerCase()));
    
    const matchesType = typeFilter === "all" || log.notification_type === typeFilter;
    
    const matchesUser = !userFilter ||
      (log.user_email?.toLowerCase().includes(userFilter.toLowerCase()));
    
    return matchesContract && matchesType && matchesUser;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Bell className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Logi powiadomień</h1>
          <p className="text-muted-foreground">Historia wszystkich powiadomień systemowych</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtry
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Numer umowy / zapytania
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Szukaj po numerze..."
                  value={contractFilter}
                  onChange={(e) => setContractFilter(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Rodzaj powiadomienia
              </label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Wszystkie rodzaje" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie rodzaje</SelectItem>
                  {uniqueTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {notificationTypeLabels[type] || type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Email użytkownika
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Szukaj po emailu..."
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Historia powiadomień</span>
            <Badge variant="secondary">{filteredLogs?.length || 0} rekordów</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredLogs && filteredLogs.length > 0 ? (
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Data</TableHead>
                    <TableHead className="w-[150px]">Rodzaj</TableHead>
                    <TableHead className="w-[120px]">Umowa/Zapytanie</TableHead>
                    <TableHead>Tytuł</TableHead>
                    <TableHead>Opis</TableHead>
                    <TableHead className="w-[180px]">Użytkownik</TableHead>
                    <TableHead className="w-[60px]">Akcje</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {format(new Date(log.created_at), "dd.MM.yyyy HH:mm", { locale: pl })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getNotificationTypeColor(log.notification_type)}>
                          {notificationTypeLabels[log.notification_type] || log.notification_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {log.contract_id ? (
                          <Link to={`/contracts/${log.contract_id}`}>
                            <Button variant="link" className="p-0 h-auto text-sm">
                              {log.contract_number || "—"}
                            </Button>
                          </Link>
                        ) : log.inquiry_number ? (
                          <span className="text-sm">{log.inquiry_number}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-sm">{log.notification_title}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground line-clamp-2">
                          {log.action_description}
                        </span>
                      </TableCell>
                      <TableCell>
                        {log.user_email ? (
                          <span className="text-sm">{log.user_email}</span>
                        ) : (
                          <span className="text-muted-foreground text-sm">System</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {resendableTypes.includes(log.notification_type) && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleResend(log)}
                                  disabled={resendingId === log.id}
                                >
                                  <RotateCw 
                                    className={`h-4 w-4 ${resendingId === log.id ? 'animate-spin' : ''}`} 
                                  />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Wyślij ponownie na webhook</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Info className="h-12 w-12 mb-4" />
              <p>Brak logów spełniających kryteria wyszukiwania</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
