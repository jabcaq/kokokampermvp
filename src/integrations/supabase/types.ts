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
      contract_documents: {
        Row: {
          contract_id: string
          created_at: string | null
          document_type: string
          file_url: string | null
          generated_at: string | null
          id: string
          sent_at: string | null
          sent_to_email: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          contract_id: string
          created_at?: string | null
          document_type: string
          file_url?: string | null
          generated_at?: string | null
          id?: string
          sent_at?: string | null
          sent_to_email?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          contract_id?: string
          created_at?: string | null
          document_type?: string
          file_url?: string | null
          generated_at?: string | null
          id?: string
          sent_at?: string | null
          sent_to_email?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_documents_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_invoices: {
        Row: {
          amount: number
          contract_id: string
          created_at: string | null
          id: string
          invoice_file_url: string | null
          invoice_type: string
          invoice_uploaded_at: string | null
          notes: string | null
          status: string
          submitted_at: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          contract_id: string
          created_at?: string | null
          id?: string
          invoice_file_url?: string | null
          invoice_type: string
          invoice_uploaded_at?: string | null
          notes?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          contract_id?: string
          created_at?: string | null
          id?: string
          invoice_file_url?: string | null
          invoice_type?: string
          invoice_uploaded_at?: string | null
          notes?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_invoices_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          additional_drivers: Json | null
          client_id: string
          company_email: string | null
          company_name: string | null
          company_phone1: string | null
          company_phone2: string | null
          contract_number: string
          created_at: string | null
          end_date: string
          id: string
          lessor_address: string | null
          lessor_email: string | null
          lessor_name: string | null
          lessor_phone: string | null
          lessor_website: string | null
          notes: string | null
          payments: Json | null
          registration_number: string
          rental_location: string | null
          return_by: string | null
          start_date: string
          status: Database["public"]["Enums"]["contract_status"] | null
          tenant_address: string | null
          tenant_email: string | null
          tenant_id_issuer: string | null
          tenant_id_number: string | null
          tenant_id_type: string | null
          tenant_license_date: string | null
          tenant_license_number: string | null
          tenant_name: string | null
          tenant_nip: string | null
          tenant_pesel: string | null
          tenant_phone: string | null
          updated_at: string | null
          value: number | null
          vehicle_additional_info: string | null
          vehicle_insurance_number: string | null
          vehicle_insurance_valid_until: string | null
          vehicle_model: string
          vehicle_next_inspection: string | null
          vehicle_vin: string | null
        }
        Insert: {
          additional_drivers?: Json | null
          client_id: string
          company_email?: string | null
          company_name?: string | null
          company_phone1?: string | null
          company_phone2?: string | null
          contract_number: string
          created_at?: string | null
          end_date: string
          id?: string
          lessor_address?: string | null
          lessor_email?: string | null
          lessor_name?: string | null
          lessor_phone?: string | null
          lessor_website?: string | null
          notes?: string | null
          payments?: Json | null
          registration_number: string
          rental_location?: string | null
          return_by?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["contract_status"] | null
          tenant_address?: string | null
          tenant_email?: string | null
          tenant_id_issuer?: string | null
          tenant_id_number?: string | null
          tenant_id_type?: string | null
          tenant_license_date?: string | null
          tenant_license_number?: string | null
          tenant_name?: string | null
          tenant_nip?: string | null
          tenant_pesel?: string | null
          tenant_phone?: string | null
          updated_at?: string | null
          value?: number | null
          vehicle_additional_info?: string | null
          vehicle_insurance_number?: string | null
          vehicle_insurance_valid_until?: string | null
          vehicle_model: string
          vehicle_next_inspection?: string | null
          vehicle_vin?: string | null
        }
        Update: {
          additional_drivers?: Json | null
          client_id?: string
          company_email?: string | null
          company_name?: string | null
          company_phone1?: string | null
          company_phone2?: string | null
          contract_number?: string
          created_at?: string | null
          end_date?: string
          id?: string
          lessor_address?: string | null
          lessor_email?: string | null
          lessor_name?: string | null
          lessor_phone?: string | null
          lessor_website?: string | null
          notes?: string | null
          payments?: Json | null
          registration_number?: string
          rental_location?: string | null
          return_by?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["contract_status"] | null
          tenant_address?: string | null
          tenant_email?: string | null
          tenant_id_issuer?: string | null
          tenant_id_number?: string | null
          tenant_id_type?: string | null
          tenant_license_date?: string | null
          tenant_license_number?: string | null
          tenant_name?: string | null
          tenant_nip?: string | null
          tenant_pesel?: string | null
          tenant_phone?: string | null
          updated_at?: string | null
          value?: number | null
          vehicle_additional_info?: string | null
          vehicle_insurance_number?: string | null
          vehicle_insurance_valid_until?: string | null
          vehicle_model?: string
          vehicle_next_inspection?: string | null
          vehicle_vin?: string | null
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
      documents: {
        Row: {
          client_id: string | null
          contract_id: string | null
          created_at: string
          data: string | null
          folder: string | null
          id: string
          link: string | null
          nazwa_pliku: string
          path: string | null
          rodzaj: string
          rok: number | null
          umowa_id: string | null
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          contract_id?: string | null
          created_at?: string
          data?: string | null
          folder?: string | null
          id?: string
          link?: string | null
          nazwa_pliku: string
          path?: string | null
          rodzaj: string
          rok?: number | null
          umowa_id?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          contract_id?: string | null
          created_at?: string
          data?: string | null
          folder?: string | null
          id?: string
          link?: string | null
          nazwa_pliku?: string
          path?: string | null
          rodzaj?: string
          rok?: number | null
          umowa_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiries: {
        Row: {
          budget_from: number | null
          budget_to: number | null
          camper_experience: boolean | null
          camper_layout: string | null
          competitor_vehicle: string | null
          countries: string | null
          created_at: string | null
          daily_car: string | null
          departure_date: string | null
          driver_license: string | null
          email: string
          first_name: string | null
          flexible_dates: boolean | null
          gearbox: string | null
          height: number | null
          id: string
          inquiry_type: string | null
          last_name: string | null
          meals: string | null
          message: string
          name: string
          number_of_bikes: number | null
          number_of_fuel_tanks: number | null
          number_of_people: number | null
          number_of_skis: number | null
          other_notes: string | null
          partner_height: number | null
          phone: string | null
          planned_camping: string | null
          promotion_code: string | null
          required_equipment: string | null
          return_date: string | null
          sports_equipment: string | null
          status: Database["public"]["Enums"]["inquiry_status"] | null
          subject: string | null
          travel_companions: string | null
          tuba_pay_rental: boolean | null
          updated_at: string | null
          vacation_description: string | null
          vacation_type: string | null
          vehicle: string | null
          what_to_rent: string | null
        }
        Insert: {
          budget_from?: number | null
          budget_to?: number | null
          camper_experience?: boolean | null
          camper_layout?: string | null
          competitor_vehicle?: string | null
          countries?: string | null
          created_at?: string | null
          daily_car?: string | null
          departure_date?: string | null
          driver_license?: string | null
          email: string
          first_name?: string | null
          flexible_dates?: boolean | null
          gearbox?: string | null
          height?: number | null
          id?: string
          inquiry_type?: string | null
          last_name?: string | null
          meals?: string | null
          message: string
          name: string
          number_of_bikes?: number | null
          number_of_fuel_tanks?: number | null
          number_of_people?: number | null
          number_of_skis?: number | null
          other_notes?: string | null
          partner_height?: number | null
          phone?: string | null
          planned_camping?: string | null
          promotion_code?: string | null
          required_equipment?: string | null
          return_date?: string | null
          sports_equipment?: string | null
          status?: Database["public"]["Enums"]["inquiry_status"] | null
          subject?: string | null
          travel_companions?: string | null
          tuba_pay_rental?: boolean | null
          updated_at?: string | null
          vacation_description?: string | null
          vacation_type?: string | null
          vehicle?: string | null
          what_to_rent?: string | null
        }
        Update: {
          budget_from?: number | null
          budget_to?: number | null
          camper_experience?: boolean | null
          camper_layout?: string | null
          competitor_vehicle?: string | null
          countries?: string | null
          created_at?: string | null
          daily_car?: string | null
          departure_date?: string | null
          driver_license?: string | null
          email?: string
          first_name?: string | null
          flexible_dates?: boolean | null
          gearbox?: string | null
          height?: number | null
          id?: string
          inquiry_type?: string | null
          last_name?: string | null
          meals?: string | null
          message?: string
          name?: string
          number_of_bikes?: number | null
          number_of_fuel_tanks?: number | null
          number_of_people?: number | null
          number_of_skis?: number | null
          other_notes?: string | null
          partner_height?: number | null
          phone?: string | null
          planned_camping?: string | null
          promotion_code?: string | null
          required_equipment?: string | null
          return_date?: string | null
          sports_equipment?: string | null
          status?: Database["public"]["Enums"]["inquiry_status"] | null
          subject?: string | null
          travel_companions?: string | null
          tuba_pay_rental?: boolean | null
          updated_at?: string | null
          vacation_description?: string | null
          vacation_type?: string | null
          vehicle?: string | null
          what_to_rent?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          read: boolean
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          read?: boolean
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read?: boolean
          title?: string
          type?: string
          updated_at?: string
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
      vehicles: {
        Row: {
          additional_info: string | null
          brand: string | null
          created_at: string | null
          id: string
          insurance_policy_number: string | null
          insurance_valid_until: string | null
          location: string | null
          model: string
          name: string | null
          next_inspection_date: string | null
          registration_number: string
          status: string | null
          type: string | null
          updated_at: string | null
          vin: string
          year: number | null
        }
        Insert: {
          additional_info?: string | null
          brand?: string | null
          created_at?: string | null
          id?: string
          insurance_policy_number?: string | null
          insurance_valid_until?: string | null
          location?: string | null
          model: string
          name?: string | null
          next_inspection_date?: string | null
          registration_number: string
          status?: string | null
          type?: string | null
          updated_at?: string | null
          vin: string
          year?: number | null
        }
        Update: {
          additional_info?: string | null
          brand?: string | null
          created_at?: string | null
          id?: string
          insurance_policy_number?: string | null
          insurance_valid_until?: string | null
          location?: string | null
          model?: string
          name?: string | null
          next_inspection_date?: string | null
          registration_number?: string
          status?: string | null
          type?: string | null
          updated_at?: string | null
          vin?: string
          year?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_expiring_documents: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
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
