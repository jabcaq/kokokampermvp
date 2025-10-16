import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Contract {
  id: string;
  contract_number: string;
  client_id: string;
  vehicle_model: string;
  registration_number: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'pending' | 'completed' | 'cancelled';
  value: number | null;
  is_full_payment_as_reservation?: boolean;
  tenant_company_name?: string;
  lessor_name?: string;
  lessor_address?: string;
  lessor_phone?: string;
  lessor_website?: string;
  lessor_email?: string;
  tenant_name?: string;
  tenant_email?: string;
  tenant_phone?: string;
  tenant_address?: string;
  tenant_id_type?: string;
  tenant_id_number?: string;
  tenant_id_issuer?: string;
  tenant_pesel?: string;
  tenant_nip?: string;
  tenant_license_number?: string;
  tenant_license_date?: string;
  umowa_text?: string;
  vehicle_vin?: string;
  vehicle_next_inspection?: string;
  vehicle_insurance_number?: string;
  vehicle_insurance_valid_until?: string;
  vehicle_additional_info?: string;
  vehicle_cleaning?: string;
  vehicle_animals?: string;
  vehicle_extra_equipment?: string;
  additional_drivers?: any[];
  payments?: any;
  notes?: string;
  handover_link?: string;
  return_link?: string;
  driver_submission_link?: string;
  invoice_type?: 'receipt' | 'invoice';
  inquiry_id?: string | null;
  inquiry_number?: string | null;
  created_at?: string;
  updated_at?: string;
}

export const useContracts = () => {
  return useQuery({
    queryKey: ['contracts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          client:clients(name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
};

export const useContract = (id: string | undefined) => {
  return useQuery({
    queryKey: ['contract', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          client:clients(*)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
};

export const useContractByNumber = (contractNumber: string | undefined) => {
  return useQuery({
    queryKey: ['contract', 'number', contractNumber],
    queryFn: async () => {
      if (!contractNumber) return null;
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          client:clients(*)
        `)
        .eq('contract_number', contractNumber)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!contractNumber,
  });
};

export const useContractsByClient = (clientId: string | undefined) => {
  return useQuery({
    queryKey: ['contracts', 'client', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Contract[];
    },
    enabled: !!clientId,
  });
};

export const useAddContract = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (contract: Omit<Contract, 'id' | 'created_at' | 'updated_at'>) => {
      // First, create the contract
      const { data: newContract, error } = await supabase
        .from('contracts')
        .insert([contract])
        .select()
        .single();
      
      if (error) throw error;
      
      // Generate links for handover, return, and driver submission
      const baseUrl = window.location.origin;
      const handoverLink = `${baseUrl}/vehicle-handover/${newContract.id}`;
      const returnLink = `${baseUrl}/vehicle-return/${newContract.id}`;
      const driverSubmissionLink = `${baseUrl}/driver-submission/${newContract.id}`;
      
      // Update the contract with generated links
      const { data: updatedContract, error: updateError } = await supabase
        .from('contracts')
        .update({
          handover_link: handoverLink,
          return_link: returnLink,
          driver_submission_link: driverSubmissionLink,
        })
        .eq('id', newContract.id)
        .select()
        .single();
      
      if (updateError) throw updateError;
      
      return updatedContract;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
  });
};

export const useUpdateContract = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Contract> }) => {
      const { data, error } = await supabase
        .from('contracts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['contract', variables.id] });
    },
  });
};

export const useDeleteContract = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contracts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
  });
};
