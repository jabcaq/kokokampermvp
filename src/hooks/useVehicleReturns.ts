import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface VehicleReturn {
  id: string;
  contract_id: string;
  mileage: number;
  fuel_level: number;
  photos: any[];
  employee_name: string;
  employee_id: string | null;
  can_refund_deposit: boolean;
  deposit_refunded_cash: boolean;
  vehicle_issue: boolean;
  return_notes: string | null;
  scheduled_return_date?: string | null;
  scheduled_return_time?: string | null;
  return_confirmed?: boolean;
  return_completed?: boolean;
  booking_notes?: string | null;
  created_at: string;
  updated_at: string;
}

export const useVehicleReturns = (contractId?: string) => {
  return useQuery({
    queryKey: ["vehicle_returns", contractId],
    queryFn: async () => {
      let query = supabase.from("vehicle_returns").select("*");
      
      if (contractId) {
        query = query.eq("contract_id", contractId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as VehicleReturn[];
    },
    enabled: !!contractId,
  });
};

export const useAddVehicleReturn = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (returnData: Omit<VehicleReturn, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("vehicle_returns")
        .insert([returnData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle_returns"] });
      toast({
        title: "Sukces",
        description: "Protokół zdania został zapisany.",
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

export const useUpdateVehicleReturn = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...returnData }: Partial<VehicleReturn> & { id: string }) => {
      const { data, error } = await supabase
        .from("vehicle_returns")
        .update(returnData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle_returns"] });
      toast({
        title: "Sukces",
        description: "Protokół zdania został zaktualizowany.",
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

export const useDeleteVehicleReturn = () => {
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
      queryClient.invalidateQueries({ queryKey: ["vehicle_returns"] });
      queryClient.invalidateQueries({ queryKey: ["protocols"] });
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
