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
  number_of_travelers?: number;
  additional_drivers?: any[];
  payments?: any;
  notes?: string;
  handover_link?: string;
  return_link?: string;
  employee_return_link?: string;
  driver_submission_link?: string;
  invoice_type?: 'receipt' | 'invoice';
  inquiry_id?: string | null;
  inquiry_number?: string | null;
  deposit_received?: boolean;
  deposit_received_at?: string | null;
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
        .eq('is_archived', false)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
};

export const useArchivedContracts = () => {
  return useQuery({
    queryKey: ['contracts', 'archived'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          client:clients(name)
        `)
        .eq('is_archived', true)
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
      const baseUrl = 'https://app.kokokamper.pl';
      const handoverLink = `${baseUrl}/vehicle-handover/${newContract.id}`;
      const returnLink = `${baseUrl}/return-booking?contractId=${newContract.id}&contractNumber=${encodeURIComponent(newContract.contract_number)}&startDate=${newContract.start_date}&endDate=${newContract.end_date}`;
      const employeeReturnLink = `${baseUrl}/vehicle-return?contractId=${newContract.id}&contractNumber=${encodeURIComponent(newContract.contract_number)}&vehicleModel=${encodeURIComponent(newContract.vehicle_model)}&registrationNumber=${newContract.registration_number}&startDate=${newContract.start_date}&endDate=${newContract.end_date}`;
      const driverSubmissionLink = `${baseUrl}/driver-submission/${newContract.id}`;
      
      // Update the contract with generated links
      const { data: updatedContract, error: updateError } = await supabase
        .from('contracts')
        .update({
          handover_link: handoverLink,
          return_link: returnLink,
          employee_return_link: employeeReturnLink,
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

export const useArchiveContract = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contracts')
        .update({ is_archived: true })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
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
      queryClient.invalidateQueries({ queryKey: ['contracts', 'archived'] });
    },
  });
};

export const useRestoreContract = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (contractId: string) => {
      // Get the archived contract
      const { data: contract, error: fetchError } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', contractId)
        .single();
      
      if (fetchError) throw fetchError;
      if (!contract) throw new Error('Contract not found');
      
      // Check if documents were generated for this contract
      const { data: documents, error: docsError } = await supabase
        .from('contract_documents')
        .select('id')
        .eq('contract_id', contractId)
        .limit(1);
      
      if (docsError) throw docsError;
      
      const hasDocuments = documents && documents.length > 0;
      
      // Check if contract number already exists in active contracts
      const { data: existingContract, error: checkError } = await supabase
        .from('contracts')
        .select('id')
        .eq('contract_number', contract.contract_number)
        .eq('is_archived', false)
        .maybeSingle();
      
      if (checkError) throw checkError;
      
      let newContractNumber = contract.contract_number;
      
      // If documents were generated OR contract number already exists, generate new number
      if (hasDocuments || existingContract) {
        // Extract type prefix from contract number (K or P)
        const parts = contract.contract_number.split('/');
        const typePrefix = parts[0]; // K or P
        const year = new Date().getFullYear();
        
        // Get last contract number for this type and year
        const { data: lastContracts } = await supabase
          .from('contracts')
          .select('contract_number')
          .like('contract_number', `${typePrefix}/%/${year}`)
          .order('created_at', { ascending: false })
          .limit(1);
        
        let nextNumber = 1;
        if (lastContracts && lastContracts.length > 0) {
          const lastParts = lastContracts[0].contract_number.split('/');
          if (lastParts.length === 3) {
            nextNumber = parseInt(lastParts[1]) + 1;
          }
        }
        
        newContractNumber = `${typePrefix}/${nextNumber}/${year}`;
      }
      
      // Restore the contract
      const { error: updateError } = await supabase
        .from('contracts')
        .update({ 
          is_archived: false,
          contract_number: newContractNumber 
        })
        .eq('id', contractId);
      
      if (updateError) throw updateError;
      
      return { 
        contractId, 
        oldNumber: contract.contract_number, 
        newNumber: newContractNumber,
        numberChanged: newContractNumber !== contract.contract_number
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['contracts', 'archived'] });
    },
  });
};
