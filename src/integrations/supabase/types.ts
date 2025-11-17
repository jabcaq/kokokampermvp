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
          address: string | null
          company_name: string | null
          contracts_count: number | null
          created_at: string | null
          email: string
          id: string
          id_issuer: string | null
          id_number: string | null
          id_type: string | null
          license_category: string | null
          license_date: string | null
          license_number: string | null
          name: string
          nip: string | null
          pesel: string | null
          phone: string | null
          trailer_license_category: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          company_name?: string | null
          contracts_count?: number | null
          created_at?: string | null
          email: string
          id?: string
          id_issuer?: string | null
          id_number?: string | null
          id_type?: string | null
          license_category?: string | null
          license_date?: string | null
          license_number?: string | null
          name: string
          nip?: string | null
          pesel?: string | null
          phone?: string | null
          trailer_license_category?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          company_name?: string | null
          contracts_count?: number | null
          created_at?: string | null
          email?: string
          id?: string
          id_issuer?: string | null
          id_number?: string | null
          id_type?: string | null
          license_category?: string | null
          license_date?: string | null
          license_number?: string | null
          name?: string
          nip?: string | null
          pesel?: string | null
          phone?: string | null
          trailer_license_category?: string | null
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
          files: Json | null
          id: string
          invoice_file_url: string | null
          invoice_type: string
          invoice_uploaded_at: string | null
          is_archived: boolean
          notes: string | null
          status: string
          submitted_at: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          contract_id: string
          created_at?: string | null
          files?: Json | null
          id?: string
          invoice_file_url?: string | null
          invoice_type: string
          invoice_uploaded_at?: string | null
          is_archived?: boolean
          notes?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          contract_id?: string
          created_at?: string | null
          files?: Json | null
          id?: string
          invoice_file_url?: string | null
          invoice_type?: string
          invoice_uploaded_at?: string | null
          is_archived?: boolean
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
      contract_status_history: {
        Row: {
          changed_at: string | null
          changed_by: string | null
          contract_id: string | null
          id: string
          new_status: string | null
          notes: string | null
          old_status: string | null
        }
        Insert: {
          changed_at?: string | null
          changed_by?: string | null
          contract_id?: string | null
          id?: string
          new_status?: string | null
          notes?: string | null
          old_status?: string | null
        }
        Update: {
          changed_at?: string | null
          changed_by?: string | null
          contract_id?: string | null
          id?: string
          new_status?: string | null
          notes?: string | null
          old_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_status_history_contract_id_fkey"
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
          contract_number: string
          created_at: string | null
          deposit_received: boolean | null
          deposit_received_at: string | null
          driver_submission_link: string | null
          driver_submission_link_en: string | null
          employee_return_link: string | null
          end_date: string
          handover_link: string | null
          has_trailer: boolean | null
          id: string
          inquiry_id: string | null
          inquiry_number: string | null
          invoice_type: string | null
          is_archived: boolean
          is_full_payment_as_reservation: boolean | null
          lessor_address: string | null
          lessor_email: string | null
          lessor_name: string | null
          lessor_phone: string | null
          lessor_website: string | null
          notes: string | null
          number_of_travelers: number | null
          payments: Json | null
          preferred_language: string | null
          registration_number: string
          return_link: string | null
          start_date: string
          status: Database["public"]["Enums"]["contract_status"] | null
          tenant_address: string | null
          tenant_company_name: string | null
          tenant_email: string | null
          tenant_id_issuer: string | null
          tenant_id_number: string | null
          tenant_id_type: string | null
          tenant_license_category: string | null
          tenant_license_date: string | null
          tenant_license_number: string | null
          tenant_name: string | null
          tenant_nip: string | null
          tenant_pesel: string | null
          tenant_phone: string | null
          tenant_trailer_license_category: string | null
          trailer_mass: number | null
          umowa_text: string | null
          updated_at: string | null
          value: number | null
          vehicle_additional_info: string | null
          vehicle_animals: string | null
          vehicle_cleaning: string | null
          vehicle_extra_equipment: string | null
          vehicle_f1_mass: number | null
          vehicle_insurance_number: string | null
          vehicle_insurance_valid_until: string | null
          vehicle_model: string
          vehicle_next_inspection: string | null
          vehicle_o1_mass: number | null
          vehicle_vin: string | null
        }
        Insert: {
          additional_drivers?: Json | null
          client_id: string
          contract_number: string
          created_at?: string | null
          deposit_received?: boolean | null
          deposit_received_at?: string | null
          driver_submission_link?: string | null
          driver_submission_link_en?: string | null
          employee_return_link?: string | null
          end_date: string
          handover_link?: string | null
          has_trailer?: boolean | null
          id?: string
          inquiry_id?: string | null
          inquiry_number?: string | null
          invoice_type?: string | null
          is_archived?: boolean
          is_full_payment_as_reservation?: boolean | null
          lessor_address?: string | null
          lessor_email?: string | null
          lessor_name?: string | null
          lessor_phone?: string | null
          lessor_website?: string | null
          notes?: string | null
          number_of_travelers?: number | null
          payments?: Json | null
          preferred_language?: string | null
          registration_number: string
          return_link?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["contract_status"] | null
          tenant_address?: string | null
          tenant_company_name?: string | null
          tenant_email?: string | null
          tenant_id_issuer?: string | null
          tenant_id_number?: string | null
          tenant_id_type?: string | null
          tenant_license_category?: string | null
          tenant_license_date?: string | null
          tenant_license_number?: string | null
          tenant_name?: string | null
          tenant_nip?: string | null
          tenant_pesel?: string | null
          tenant_phone?: string | null
          tenant_trailer_license_category?: string | null
          trailer_mass?: number | null
          umowa_text?: string | null
          updated_at?: string | null
          value?: number | null
          vehicle_additional_info?: string | null
          vehicle_animals?: string | null
          vehicle_cleaning?: string | null
          vehicle_extra_equipment?: string | null
          vehicle_f1_mass?: number | null
          vehicle_insurance_number?: string | null
          vehicle_insurance_valid_until?: string | null
          vehicle_model: string
          vehicle_next_inspection?: string | null
          vehicle_o1_mass?: number | null
          vehicle_vin?: string | null
        }
        Update: {
          additional_drivers?: Json | null
          client_id?: string
          contract_number?: string
          created_at?: string | null
          deposit_received?: boolean | null
          deposit_received_at?: string | null
          driver_submission_link?: string | null
          driver_submission_link_en?: string | null
          employee_return_link?: string | null
          end_date?: string
          handover_link?: string | null
          has_trailer?: boolean | null
          id?: string
          inquiry_id?: string | null
          inquiry_number?: string | null
          invoice_type?: string | null
          is_archived?: boolean
          is_full_payment_as_reservation?: boolean | null
          lessor_address?: string | null
          lessor_email?: string | null
          lessor_name?: string | null
          lessor_phone?: string | null
          lessor_website?: string | null
          notes?: string | null
          number_of_travelers?: number | null
          payments?: Json | null
          preferred_language?: string | null
          registration_number?: string
          return_link?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["contract_status"] | null
          tenant_address?: string | null
          tenant_company_name?: string | null
          tenant_email?: string | null
          tenant_id_issuer?: string | null
          tenant_id_number?: string | null
          tenant_id_type?: string | null
          tenant_license_category?: string | null
          tenant_license_date?: string | null
          tenant_license_number?: string | null
          tenant_name?: string | null
          tenant_nip?: string | null
          tenant_pesel?: string | null
          tenant_phone?: string | null
          tenant_trailer_license_category?: string | null
          trailer_mass?: number | null
          umowa_text?: string | null
          updated_at?: string | null
          value?: number | null
          vehicle_additional_info?: string | null
          vehicle_animals?: string | null
          vehicle_cleaning?: string | null
          vehicle_extra_equipment?: string | null
          vehicle_f1_mass?: number | null
          vehicle_insurance_number?: string | null
          vehicle_insurance_valid_until?: string | null
          vehicle_model?: string
          vehicle_next_inspection?: string | null
          vehicle_o1_mass?: number | null
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
          {
            foreignKeyName: "contracts_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "inquiries"
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
          folder_link: string | null
          id: string
          is_archived: boolean
          link: string | null
          nazwa_pliku: string
          path: string | null
          regulamin_id: string | null
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
          folder_link?: string | null
          id?: string
          is_archived?: boolean
          link?: string | null
          nazwa_pliku: string
          path?: string | null
          regulamin_id?: string | null
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
          folder_link?: string | null
          id?: string
          is_archived?: boolean
          link?: string | null
          nazwa_pliku?: string
          path?: string | null
          regulamin_id?: string | null
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
      employee_availability_settings: {
        Row: {
          advance_booking_days: number
          created_at: string | null
          id: string
          max_concurrent_returns: number
          return_duration_minutes: number
          updated_at: string | null
        }
        Insert: {
          advance_booking_days?: number
          created_at?: string | null
          id?: string
          max_concurrent_returns?: number
          return_duration_minutes?: number
          updated_at?: string | null
        }
        Update: {
          advance_booking_days?: number
          created_at?: string | null
          id?: string
          max_concurrent_returns?: number
          return_duration_minutes?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      employee_schedules: {
        Row: {
          created_at: string | null
          employee_id: string
          end_time: string
          id: string
          is_available: boolean
          notes: string | null
          start_time: string
          updated_at: string | null
          work_date: string
        }
        Insert: {
          created_at?: string | null
          employee_id: string
          end_time: string
          id?: string
          is_available?: boolean
          notes?: string | null
          start_time: string
          updated_at?: string | null
          work_date: string
        }
        Update: {
          created_at?: string | null
          employee_id?: string
          end_time?: string
          id?: string
          is_available?: boolean
          notes?: string | null
          start_time?: string
          updated_at?: string | null
          work_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_schedules_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          inquiry_number: string | null
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
          inquiry_number?: string | null
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
          inquiry_number?: string | null
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
      inquiry_messages: {
        Row: {
          created_at: string
          id: string
          inquiry_id: string
          inquiry_number: string | null
          message: string
          sender_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          inquiry_id: string
          inquiry_number?: string | null
          message: string
          sender_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          inquiry_id?: string
          inquiry_number?: string | null
          message?: string
          sender_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inquiry_messages_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "inquiries"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_logs: {
        Row: {
          action_description: string
          contract_id: string | null
          contract_number: string | null
          created_at: string
          id: string
          inquiry_id: string | null
          inquiry_number: string | null
          metadata: Json | null
          notification_title: string
          notification_type: string
          updated_at: string
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action_description: string
          contract_id?: string | null
          contract_number?: string | null
          created_at?: string
          id?: string
          inquiry_id?: string | null
          inquiry_number?: string | null
          metadata?: Json | null
          notification_title: string
          notification_type: string
          updated_at?: string
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action_description?: string
          contract_id?: string | null
          contract_number?: string | null
          created_at?: string
          id?: string
          inquiry_id?: string | null
          inquiry_number?: string | null
          metadata?: Json | null
          notification_title?: string
          notification_type?: string
          updated_at?: string
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_logs_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "inquiries"
            referencedColumns: ["id"]
          },
        ]
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
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_archived: boolean
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          is_archived?: boolean
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_archived?: boolean
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicle_documents: {
        Row: {
          created_at: string
          document_number: string | null
          document_type: string
          expiry_date: string | null
          file_name: string
          file_url: string | null
          id: string
          issue_date: string | null
          notes: string | null
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          document_number?: string | null
          document_type: string
          expiry_date?: string | null
          file_name: string
          file_url?: string | null
          id?: string
          issue_date?: string | null
          notes?: string | null
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          document_number?: string | null
          document_type?: string
          expiry_date?: string | null
          file_name?: string
          file_url?: string | null
          id?: string
          issue_date?: string | null
          notes?: string | null
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_documents_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
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
          assigned_employee_id: string | null
          booking_notes: string | null
          can_refund_deposit: boolean | null
          contract_id: string
          created_at: string | null
          deposit_refund_timestamp: string | null
          deposit_refunded_cash: boolean | null
          deposit_refunded_transfer: boolean | null
          employee_id: string | null
          employee_name: string
          fuel_level: number
          id: string
          mileage: number
          photos: Json | null
          return_completed: boolean | null
          return_confirmed: boolean | null
          return_notes: string | null
          review_request_sent: boolean | null
          scheduled_return_date: string | null
          scheduled_return_time: string | null
          updated_at: string | null
          vehicle_issue: boolean | null
        }
        Insert: {
          assigned_employee_id?: string | null
          booking_notes?: string | null
          can_refund_deposit?: boolean | null
          contract_id: string
          created_at?: string | null
          deposit_refund_timestamp?: string | null
          deposit_refunded_cash?: boolean | null
          deposit_refunded_transfer?: boolean | null
          employee_id?: string | null
          employee_name: string
          fuel_level: number
          id?: string
          mileage: number
          photos?: Json | null
          return_completed?: boolean | null
          return_confirmed?: boolean | null
          return_notes?: string | null
          review_request_sent?: boolean | null
          scheduled_return_date?: string | null
          scheduled_return_time?: string | null
          updated_at?: string | null
          vehicle_issue?: boolean | null
        }
        Update: {
          assigned_employee_id?: string | null
          booking_notes?: string | null
          can_refund_deposit?: boolean | null
          contract_id?: string
          created_at?: string | null
          deposit_refund_timestamp?: string | null
          deposit_refunded_cash?: boolean | null
          deposit_refunded_transfer?: boolean | null
          employee_id?: string | null
          employee_name?: string
          fuel_level?: number
          id?: string
          mileage?: number
          photos?: Json | null
          return_completed?: boolean | null
          return_confirmed?: boolean | null
          return_notes?: string | null
          review_request_sent?: boolean | null
          scheduled_return_date?: string | null
          scheduled_return_time?: string | null
          updated_at?: string | null
          vehicle_issue?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_returns_assigned_employee_id_fkey"
            columns: ["assigned_employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
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
          registration_certificate_number: string | null
          registration_number: string
          status: string | null
          trailer_weight: number | null
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
          registration_certificate_number?: string | null
          registration_number: string
          status?: string | null
          trailer_weight?: number | null
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
          registration_certificate_number?: string | null
          registration_number?: string
          status?: string | null
          trailer_weight?: number | null
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
      check_expiring_documents: { Args: never; Returns: undefined }
      generate_inquiry_number: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "staff"
        | "user"
        | "return_handler"
        | "admin_return_handler"
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
      app_role: [
        "admin",
        "staff",
        "user",
        "return_handler",
        "admin_return_handler",
      ],
      contract_status: ["active", "completed", "cancelled", "pending"],
      inquiry_status: ["new", "in_progress", "completed", "archived"],
    },
  },
} as const
