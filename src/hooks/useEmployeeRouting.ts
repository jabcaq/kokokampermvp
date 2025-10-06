import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { addMinutes, parseISO, isBefore, isAfter } from "date-fns";

interface AvailableEmployee {
  employee_id: string;
  employee_name: string;
  returns_count: number;
}

export const useAvailableEmployees = (date: string, time: string) => {
  return useQuery({
    queryKey: ["available_employees", date, time],
    queryFn: async () => {
      if (!date || !time) return [];

      // Get settings
      const { data: settings } = await supabase
        .from("employee_availability_settings")
        .select("*")
        .single();

      const maxConcurrent = settings?.max_concurrent_returns || 3;
      const durationMinutes = settings?.return_duration_minutes || 30;
      const bufferMinutes = 15;

      // Get employees working on this date
      const { data: schedules, error: schedError } = await supabase
        .from("employee_schedules")
        .select("employee_id, start_time, end_time, is_available")
        .eq("work_date", date)
        .eq("is_available", true);

      if (schedError) throw schedError;
      if (!schedules || schedules.length === 0) return [];

      // Get employee profiles
      const employeeIds = schedules.map(s => s.employee_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", employeeIds);

      // Parse requested time
      const [reqHours, reqMinutes] = time.split(":").map(Number);
      const requestedDateTime = new Date(date);
      requestedDateTime.setHours(reqHours, reqMinutes, 0, 0);

      const slotStart = requestedDateTime;
      const slotEnd = addMinutes(requestedDateTime, durationMinutes + bufferMinutes);

      // Get existing returns for this date
      const { data: existingReturns } = await supabase
        .from("vehicle_returns")
        .select("assigned_employee_id, scheduled_return_date, scheduled_return_time")
        .gte("scheduled_return_date", date)
        .lte("scheduled_return_date", date)
        .not("assigned_employee_id", "is", null);

      const availableEmployees: AvailableEmployee[] = [];

      for (const schedule of schedules) {
        // Check if employee is working during requested time
        const [startHours, startMinutes] = schedule.start_time.split(":").map(Number);
        const [endHours, endMinutes] = schedule.end_time.split(":").map(Number);
        
        const workStart = new Date(date);
        workStart.setHours(startHours, startMinutes, 0, 0);
        
        const workEnd = new Date(date);
        workEnd.setHours(endHours, endMinutes, 0, 0);

        if (isBefore(slotStart, workStart) || isAfter(slotEnd, workEnd)) {
          continue; // Employee not working at this time
        }

        // Check conflicts with existing returns
        const employeeReturns = existingReturns?.filter(
          r => r.assigned_employee_id === schedule.employee_id
        ) || [];

        let hasConflict = false;
        for (const existingReturn of employeeReturns) {
          if (!existingReturn.scheduled_return_time) continue;

          const [exHours, exMinutes] = existingReturn.scheduled_return_time.split(":").map(Number);
          const exStart = new Date(date);
          exStart.setHours(exHours, exMinutes, 0, 0);
          const exEnd = addMinutes(exStart, durationMinutes + bufferMinutes);

          // Check if times overlap
          if (
            (isBefore(slotStart, exEnd) && isAfter(slotEnd, exStart)) ||
            slotStart.getTime() === exStart.getTime()
          ) {
            hasConflict = true;
            break;
          }
        }

        if (!hasConflict) {
          const profile = profiles?.find(p => p.id === schedule.employee_id);
          availableEmployees.push({
            employee_id: schedule.employee_id,
            employee_name: profile?.full_name || "Nieznany pracownik",
            returns_count: employeeReturns.length,
          });
        }
      }

      // Sort by returns count (assign to least busy employee)
      return availableEmployees.sort((a, b) => a.returns_count - b.returns_count);
    },
    enabled: !!date && !!time,
  });
};
