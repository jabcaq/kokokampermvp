import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { useCreateNotificationLog } from './useNotificationLogs';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  created_at: string;
  updated_at: string;
}

export const useNotifications = (filter: 'all' | 'unread' | 'read' = 'unread') => {
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', filter],
    queryFn: async () => {
      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (filter === 'unread') {
        query = query.eq('read', false);
      } else if (filter === 'read') {
        query = query.eq('read', true);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Notification[];
    },
  });

  // Always get unread count
  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: false })
        .eq('read', false);
      
      if (error) throw error;
      return data;
    },
  });

  // Set up realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const unreadCount = unreadData?.length || 0;

  return { notifications: notifications || [], isLoading, unreadCount };
};

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('read', false);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useCreateNotification = () => {
  const queryClient = useQueryClient();
  const createLog = useCreateNotificationLog();
  
  return useMutation({
    mutationFn: async (notification: Omit<Notification, 'id' | 'created_at' | 'updated_at' | 'read'> & {
      contract_id?: string;
      contract_number?: string;
      inquiry_id?: string;
      inquiry_number?: string;
    }) => {
      const { contract_id, contract_number, inquiry_id, inquiry_number, ...notificationData } = notification;
      
      const { data, error } = await supabase
        .from('notifications')
        .insert([notificationData])
        .select()
        .single();
      
      if (error) throw error;
      
      // Log the notification creation with contract/inquiry info
      await createLog.mutateAsync({
        notification_type: notification.type,
        notification_title: notification.title,
        action_description: notification.message,
        contract_id,
        contract_number,
        inquiry_id,
        inquiry_number,
        metadata: { link: notification.link, automatic: true }
      });
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useCheckExpiringDocuments = () => {
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('check_expiring_documents');
      
      if (error) throw error;
    },
  });
};
