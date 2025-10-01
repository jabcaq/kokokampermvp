import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Document {
  id: string;
  rodzaj: string;
  contract_id: string | null;
  umowa_id: string | null;
  client_id: string | null;
  folder: string | null;
  nazwa_pliku: string;
  link: string | null;
  path: string | null;
  data: string | null;
  rok: number | null;
  created_at: string;
  updated_at: string;
  contract?: {
    contract_number: string;
    tenant_name: string;
  };
  client?: {
    name: string;
  };
}

export const useDocuments = () => {
  return useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          contract:contracts(contract_number, tenant_name),
          client:clients(name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Document[];
    },
  });
};

export const useAddDocument = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (document: Omit<Document, 'id' | 'created_at' | 'updated_at' | 'contract' | 'client'>) => {
      const { data, error } = await supabase
        .from('documents')
        .insert([document])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
};

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
};

export const useUpdateDocument = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Document> }) => {
      const { data, error } = await supabase
        .from('documents')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
};