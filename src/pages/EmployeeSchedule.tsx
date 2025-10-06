import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useEmployeeSchedules, useBulkCreateSchedules } from "@/hooks/useEmployeeSchedules";
import { useAuth } from "@/contexts/AuthContext";
import { addDays, format, startOfDay } from "date-fns";
import { pl } from "date-fns/locale";
import { Loader2, CalendarDays, Clock } from "lucide-react";
import { toast } from "sonner";

export default function EmployeeSchedule() {
  const { user } = useAuth();
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [notes, setNotes] = useState("");

  const today = startOfDay(new Date());
  const maxDate = addDays(today, 30);

  const { data: schedules, isLoading } = useEmployeeSchedules(
    user?.id,
    format(today, "yyyy-MM-dd"),
    format(maxDate, "yyyy-MM-dd")
  );

  const bulkCreate = useBulkCreateSchedules();

  const handleSave = () => {
    if (!user?.id || selectedDates.length === 0) {
      toast.error("Wybierz przynajmniej jedną datę");
      return;
    }

    const schedulesToCreate = selectedDates.map(date => ({
      employee_id: user.id,
      work_date: format(date, "yyyy-MM-dd"),
      start_time: startTime,
      end_time: endTime,
      is_available: true,
      notes: notes || null,
    }));

    bulkCreate.mutate(schedulesToCreate, {
      onSuccess: () => {
        setSelectedDates([]);
        setNotes("");
      },
    });
  };

  const scheduledDates = schedules?.map(s => new Date(s.work_date)) || [];

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
          <h1 className="text-3xl font-bold">Mój harmonogram pracy</h1>
          <p className="text-muted-foreground">
            Zaplanuj swoją dostępność do obsługi zwrotów kamperów
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Wybierz dni pracy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="multiple"
              selected={selectedDates}
              onSelect={(dates) => setSelectedDates(dates || [])}
              disabled={(date) => date < today || date > maxDate}
              modifiers={{
                scheduled: scheduledDates,
              }}
              modifiersStyles={{
                scheduled: {
                  backgroundColor: "hsl(var(--primary))",
                  color: "white",
                  fontWeight: "bold",
                },
              }}
              className="rounded-md border"
            />
            <p className="text-sm text-muted-foreground mt-4">
              💡 Dni oznaczone kolorem to już zaplanowane dyżury
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Godziny pracy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="start-time">Godzina rozpoczęcia</Label>
              <Input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-time">Godzina zakończenia</Label>
              <Input
                id="end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Uwagi (opcjonalnie)</Label>
              <Textarea
                id="notes"
                placeholder="Np. dostępny tylko do obsługi 2 zwrotów..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="pt-4">
              <p className="text-sm mb-4">
                Wybranych dni: <strong>{selectedDates.length}</strong>
              </p>
              <Button
                onClick={handleSave}
                disabled={selectedDates.length === 0 || bulkCreate.isPending}
                className="w-full"
              >
                {bulkCreate.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Zapisywanie...
                  </>
                ) : (
                  "Zapisz harmonogram"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Moje zaplanowane dyżury</CardTitle>
        </CardHeader>
        <CardContent>
          {schedules && schedules.length > 0 ? (
            <div className="space-y-2">
              {schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {format(new Date(schedule.work_date), "EEEE, d MMMM yyyy", { locale: pl })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {schedule.start_time} - {schedule.end_time}
                    </p>
                    {schedule.notes && (
                      <p className="text-xs text-muted-foreground mt-1">{schedule.notes}</p>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {schedule.is_available ? "Dostępny" : "Niedostępny"}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Nie masz jeszcze zaplanowanych dyżurów
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
