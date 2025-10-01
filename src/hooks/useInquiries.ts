import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  status: 'new' | 'in_progress' | 'completed' | 'archived';
  created_at?: string;
  updated_at?: string;
}

export const useInquiries = () => {
  return useQuery({
    queryKey: ['inquiries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inquiries')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Inquiry[];
    },
  });
};

export const useAddInquiry = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (inquiry: Omit<Inquiry, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('inquiries')
        .insert([inquiry])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inquiries'] });
    },
  });
};

export const useUpdateInquiryStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Inquiry['status'] }) => {
      const { data, error } = await supabase
        .from('inquiries')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inquiries'] });
    },
  });
};
