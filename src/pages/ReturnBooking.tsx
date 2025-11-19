import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateReturnBooking } from "@/hooks/useReturnBookings";
import { useAvailableEmployees } from "@/hooks/useEmployeeRouting";
import { Clock, MapPin, Globe, CheckCircle2, AlertCircle, UserCheck } from "lucide-react";
import { format, isAfter, startOfDay } from "date-fns";
import { pl, enUS } from "date-fns/locale";
import { Alert, AlertDescription } from "@/components/ui/alert";
import logoImage from "@/assets/koko-logo.jpeg";

const translations = {
  pl: {
    title: "Zwrot kampera",
    subtitle: "Wybierz dogodny termin zwrotu kampera",
    duration: "Czas trwania",
    minutes: "30 minut",
    location: "Lokalizacja",
    company: "Siedziba firmy",
    timezone: "Strefa czasowa",
    contractDetails: "Szczegóły umowy:",
    number: "Numer:",
    tenant: "Najemca:",
    vehicle: "Pojazd:",
    returnDate: "Data zwrotu:",
    rentalPeriod: "Okres najmu:",
    selectDate: "Wybierz datę",
    selectTime: "Wybierz godzinę:",
    notes: "Dodatkowe uwagi (opcjonalnie)",
    notesPlaceholder: "Np. potrzebuję pomocy przy rozładunku...",
    confirmBooking: "Potwierdź rezerwację",
    confirmed: "Rezerwacja potwierdzona!",
    confirmedDesc: "Twoja rezerwacja zwrotu kampera została przyjęta. Skontaktujemy się z Tobą w celu potwierdzenia.",
    bookingDetails: "Szczegóły rezerwacji:",
    date: "Data:",
    time: "Godzina:",
    contract: "Umowa:",
    lateWarning: "UWAGA! Wybrałeś datę późniejszą niż data zakończenia wynajmu. Zostaniesz obciążony dodatkową opłatą. Musisz natychmiast skontaktować się pod numerem:",
    noStaff: "Niestety, w wybranym terminie nie ma dostępnych pracowników. Wybierz inną godzinę lub datę.",
    handledBy: "Zwrot będzie obsługiwany przez:"
  },
  en: {
    title: "Camper Return",
    subtitle: "Choose a convenient time to return the camper",
    duration: "Duration",
    minutes: "30 minutes",
    location: "Location",
    company: "Company Headquarters",
    timezone: "Time Zone",
    contractDetails: "Contract Details:",
    number: "Number:",
    tenant: "Tenant:",
    vehicle: "Vehicle:",
    returnDate: "Return Date:",
    rentalPeriod: "Rental Period:",
    selectDate: "Select a date",
    selectTime: "Select a time:",
    notes: "Additional notes (optional)",
    notesPlaceholder: "E.g. I need help with unloading...",
    confirmBooking: "Confirm Booking",
    confirmed: "Booking Confirmed!",
    confirmedDesc: "Your camper return booking has been received. We will contact you for confirmation.",
    bookingDetails: "Booking Details:",
    date: "Date:",
    time: "Time:",
    contract: "Contract:",
    lateWarning: "WARNING! You have selected a date later than the rental end date. You will be charged an additional fee. You must immediately contact:",
    noStaff: "Unfortunately, there are no available staff at the selected time. Please choose another time or date.",
    handledBy: "Return will be handled by:"
  }
};

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00"
];

