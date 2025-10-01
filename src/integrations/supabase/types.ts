export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      clients: {
        Row: {
          contracts_count: number | null
          created_at: string | null
          email: string
          id: string
          name: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          contracts_count?: number | null
          created_at?: string | null
          email: string
          id?: string
          name: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          contracts_count?: number | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      contracts: {
        Row: {
          client_id: string
          contract_number: string
          created_at: string | null
          end_date: string
          id: string
          registration_number: string
          start_date: string
          status: Database["public"]["Enums"]["contract_status"] | null
          updated_at: string | null
          value: number | null
          vehicle_model: string
        }
        Insert: {
          client_id: string
          contract_number: string
          created_at?: string | null
          end_date: string
          id?: string
          registration_number: string
          start_date: string
          status?: Database["public"]["Enums"]["contract_status"] | null
          updated_at?: string | null
          value?: number | null
          vehicle_model: string
        }
        Update: {
          client_id?: string
          contract_number?: string
          created_at?: string | null
          end_date?: string
          id?: string
          registration_number?: string
          start_date?: string
          status?: Database["public"]["Enums"]["contract_status"] | null
          updated_at?: string | null
          value?: number | null
          vehicle_model?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiries: {
        Row: {
          created_at: string | null
          email: string
          id: string
          message: string
          name: string
          status: Database["public"]["Enums"]["inquiry_status"] | null
          subject: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          message: string
          name: string
          status?: Database["public"]["Enums"]["inquiry_status"] | null
          subject?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          message?: string
          name?: string
          status?: Database["public"]["Enums"]["inquiry_status"] | null
          subject?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      vehicle_handovers: {
        Row: {
          contract_id: string
          created_at: string | null
          fuel_level: number
          handover_protocol_files: Json | null
          id: string
          mileage: number
          photos: Json | null
          updated_at: string | null
        }
        Insert: {
          contract_id: string
          created_at?: string | null
          fuel_level: number
          handover_protocol_files?: Json | null
          id?: string
          mileage: number
          photos?: Json | null
          updated_at?: string | null
        }
        Update: {
          contract_id?: string
          created_at?: string | null
          fuel_level?: number
          handover_protocol_files?: Json | null
          id?: string
          mileage?: number
          photos?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_handovers_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_returns: {
        Row: {
          can_refund_deposit: boolean | null
          contract_id: string
          created_at: string | null
          deposit_refunded_cash: boolean | null
          employee_id: string | null
          employee_name: string
          fuel_level: number
          id: string
          mileage: number
          photos: Json | null
          return_notes: string | null
          updated_at: string | null
          vehicle_issue: boolean | null
        }
        Insert: {
          can_refund_deposit?: boolean | null
          contract_id: string
          created_at?: string | null
          deposit_refunded_cash?: boolean | null
          employee_id?: string | null
          employee_name: string
          fuel_level: number
          id?: string
          mileage: number
          photos?: Json | null
          return_notes?: string | null
          updated_at?: string | null
          vehicle_issue?: boolean | null
        }
        Update: {
          can_refund_deposit?: boolean | null
          contract_id?: string
          created_at?: string | null
          deposit_refunded_cash?: boolean | null
          employee_id?: string | null
          employee_name?: string
          fuel_level?: number
          id?: string
          mileage?: number
          photos?: Json | null
          return_notes?: string | null
          updated_at?: string | null
          vehicle_issue?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_returns_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      contract_status: "active" | "completed" | "cancelled" | "pending"
      inquiry_status: "new" | "in_progress" | "completed" | "archived"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      contract_status: ["active", "completed", "cancelled", "pending"],
      inquiry_status: ["new", "in_progress", "completed", "archived"],
    },
  },
} as const
