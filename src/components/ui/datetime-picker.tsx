import * as React from "react";
import { format } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { pl } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";

const WARSAW_TZ = "Europe/Warsaw";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DateTimePickerProps {
  date?: Date;
  setDate: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
}

export function DateTimePicker({
  date,
  setDate,
  placeholder = "Wybierz datę i godzinę",
  className,
}: DateTimePickerProps) {
  const [selectedDateTime, setSelectedDateTime] = React.useState<Date | undefined>(
    date ? toZonedTime(date, WARSAW_TZ) : undefined
  );
  const [isOpen, setIsOpen] = React.useState(false);

  const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 8-20
  const minutes = [0, 15, 30, 45];

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) return;
    
    const warsawDate = toZonedTime(selectedDate, WARSAW_TZ);
    if (selectedDateTime) {
      warsawDate.setHours(selectedDateTime.getHours());
      warsawDate.setMinutes(selectedDateTime.getMinutes());
    } else {
      warsawDate.setHours(10);
      warsawDate.setMinutes(0);
    }
    setSelectedDateTime(warsawDate);
    
    // Automatically save to parent when date changes
    const utcDate = fromZonedTime(warsawDate, WARSAW_TZ);
    setDate(utcDate);
  };

  const handleHourChange = (hour: number) => {
    const newDateTime = selectedDateTime ? new Date(selectedDateTime) : toZonedTime(new Date(), WARSAW_TZ);
    newDateTime.setHours(hour);
    setSelectedDateTime(newDateTime);
    
    // Automatically save to parent when hour changes
    const utcDate = fromZonedTime(newDateTime, WARSAW_TZ);
    setDate(utcDate);
  };

  const handleMinuteChange = (minute: number) => {
    const newDateTime = selectedDateTime ? new Date(selectedDateTime) : toZonedTime(new Date(), WARSAW_TZ);
    newDateTime.setMinutes(minute);
    setSelectedDateTime(newDateTime);
    
    // Automatically save to parent when minute changes
    const utcDate = fromZonedTime(newDateTime, WARSAW_TZ);
    setDate(utcDate);
  };

  const handleConfirm = () => {
    if (selectedDateTime) {
      // Convert Warsaw time to UTC for storage
      const utcDate = fromZonedTime(selectedDateTime, WARSAW_TZ);
      setDate(utcDate);
    }
    setIsOpen(false);
  };

  const handleClear = () => {
    setSelectedDateTime(undefined);
    setDate(undefined);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? (
            format(toZonedTime(date, WARSAW_TZ), "dd.MM.yyyy, HH:mm", { locale: pl })
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          <Calendar
            mode="single"
            selected={selectedDateTime}
            onSelect={handleDateSelect}
            initialFocus
            className="pointer-events-auto"
            locale={pl}
          />
          <div className="flex flex-col gap-2 border-l px-3 py-4">
            <div className="flex gap-2">
              <div className="flex flex-col items-center">
                <div className="text-sm font-medium mb-2">Godzina</div>
                <ScrollArea className="h-[200px] w-[60px]">
                  <div className="flex flex-col gap-1">
                    {hours.map((hour) => (
                      <Button
                        key={hour}
                        variant={selectedDateTime?.getHours() === hour ? "default" : "ghost"}
                        className="h-8 w-full"
                        onClick={() => handleHourChange(hour)}
                      >
                        {hour.toString().padStart(2, "0")}
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-sm font-medium mb-2">Minuta</div>
                <ScrollArea className="h-[200px] w-[60px]">
                  <div className="flex flex-col gap-1">
                    {minutes.map((minute) => (
                      <Button
                        key={minute}
                        variant={selectedDateTime?.getMinutes() === minute ? "default" : "ghost"}
                        className="h-8 w-full"
                        onClick={() => handleMinuteChange(minute)}
                      >
                        {minute.toString().padStart(2, "0")}
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
            <div className="flex gap-2 mt-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleClear}
              >
                Wyczyść
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={handleConfirm}
              >
                OK
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
