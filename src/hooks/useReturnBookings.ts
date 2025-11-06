import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ReturnBooking {
  id: string;
  contract_id: string;
  scheduled_return_date: string;
  scheduled_return_time: string;
  return_confirmed: boolean;
  return_completed: boolean;
  booking_notes: string | null;
  mileage: number;
  fuel_level: number;
  employee_name: string;
  assigned_employee_id?: string;
  created_at: string;
  updated_at: string;
}

export const useReturnBookings = () => {
  return useQuery({
    queryKey: ["return_bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicle_returns")
        .select("*")
        .not("scheduled_return_date", "is", null)
        .order("scheduled_return_date", { ascending: true });
      
      if (error) throw error;
      return data as ReturnBooking[];
    },
  });
};

export const useCreateReturnBooking = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

    return useMutation({
      mutationFn: async (bookingData: {
        contract_id: string;
        scheduled_return_date: string;
        scheduled_return_time: string;
        booking_notes?: string;
        mileage: number;
        fuel_level: number;
        employee_name: string;
        assigned_employee_id?: string;
      }) => {
        // 1) Insert booking
        let insertResult;
        try {
          const { data, error } = await supabase
            .from("vehicle_returns")
            .insert([
              {
                ...bookingData,
                return_confirmed: false,
                return_completed: false,
              },
            ])
            .select()
            .single();

          if (error) throw error;
          insertResult = data;
        } catch (e: any) {
          console.error("Booking insert failed", e);
          throw new Error(`Booking insert failed: ${e?.message || e}`);
        }

        // 2) Create notification (non-blocking)
        try {
          const { data: contractData } = await supabase
            .from("contracts")
            .select("id, contract_number, tenant_name")
            .eq("id", bookingData.contract_id)
            .maybeSingle();

          if (contractData) {
            await supabase.from("notifications").insert({
              type: "return_scheduled",
              title: "Nowa rezerwacja zwrotu",
              message: `Zarezerwowano zwrot kampera dla umowy ${contractData.contract_number} - ${contractData.tenant_name} na ${new Date(
                bookingData.scheduled_return_date
              ).toLocaleDateString("pl-PL")} o ${bookingData.scheduled_return_time}`,
              link: `/contracts/${bookingData.contract_id}`,
            });
          }
        } catch (e) {
          console.error("Notification creation failed", e);
          // Do not block booking creation on notification error
        }

        return insertResult;
      },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["return_bookings"] });
      queryClient.invalidateQueries({ queryKey: ["vehicle_returns"] });
      toast({
        title: "Sukces",
        description: "Termin zwrotu został zarezerwowany.",
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

export const useUpdateReturnBooking = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<ReturnBooking> & { id: string }) => {
      const { data, error } = await supabase
        .from("vehicle_returns")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["return_bookings"] });
      queryClient.invalidateQueries({ queryKey: ["vehicle_returns"] });
      toast({
        title: "Sukces",
        description: "Rezerwacja została zaktualizowana.",
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

export const useCancelReturnBooking = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("vehicle_returns")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["return_bookings"] });
      queryClient.invalidateQueries({ queryKey: ["vehicle_returns"] });
      toast({
        title: "Sukces",
        description: "Rezerwacja została anulowana.",
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
