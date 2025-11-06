import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface VehicleDocument {
  id: string;
  vehicle_id: string;
  document_type: string;
  file_name: string;
  file_url?: string;
  issue_date?: string;
  expiry_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const useVehicleDocuments = (vehicleId: string | undefined) => {
  return useQuery({
    queryKey: ["vehicle_documents", vehicleId],
    queryFn: async () => {
      if (!vehicleId) return [];
      const { data, error } = await supabase
        .from("vehicle_documents")
        .select("*")
        .eq("vehicle_id", vehicleId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as VehicleDocument[];
    },
    enabled: !!vehicleId,
  });
};

export const useAddVehicleDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (document: Omit<VehicleDocument, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("vehicle_documents")
        .insert(document)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["vehicle_documents", variables.vehicle_id] });
      toast.success("Dokument został dodany");
    },
    onError: () => {
      toast.error("Nie udało się dodać dokumentu");
    },
  });
};

export const useUpdateVehicleDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<VehicleDocument> }) => {
      const { data, error } = await supabase
        .from("vehicle_documents")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["vehicle_documents", data.vehicle_id] });
      toast.success("Dokument został zaktualizowany");
    },
    onError: () => {
      toast.error("Nie udało się zaktualizować dokumentu");
    },
  });
};

export const useDeleteVehicleDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, vehicleId }: { id: string; vehicleId: string }) => {
      const { error } = await supabase
        .from("vehicle_documents")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      return { vehicleId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["vehicle_documents", result.vehicleId] });
      toast.success("Dokument został usunięty");
    },
    onError: () => {
      toast.error("Nie udało się usunąć dokumentu");
    },
  });
};