export default function ReturnBooking() {
  const { contractId } = useParams();
  const [searchParams] = useSearchParams();
  const contractNumber = searchParams.get("contractNumber") || "";
  const tenantName = searchParams.get("tenantName") || "";
  const vehicleModel = searchParams.get("vehicleModel") || "";
  
  const startDateStr = searchParams.get("startDate");
  const endDateStr = searchParams.get("endDate");
  const startDateParsed = startDateStr ? new Date(startDateStr) : null;
  const endDateParsed = endDateStr ? new Date(endDateStr) : null;

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    endDateParsed && !isNaN(endDateParsed.getTime()) ? startOfDay(endDateParsed) : undefined
  );
  const [selectedTime, setSelectedTime] = useState<string>();
  const [notes, setNotes] = useState("");
  const [isBooked, setIsBooked] = useState(false);
  const [language, setLanguage] = useState<'pl' | 'en'>('pl');
  
  const t = translations[language];
  const locale = language === 'pl' ? pl : enUS;

  const createBooking = useCreateReturnBooking();

  const { data: availableEmployees } = useAvailableEmployees(
    selectedDate ? format(selectedDate, "yyyy-MM-dd") : "",
    selectedTime || ""
  );

  const hasAvailableStaff = availableEmployees && availableEmployees.length > 0;

  const minDate = endDateParsed && !isNaN(endDateParsed.getTime()) 
    ? startOfDay(endDateParsed) 
    : new Date();
  
  const isLateReturn = selectedDate && endDateParsed && !isNaN(endDateParsed.getTime())
    ? isAfter(startOfDay(selectedDate), startOfDay(endDateParsed))
    : false;

  const handleConfirm = () => {
    if (!selectedDate || !selectedTime || !contractId || !hasAvailableStaff) return;

    const bookingDateTime = new Date(selectedDate);
    const [hours, minutes] = selectedTime.split(":");
    bookingDateTime.setHours(parseInt(hours), parseInt(minutes));

    const assignedEmployee = availableEmployees![0];

    createBooking.mutate({
      contract_id: contractId,
      scheduled_return_date: bookingDateTime.toISOString(),
      scheduled_return_time: selectedTime,
      booking_notes: notes || null,
      mileage: 0,
      fuel_level: 0,
      employee_name: assignedEmployee.employee_name,
      assigned_employee_id: assignedEmployee.employee_id,
    }, {
      onSuccess: () => {
        setIsBooked(true);
      }
    });
  };

  if (isBooked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
            <h1 className="text-2xl font-bold">{t.confirmed}</h1>
            <p className="text-muted-foreground">
              {t.confirmedDesc}
            </p>
            <div className="pt-4 space-y-2 text-sm">
              <p className="font-semibold">{t.bookingDetails}</p>
              <p><strong>{t.date}</strong> {selectedDate && format(selectedDate, "dd.MM.yyyy", { locale })}</p>
              <p><strong>{t.time}</strong> {selectedTime}</p>
              <p><strong>{t.contract}</strong> {contractNumber}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <Card className="overflow-hidden">
          <div className="grid md:grid-cols-[420px,1fr]">
            <div className="p-8 border-r bg-background">
              <div className="space-y-6">
                <div className="flex flex-col items-center pb-4 border-b">
                  <img src={logoImage} alt="Koko Kamper" className="h-20 w-auto mb-4" />
                  <div className="flex gap-2 mb-4">
                    <Button
                      variant={language === 'pl' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setLanguage('pl')}
                      className="w-12 h-12 p-0 text-2xl"
                    >
                      🇵🇱
                    </Button>
                    <Button
                      variant={language === 'en' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setLanguage('en')}
                      className="w-12 h-12 p-0 text-2xl"
                    >
                      🇬🇧
                    </Button>
                  </div>
                  <h1 className="text-2xl font-bold text-center">{t.title}</h1>
                  <p className="text-muted-foreground text-sm text-center mt-2">
                    {t.subtitle}
                  </p>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{t.minutes}</p>
                      <p className="text-xs text-muted-foreground">{t.duration}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{t.company}</p>
                      <p className="text-xs text-muted-foreground">{t.location}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Europe / Warsaw</p>
                      <p className="text-xs text-muted-foreground">{t.timezone}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-2">
                  <h3 className="font-semibold text-sm">{t.contractDetails}</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-muted-foreground">{t.number}</span> <strong>{contractNumber}</strong></p>
                    <p><span className="text-muted-foreground">{t.tenant}</span> {tenantName}</p>
                    <p><span className="text-muted-foreground">{t.vehicle}</span> {vehicleModel}</p>
                    {endDateParsed && !isNaN(endDateParsed.getTime()) && (
                      <p><span className="text-muted-foreground">{t.returnDate}</span> <strong>{format(endDateParsed, "dd.MM.yyyy HH:mm")}</strong></p>
                    )}
                    {startDateParsed && endDateParsed && !isNaN(startDateParsed.getTime()) && !isNaN(endDateParsed.getTime()) && (
                      <p className="text-xs text-muted-foreground pt-2">
                        {t.rentalPeriod} {format(startDateParsed, "dd.MM.yyyy")} - {format(endDateParsed, "dd.MM.yyyy")}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold mb-6">
                    {selectedDate 
                      ? format(selectedDate, "EEEE, d MMMM yyyy", { locale })
                      : t.selectDate
                    }
                  </h2>
                  
                  <div className="flex justify-center">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => date < minDate}
                      className="rounded-md border-0 scale-110"
                      modifiers={{
                        contractEnd: endDateParsed && !isNaN(endDateParsed.getTime()) 
                          ? startOfDay(endDateParsed) 
                          : new Date(0)
                      }}
                      modifiersClassNames={{
                        contractEnd: "bg-primary/20 font-bold ring-2 ring-primary ring-offset-2"
                      }}
                    />
                  </div>
                </div>

                {isLateReturn && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {t.lateWarning}{" "}
                      <a href="tel:+48660694257" className="font-bold underline">+48 660 694 257</a>
                    </AlertDescription>
                  </Alert>
                )}

                {selectedDate && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-semibold">{t.selectTime}</Label>
                      <div className="grid grid-cols-3 gap-2 mt-3">
                        {TIME_SLOTS.map((time) => (
                          <Button
                            key={time}
                            variant={selectedTime === time ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedTime(time)}
                            className="w-full"
                          >
                            {time}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {selectedTime && !hasAvailableStaff && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          {t.noStaff}
                        </AlertDescription>
                      </Alert>
                    )}

                    {selectedTime && hasAvailableStaff && (
                      <Alert>
                        <UserCheck className="h-4 w-4" />
                        <AlertDescription>
                          {t.handledBy} <strong>{availableEmployees![0].employee_name}</strong>
                        </AlertDescription>
                      </Alert>
                    )}

                    {selectedTime && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="notes">{t.notes}</Label>
                          <Textarea
                            id="notes"
                            placeholder={t.notesPlaceholder}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                          />
                        </div>

                        <Button 
                          onClick={handleConfirm} 
                          className="w-full"
                          size="lg"
                          disabled={createBooking.isPending || !hasAvailableStaff}
                        >
                          {t.confirmBooking}
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}