import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: string; // This will be fetched from user_roles table
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export const useUsers = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      // Fetch profiles with their roles from user_roles table
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all user roles (types will update after migration)
      const { data: userRoles, error: rolesError } = await (supabase as any)
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Combine profiles with their roles
      const usersWithRoles = profiles.map(profile => {
        const userRole = userRoles?.find((r: any) => r.user_id === profile.id);
        return {
          ...profile,
          role: userRole?.role || 'user'
        } as Profile;
      });

      return usersWithRoles;
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: {
      email: string;
      password: string;
      full_name?: string;
      role?: string;
    }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(userData),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create user");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({
        title: "Użytkownik utworzony",
        description: "Nowy użytkownik został pomyślnie utworzony",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Błąd",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, role, ...updates }: Partial<Profile> & { id: string }) => {
      // Update profile (excluding role)
      const { error: profileError } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", id);

      if (profileError) throw profileError;

      // Update role in user_roles table if role is provided
      if (role) {
        // Delete existing roles for this user
        await (supabase as any)
          .from("user_roles")
          .delete()
          .eq("user_id", id);

        // Insert new role (types will update after migration)
        const { error: roleError } = await (supabase as any)
          .from("user_roles")
          .insert({ user_id: id, role: role as 'admin' | 'staff' | 'user' });

        if (roleError) throw roleError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({
        title: "Zaktualizowano",
        description: "Dane użytkownika zostały zaktualizowane",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Błąd",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const archiveUserMutation = useMutation({
    mutationFn: async ({ id, is_archived }: { id: string; is_archived: boolean }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ is_archived })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({
        title: variables.is_archived ? "Zarchiwizowano" : "Przywrócono",
        description: variables.is_archived 
          ? "Użytkownik został zarchiwizowany" 
          : "Użytkownik został przywrócony",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Błąd",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reset-user-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ user_id: userId }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to reset password");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Email wysłany",
        description: "Link do resetowania hasła został wysłany na adres email użytkownika",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Błąd",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    users,
    isLoading,
    createUserMutation,
    updateUserMutation,
    archiveUserMutation,
    resetPasswordMutation,
  };
};
