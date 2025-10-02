import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ContractInvoice {
  id: string;
  contract_id: string;
  invoice_type: 'reservation' | 'main_payment' | 'final';
  amount: number;
  status: 'pending' | 'submitted' | 'invoice_uploaded' | 'completed';
  submitted_at: string | null;
  invoice_file_url: string | null;
  invoice_uploaded_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const useContractInvoices = (contractId: string | undefined) => {
  return useQuery({
    queryKey: ['contract-invoices', contractId],
    queryFn: async () => {
      if (!contractId) return [];
      const { data, error } = await supabase
        .from('contract_invoices')
        .select('*')
        .eq('contract_id', contractId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ContractInvoice[];
    },
    enabled: !!contractId,
  });
};

export const useAddContractInvoice = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (invoice: Omit<ContractInvoice, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('contract_invoices')
        .insert([invoice])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contract-invoices', variables.contract_id] });
    },
  });
};

export const useUpdateContractInvoice = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ContractInvoice> }) => {
      const { data, error } = await supabase
        .from('contract_invoices')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contract-invoices', data.contract_id] });
    },
  });
};

export const useContractInvoice = (invoiceId: string | undefined) => {
  return useQuery({
    queryKey: ['contract-invoice', invoiceId],
    queryFn: async () => {
      if (!invoiceId) return null;
      const { data, error } = await supabase
        .from('contract_invoices')
        .select(`
          *,
          contract:contracts(
            contract_number,
            tenant_company_name,
            tenant_name,
            tenant_email,
            tenant_phone
          )
        `)
        .eq('id', invoiceId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!invoiceId,
  });
};
