import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface VehicleHandover {
  id: string;
  contract_id: string;
  mileage: number;
  fuel_level: number;
  handover_protocol_files: any[];
  photos: any[];
  created_at: string;
  updated_at: string;
}

export const useVehicleHandovers = (contractId?: string) => {
  return useQuery({
    queryKey: ["vehicle_handovers", contractId],
    queryFn: async () => {
      let query = supabase.from("vehicle_handovers").select("*");
      
      if (contractId) {
        query = query.eq("contract_id", contractId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as VehicleHandover[];
    },
    enabled: !!contractId,
  });
};

export const useAddVehicleHandover = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (handover: Omit<VehicleHandover, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("vehicle_handovers")
        .insert([handover])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle_handovers"] });
      toast({
        title: "Sukces",
        description: "Protokół wydania został zapisany.",
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
