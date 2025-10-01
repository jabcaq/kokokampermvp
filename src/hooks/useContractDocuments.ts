import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ContractDocument {
  id: string;
  contract_id: string;
  document_type: string;
  status: string;
  generated_at: string | null;
  sent_at: string | null;
  sent_to_email: string | null;
  file_url: string | null;
  created_at: string;
  updated_at: string;
}

export const useContractDocuments = (contractId: string | undefined) => {
  return useQuery({
    queryKey: ['contract-documents', contractId],
    queryFn: async () => {
      if (!contractId) return [];
      const { data, error } = await supabase
        .from('contract_documents')
        .select('*')
        .eq('contract_id', contractId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ContractDocument[];
    },
    enabled: !!contractId,
  });
};

export const useAddContractDocument = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (document: Omit<ContractDocument, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('contract_documents')
        .insert([document])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contract-documents', variables.contract_id] });
    },
  });
};

export const useUpdateContractDocument = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ContractDocument> }) => {
      const { data, error } = await supabase
        .from('contract_documents')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contract-documents', data.contract_id] });
    },
  });
};
