import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface InquiryMessage {
  id: string;
  inquiry_id: string;
  inquiry_number?: string;
  sender_type: 'customer' | 'admin';
  message: string;
  created_at: string;
  updated_at: string;
}

export const useInquiryMessages = (inquiryId: string | null) => {
  return useQuery({
    queryKey: ['inquiry-messages', inquiryId],
    queryFn: async () => {
      if (!inquiryId) return [];
      
      const { data, error } = await supabase
        .from('inquiry_messages')
        .select('*')
        .eq('inquiry_id', inquiryId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as InquiryMessage[];
    },
    enabled: !!inquiryId,
  });
};

export const useAddInquiryMessage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ inquiryId, message, senderType, inquiryNumber }: { 
      inquiryId: string; 
      message: string; 
      senderType: 'customer' | 'admin';
      inquiryNumber?: string;
    }) => {
      const { data, error } = await supabase
        .from('inquiry_messages')
        .insert({
          inquiry_id: inquiryId,
          message,
          sender_type: senderType,
          inquiry_number: inquiryNumber,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inquiry-messages', variables.inquiryId] });
      toast({
        title: "Wiadomość wysłana",
        description: "Odpowiedź została pomyślnie wysłana.",
      });
    },
    onError: (error) => {
      toast({
        title: "Błąd",
        description: "Nie udało się wysłać wiadomości.",
        variant: "destructive",
      });
      console.error('Error adding inquiry message:', error);
    },
  });
};
