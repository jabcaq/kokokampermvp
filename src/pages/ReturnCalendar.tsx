import { Calendar, momentLocalizer, View, Components } from "react-big-calendar";
import moment from "moment";
import "moment/locale/pl";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useState } from "react";
import { useReturnBookings } from "@/hooks/useReturnBookings";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

moment.locale("pl");
const localizer = momentLocalizer(moment);

const messages = {
  allDay: "Cały dzień",
  previous: "Poprzedni",
  next: "Następny",
  today: "Dziś",
  month: "Miesiąc",
  week: "Tydzień",
  day: "Dzień",
  agenda: "Agenda",
  date: "Data",
  time: "Czas",
  event: "Zdarzenie",
  noEventsInRange: "Brak zwrotów w tym okresie",
  showMore: (total: number) => `+${total} więcej`,
  work_week: "Tydzień roboczy",
};

export default function ReturnCalendar() {
  const { data: bookings, isLoading } = useReturnBookings();
  const [view, setView] = useState<View>("week");
  const [date, setDate] = useState(new Date());
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const navigate = useNavigate();

  // Get list of employees who handle returns
  const { data: employees } = useQuery({
    queryKey: ["return_handlers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id, profiles(id, full_name)")
        .eq("role", "return_handler");
      
      if (error) throw error;
      return data.map((ur: any) => ({
        id: ur.user_id,
        name: ur.profiles?.full_name || "Nieznany",
      }));
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Filter bookings by selected employee
  const filteredBookings = selectedEmployee === "all" 
    ? bookings 
    : bookings?.filter(b => b.assigned_employee_id === selectedEmployee);

  const events = filteredBookings?.map((booking) => {
    const [hours, minutes] = booking.scheduled_return_time.split(":");
    const startDate = new Date(booking.scheduled_return_date);
    startDate.setHours(parseInt(hours), parseInt(minutes));
    
    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + 30);

    let statusText = "Nowa rezerwacja";
    if (booking.return_completed) {
      statusText = "Zakończona";
    } else if (booking.return_confirmed) {
      statusText = "Potwierdzona";
    }

    return {
      id: booking.id,
      title: `${booking.employee_name} - ${statusText}`,
      start: startDate,
      end: endDate,
      resource: booking,
    };
  }) || [];

  const eventStyleGetter = (event: any) => {
    const booking = event.resource;
    let backgroundColor = "hsl(185 70% 45%)"; // primary color
    let borderColor = "hsl(185 70% 35%)";
    
    if (booking.return_completed) {
      backgroundColor = "hsl(220 15% 75%)"; // muted/gray
      borderColor = "hsl(220 15% 65%)";
    } else if (booking.return_confirmed) {
      backgroundColor = "hsl(142 76% 45%)"; // green
      borderColor = "hsl(142 76% 35%)";
    }

    return {
      style: {
        backgroundColor,
        borderLeft: `4px solid ${borderColor}`,
        borderRadius: "4px",
        opacity: 0.95,
        color: "white",
        border: "none",
        padding: "4px 8px",
        fontSize: "0.875rem",
        fontWeight: "500",
      },
    };
  };

  const handleSelectEvent = (event: any) => {
    navigate(`/contracts/${event.resource.contract_id}`);
  };

  // Custom Event Component with Tooltip
  const EventComponent = ({ event }: { event: any }) => {
    const booking = event.resource;
    const [showTooltip, setShowTooltip] = useState(false);

    return (
      <div 
        className="relative h-full"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div className="font-medium truncate">{event.title}</div>
        
        {showTooltip && (
          <div className="absolute z-50 bg-card text-card-foreground shadow-lg rounded-lg border p-4 w-80 left-0 top-full mt-2"
               style={{ pointerEvents: 'none' }}>
            <div className="space-y-3">
              <div>
                <div className="font-semibold text-base mb-1">{booking.employee_name}</div>
                <div className="text-sm text-muted-foreground">
                  {format(new Date(booking.scheduled_return_date), "EEEE, d MMMM yyyy", { locale: pl })}
                </div>
                <div className="text-sm text-muted-foreground">
                  Godzina: {booking.scheduled_return_time}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Badge variant={booking.return_completed ? "secondary" : booking.return_confirmed ? "default" : "outline"}>
                  {booking.return_completed ? "Zakończona" : booking.return_confirmed ? "Potwierdzona" : "Nowa"}
                </Badge>
              </div>

              {booking.booking_notes && (
                <div className="pt-2 border-t">
                  <div className="text-xs font-semibold text-muted-foreground mb-1">Uwagi:</div>
                  <div className="text-sm">{booking.booking_notes}</div>
                </div>
              )}

              <div className="pt-2 border-t text-xs text-muted-foreground">
                Kliknij aby zobaczyć szczegóły umowy
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const components: Components = {
    event: EventComponent,
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Kalendarz zwrotów</h1>
          <p className="text-muted-foreground">
            Przegląd wszystkich zaplanowanych zwrotów kamperów
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Wszyscy pracownicy" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszyscy pracownicy</SelectItem>
              {employees?.map((emp) => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Zaplanowane</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bookings?.filter(b => !b.return_confirmed && !b.return_completed).length || 0}
            </div>
            <Badge variant="outline" className="mt-2">Oczekują potwierdzenia</Badge>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Potwierdzone</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bookings?.filter(b => b.return_confirmed && !b.return_completed).length || 0}
            </div>
            <Badge variant="outline" className="mt-2" style={{ backgroundColor: "hsl(142.1 76.2% 36.3%)", color: "white" }}>
              Gotowe
            </Badge>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Zakończone</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bookings?.filter(b => b.return_completed).length || 0}
            </div>
            <Badge variant="secondary" className="mt-2">Zamknięte</Badge>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-4">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 800 }}
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            messages={messages}
            eventPropGetter={eventStyleGetter}
            onSelectEvent={handleSelectEvent}
            step={30}
            timeslots={2}
            min={new Date(2024, 0, 1, 8, 0, 0)}
            max={new Date(2024, 0, 1, 20, 0, 0)}
            views={['month', 'week', 'day', 'agenda']}
            toolbar={true}
            components={components}
          />
        </CardContent>
      </Card>
    </div>
  );
}
