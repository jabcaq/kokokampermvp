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
  // Form fields
  vehicle?: string | null;
  competitor_vehicle?: string | null;
  gearbox?: string | null;
  promotion_code?: string | null;
  departure_date?: string | null;
  return_date?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  number_of_people?: number | null;
  tuba_pay_rental?: boolean | null;
  what_to_rent?: string | null;
  travel_companions?: string | null;
  inquiry_type?: string | null;
  flexible_dates?: boolean | null;
  height?: number | null;
  partner_height?: number | null;
  daily_car?: string | null;
  camper_experience?: boolean | null;
  driver_license?: string | null;
  sports_equipment?: string | null;
  number_of_bikes?: number | null;
  number_of_skis?: number | null;
  vacation_type?: string | null;
  vacation_description?: string | null;
  countries?: string | null;
  planned_camping?: string | null;
  meals?: string | null;
  required_equipment?: string | null;
  number_of_fuel_tanks?: number | null;
  camper_layout?: string | null;
  budget_from?: number | null;
  budget_to?: number | null;
  other_notes?: string | null;
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
      
      // Create notification for new inquiry
      await supabase
        .from('notifications')
        .insert([{
          type: 'inquiry_new',
          title: 'Nowe zapytanie',
          message: `Nowe zapytanie od ${inquiry.name}: ${inquiry.subject || 'Bez tematu'}`,
          link: '/inquiries',
        }]);
      
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
