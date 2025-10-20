import { useState } from "react";
import { Calendar, momentLocalizer, Event } from "react-big-calendar";
import moment from "moment";
import "moment/locale/pl";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useContracts } from "@/hooks/useContracts";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

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
  event: "Wydarzenie",
  noEventsInRange: "Brak rezerwacji w tym okresie",
  showMore: (total: number) => `+${total} więcej`,
};

interface BookingEvent extends Event {
  id: string;
  contractNumber: string;
  vehicleModel: string;
  registrationNumber: string;
  clientName: string;
  status: string;
  value: number;
  color: string;
  start: Date;
  end: Date;
}

const statusColors: Record<string, string> = {
  pending: "hsl(var(--warning))",
  active: "hsl(var(--success))",
  completed: "hsl(var(--muted))",
  cancelled: "hsl(var(--destructive))",
};

const generateColor = (index: number): string => {
  const hues = [210, 340, 270, 140, 30, 180, 300, 60, 200, 330];
  const hue = hues[index % hues.length];
  return `hsl(${hue}, 70%, 55%)`;
};

export default function BookingsCalendar() {
  const [view, setView] = useState<"month" | "week" | "day" | "agenda">("month");
  const [date, setDate] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState<BookingEvent | null>(null);

  const { data: contracts, isLoading } = useContracts();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const events: BookingEvent[] =
    contracts?.map((contract, index) => ({
      id: contract.id,
      title: `${contract.vehicle_model} - ${contract.contract_number}`,
      start: new Date(contract.start_date),
      end: new Date(contract.end_date),
      contractNumber: contract.contract_number,
      vehicleModel: contract.vehicle_model,
      registrationNumber: contract.registration_number,
      clientName: contract.client?.name || "Brak danych",
      status: contract.status,
      value: contract.value || 0,
      color: generateColor(index),
    })) || [];

  const eventStyleGetter = (event: BookingEvent) => {
    return {
      style: {
        backgroundColor: event.color,
        borderRadius: "4px",
        opacity: 0.9,
        color: "white",
        border: "0px",
        display: "block",
        fontSize: "0.85rem",
        fontWeight: "500",
      },
    };
  };

  const handleSelectEvent = (event: BookingEvent) => {
    setSelectedBooking(event);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Kalendarz Rezerwacji</h1>
        <p className="text-muted-foreground mt-2">
          Przegląd wszystkich rezerwacji pojazdów
        </p>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {contracts?.filter((c) => c.status === "pending").length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Oczekujące</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {contracts?.filter((c) => c.status === "active").length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Aktywne</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {contracts?.filter((c) => c.status === "completed").length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Zakończone</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{contracts?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Wszystkie</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 700 }}
            messages={messages}
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            eventPropGetter={eventStyleGetter}
            onSelectEvent={handleSelectEvent}
            popup
            selectable
          />
        </CardContent>
      </Card>

      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Szczegóły Rezerwacji</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Numer umowy</div>
                <div className="font-semibold">{selectedBooking.contractNumber}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Pojazd</div>
                <div className="font-semibold">{selectedBooking.vehicleModel}</div>
                <div className="text-sm text-muted-foreground">
                  {selectedBooking.registrationNumber}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Klient</div>
                <div className="font-semibold">{selectedBooking.clientName}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Okres wynajmu</div>
                <div className="font-semibold">
                  {moment(selectedBooking.start).format("DD.MM.YYYY")} -{" "}
                  {moment(selectedBooking.end).format("DD.MM.YYYY")}
                </div>
                <div className="text-sm text-muted-foreground">
                  ({moment(selectedBooking.end).diff(moment(selectedBooking.start), "days")}{" "}
                  dni)
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Wartość</div>
                <div className="font-semibold">
                  {selectedBooking.value.toLocaleString("pl-PL", {
                    style: "currency",
                    currency: "PLN",
                  })}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Status</div>
                <Badge
                  variant={
                    selectedBooking.status === "active"
                      ? "default"
                      : selectedBooking.status === "completed"
                      ? "secondary"
                      : "outline"
                  }
                >
                  {selectedBooking.status === "pending"
                    ? "Oczekująca"
                    : selectedBooking.status === "active"
                    ? "Aktywna"
                    : selectedBooking.status === "completed"
                    ? "Zakończona"
                    : selectedBooking.status}
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
