import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmployeeSchedules } from "@/hooks/useEmployeeSchedules";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "moment/locale/pl";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { addDays, format, startOfWeek, endOfWeek } from "date-fns";
import { pl } from "date-fns/locale";
import { Loader2, Users, CalendarClock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
  noEventsInRange: "Brak dyżurów w tym okresie",
  showMore: (total: number) => `+${total} więcej`,
  work_week: "Tydzień roboczy",
};

export default function AdminEmployeeSchedules() {
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [currentDate, setCurrentDate] = useState(new Date());

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

  // Get all return handlers
  const { data: employees, isLoading: employeesLoading } = useQuery({
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

  // Get schedules for selected employee or all
  const { data: schedules, isLoading: schedulesLoading } = useEmployeeSchedules(
    selectedEmployee === "all" ? undefined : selectedEmployee,
    format(addDays(weekStart, -7), "yyyy-MM-dd"),
    format(addDays(weekEnd, 21), "yyyy-MM-dd")
  );

  const isLoading = employeesLoading || schedulesLoading;

  // Group schedules by employee for stats
  const schedulesByEmployee = schedules?.reduce((acc, schedule) => {
    const empId = schedule.employee_id;
    if (!acc[empId]) {
      acc[empId] = [];
    }
    acc[empId].push(schedule);
    return acc;
  }, {} as Record<string, typeof schedules>);

  // Convert schedules to calendar events
  const events = schedules?.map((schedule) => {
    const employee = employees?.find(e => e.id === schedule.employee_id);
    const date = new Date(schedule.work_date);
    
    const [startHours, startMinutes] = schedule.start_time.split(":").map(Number);
    const [endHours, endMinutes] = schedule.end_time.split(":").map(Number);
    
    const startDate = new Date(date);
    startDate.setHours(startHours, startMinutes, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(endHours, endMinutes, 0, 0);

    return {
      id: schedule.id,
      title: employee?.name || "Nieznany pracownik",
      start: startDate,
      end: endDate,
      resource: {
        ...schedule,
        employeeName: employee?.name,
      },
    };
  }) || [];

  // Custom event styling based on employee
  const eventStyleGetter = (event: any) => {
    const colors = [
      { bg: "hsl(185 70% 45%)", border: "hsl(185 70% 35%)" },
      { bg: "hsl(142 76% 45%)", border: "hsl(142 76% 35%)" },
      { bg: "hsl(262 70% 45%)", border: "hsl(262 70% 35%)" },
      { bg: "hsl(28 90% 50%)", border: "hsl(28 90% 40%)" },
      { bg: "hsl(340 75% 45%)", border: "hsl(340 75% 35%)" },
    ];

    const employeeIndex = employees?.findIndex(e => e.id === event.resource.employee_id) || 0;
    const color = colors[employeeIndex % colors.length];

    return {
      style: {
        backgroundColor: color.bg,
        borderLeft: `4px solid ${color.border}`,
        borderRadius: "4px",
        opacity: event.resource.is_available ? 0.95 : 0.5,
        color: "white",
        border: "none",
        padding: "4px 8px",
        fontSize: "0.875rem",
        fontWeight: "500",
      },
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Harmonogramy pracowników</h1>
          <p className="text-muted-foreground">
            Przegląd dostępności pracowników obsługi zwrotów
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
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CalendarClock className="h-4 w-4" />
              Łączna liczba dyżurów
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{schedules?.length || 0}</div>
            <Badge variant="outline" className="mt-2">Zaplanowane</Badge>
          </CardContent>
        </Card>

        {selectedEmployee === "all" && (
          <>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Aktywni pracownicy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{employees?.length || 0}</div>
                <Badge variant="outline" className="mt-2">Pracowników</Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Średnio dyżurów/pracownik</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {employees && schedules 
                    ? (schedules.length / employees.length).toFixed(1)
                    : "0"}
                </div>
                <Badge variant="outline" className="mt-2">Na osobę</Badge>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {selectedEmployee !== "all" && schedulesByEmployee && (
        <Card>
          <CardHeader>
            <CardTitle>Statystyki dla wybranego pracownika</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Zaplanowane dyżury</p>
                <p className="text-2xl font-bold">
                  {schedulesByEmployee[selectedEmployee]?.length || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Dostępne</p>
                <p className="text-2xl font-bold text-green-600">
                  {schedulesByEmployee[selectedEmployee]?.filter(s => s.is_available).length || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Niedostępne</p>
                <p className="text-2xl font-bold text-red-600">
                  {schedulesByEmployee[selectedEmployee]?.filter(s => !s.is_available).length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-sm">
        <CardContent className="p-4">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 800 }}
            messages={messages}
            eventPropGetter={eventStyleGetter}
            defaultView="week"
            views={['month', 'week', 'day']}
            step={60}
            timeslots={1}
            min={new Date(2024, 0, 1, 8, 0, 0)}
            max={new Date(2024, 0, 1, 20, 0, 0)}
            onNavigate={setCurrentDate}
            date={currentDate}
          />
        </CardContent>
      </Card>

      {schedules && schedules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Lista dyżurów</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {schedules.slice(0, 10).map((schedule) => {
                const employee = employees?.find(e => e.id === schedule.employee_id);
                return (
                  <div
                    key={schedule.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{employee?.name || "Nieznany pracownik"}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(schedule.work_date), "EEEE, d MMMM yyyy", { locale: pl })}
                      </p>
                      <p className="text-sm">
                        {schedule.start_time} - {schedule.end_time}
                      </p>
                      {schedule.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{schedule.notes}</p>
                      )}
                    </div>
                    <Badge variant={schedule.is_available ? "default" : "secondary"}>
                      {schedule.is_available ? "Dostępny" : "Niedostępny"}
                    </Badge>
                  </div>
                );
              })}
              {schedules.length > 10 && (
                <p className="text-sm text-muted-foreground text-center pt-2">
                  ...i {schedules.length - 10} więcej dyżurów
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
