import { Calendar, momentLocalizer, View } from "react-big-calendar";
import moment from "moment";
import "moment/locale/pl";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useState } from "react";
import { useReturnBookings } from "@/hooks/useReturnBookings";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

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
  noEventsInRange: "Brak zdarzeń w tym okresie",
  showMore: (total: number) => `+${total} więcej`,
};

export default function ReturnCalendar() {
  const { data: bookings, isLoading } = useReturnBookings();
  const [view, setView] = useState<View>("month");
  const [date, setDate] = useState(new Date());
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const events = bookings?.map((booking) => {
    const [hours, minutes] = booking.scheduled_return_time.split(":");
    const startDate = new Date(booking.scheduled_return_date);
    startDate.setHours(parseInt(hours), parseInt(minutes));
    
    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + 30);

    return {
      id: booking.id,
      title: `Zwrot - ${booking.employee_name}`,
      start: startDate,
      end: endDate,
      resource: booking,
    };
  }) || [];

  const eventStyleGetter = (event: any) => {
    const booking = event.resource;
    let backgroundColor = "hsl(var(--primary))";
    
    if (booking.return_completed) {
      backgroundColor = "hsl(var(--muted))";
    } else if (booking.return_confirmed) {
      backgroundColor = "hsl(142.1 76.2% 36.3%)"; // green
    }

    return {
      style: {
        backgroundColor,
        borderRadius: "4px",
        opacity: 0.9,
        color: "white",
        border: "0px",
        display: "block",
      },
    };
  };

  const handleSelectEvent = (event: any) => {
    navigate(`/contracts/${event.resource.contract_id}`);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Kalendarz zwrotów</h1>
        <p className="text-muted-foreground">
          Przegląd wszystkich zaplanowanych zwrotów kamperów
        </p>
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

      <Card>
        <CardContent className="p-6">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 700 }}
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            messages={messages}
            eventPropGetter={eventStyleGetter}
            onSelectEvent={handleSelectEvent}
          />
        </CardContent>
      </Card>
    </div>
  );
}
