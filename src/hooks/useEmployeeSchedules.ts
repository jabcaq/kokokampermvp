import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface EmployeeSchedule {
  id: string;
  employee_id: string;
  work_date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AvailabilitySettings {
  id: string;
  max_concurrent_returns: number;
  return_duration_minutes: number;
  advance_booking_days: number;
}

export const useEmployeeSchedules = (employeeId?: string, startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: ["employee_schedules", employeeId, startDate, endDate],
    queryFn: async () => {
      let query = supabase.from("employee_schedules").select("*");
      
      if (employeeId) {
        query = query.eq("employee_id", employeeId);
      }
      if (startDate) {
        query = query.gte("work_date", startDate);
      }
      if (endDate) {
        query = query.lte("work_date", endDate);
      }
      
      const { data, error } = await query.order("work_date", { ascending: true });
      
      if (error) throw error;
      return data as EmployeeSchedule[];
    },
  });
};

export const useAvailabilitySettings = () => {
  return useQuery({
    queryKey: ["availability_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employee_availability_settings")
        .select("*")
        .single();
      
      if (error) throw error;
      return data as AvailabilitySettings;
    },
  });
};

export const useCreateSchedule = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (scheduleData: Omit<EmployeeSchedule, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("employee_schedules")
        .insert([scheduleData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee_schedules"] });
      toast({
        title: "Sukces",
        description: "Harmonogram został zapisany.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Błąd",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateSchedule = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<EmployeeSchedule> & { id: string }) => {
      const { data, error } = await supabase
        .from("employee_schedules")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee_schedules"] });
      toast({
        title: "Sukces",
        description: "Harmonogram został zaktualizowany.",
      });
    },
  });
};

export const useBulkCreateSchedules = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (schedules: Omit<EmployeeSchedule, "id" | "created_at" | "updated_at">[]) => {
      const { data, error } = await supabase
        .from("employee_schedules")
        .upsert(schedules, { onConflict: "employee_id,work_date" })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee_schedules"] });
      toast({
        title: "Sukces",
        description: "Harmonogram został zapisany.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Błąd",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
