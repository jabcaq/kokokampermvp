import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface NotificationLog {
  id: string;
  notification_type: string;
  notification_title: string;
  action_description: string;
  user_id: string | null;
  user_email: string | null;
  contract_id: string | null;
  contract_number: string | null;
  inquiry_id: string | null;
  inquiry_number: string | null;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export const useNotificationLogs = (filters?: {
  type?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}) => {
  return useQuery({
    queryKey: ['notification-logs', filters],
    queryFn: async () => {
      let query = supabase
        .from('notification_logs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (filters?.type) {
        query = query.eq('notification_type', filters.type);
      }
      
      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      }
      
      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      
      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as NotificationLog[];
    },
  });
};

export const useCreateNotificationLog = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (log: {
      notification_type: string;
      notification_title: string;
      action_description: string;
      contract_id?: string;
      contract_number?: string;
      inquiry_id?: string;
      inquiry_number?: string;
      metadata?: any;
    }) => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('notification_logs')
        .insert([{
          ...log,
          user_id: user?.id || null,
          user_email: user?.email || null,
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-logs'] });
    },
  });
};
