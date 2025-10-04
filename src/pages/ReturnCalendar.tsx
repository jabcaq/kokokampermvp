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
  noEventsInRange: "Brak zwrotów w tym okresie",
  showMore: (total: number) => `+${total} więcej`,
  work_week: "Tydzień roboczy",
};

export default function ReturnCalendar() {
  const { data: bookings, isLoading } = useReturnBookings();
  const [view, setView] = useState<View>("week");
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

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Kalendarz zwrotów</h1>
          <p className="text-muted-foreground">
            Przegląd wszystkich zaplanowanych zwrotów kamperów
          </p>
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
          />
        </CardContent>
      </Card>
    </div>
  );
}
