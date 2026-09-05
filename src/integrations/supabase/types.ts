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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_events: {
        Row: {
          action: string
          actor: string
          created_at: string
          detail: string | null
          entity_id: string | null
          entity_type: string
          id: string
          new_value: Json | null
          patient_id: string
          previous_value: Json | null
        }
        Insert: {
          action: string
          actor?: string
          created_at?: string
          detail?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          new_value?: Json | null
          patient_id: string
          previous_value?: Json | null
        }
        Update: {
          action?: string
          actor?: string
          created_at?: string
          detail?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          new_value?: Json | null
          patient_id?: string
          previous_value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_documents: {
        Row: {
          checksum: string | null
          document_type: string | null
          extracted_text: string | null
          file_name: string
          file_size: number | null
          id: string
          is_demo: boolean
          mime_type: string | null
          page_count: number | null
          patient_id: string
          processing_error: string | null
          processing_status: string
          report_date: string | null
          storage_path: string | null
          updated_at: string
          uploaded_at: string
        }
        Insert: {
          checksum?: string | null
          document_type?: string | null
          extracted_text?: string | null
          file_name: string
          file_size?: number | null
          id?: string
          is_demo?: boolean
          mime_type?: string | null
          page_count?: number | null
          patient_id: string
          processing_error?: string | null
          processing_status?: string
          report_date?: string | null
          storage_path?: string | null
          updated_at?: string
          uploaded_at?: string
        }
        Update: {
          checksum?: string | null
          document_type?: string | null
          extracted_text?: string | null
          file_name?: string
          file_size?: number | null
          id?: string
          is_demo?: boolean
          mime_type?: string | null
          page_count?: number | null
          patient_id?: string
          processing_error?: string | null
          processing_status?: string
          report_date?: string | null
          storage_path?: string | null
          updated_at?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_documents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      observations: {
        Row: {
          confidence: string
          created_at: string
          document_id: string | null
          extraction_model: string | null
          id: string
          numeric_value: number | null
          observation_note: string | null
          original_extracted: Json | null
          patient_id: string
          range_lower: number | null
          range_original_text: string | null
          range_upper: number | null
          report_date: string | null
          review_note: string | null
          source_page: number | null
          source_text: string | null
          source_type: string
          status: string
          test_category: string | null
          test_name: string
          unit: string | null
          updated_at: string
          value: string | null
          verification_status: string
        }
        Insert: {
          confidence?: string
          created_at?: string
          document_id?: string | null
          extraction_model?: string | null
          id?: string
          numeric_value?: number | null
          observation_note?: string | null
          original_extracted?: Json | null
          patient_id: string
          range_lower?: number | null
          range_original_text?: string | null
          range_upper?: number | null
          report_date?: string | null
          review_note?: string | null
          source_page?: number | null
          source_text?: string | null
          source_type?: string
          status?: string
          test_category?: string | null
          test_name: string
          unit?: string | null
          updated_at?: string
          value?: string | null
          verification_status?: string
        }
        Update: {
          confidence?: string
          created_at?: string
          document_id?: string | null
          extraction_model?: string | null
          id?: string
          numeric_value?: number | null
          observation_note?: string | null
          original_extracted?: Json | null
          patient_id?: string
          range_lower?: number | null
          range_original_text?: string | null
          range_upper?: number | null
          report_date?: string | null
          review_note?: string | null
          source_page?: number | null
          source_text?: string | null
          source_type?: string
          status?: string
          test_category?: string | null
          test_name?: string
          unit?: string | null
          updated_at?: string
          value?: string | null
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "observations_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "medical_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "observations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_information: {
        Row: {
          category: string
          created_at: string
          id: string
          label: string | null
          patient_id: string
          source_type: string
          updated_at: string
          value: string
          verification_status: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          label?: string | null
          patient_id: string
          source_type?: string
          updated_at?: string
          value: string
          verification_status?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          label?: string | null
          patient_id?: string
          source_type?: string
          updated_at?: string
          value?: string
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_information_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          age: number | null
          created_at: string
          date_of_birth: string | null
          display_name: string
          id: string
          is_demo: boolean
          owner_id: string
          patient_identifier: string | null
          sex: string | null
          updated_at: string
        }
        Insert: {
          age?: number | null
          created_at?: string
          date_of_birth?: string | null
          display_name: string
          id?: string
          is_demo?: boolean
          owner_id: string
          patient_identifier?: string | null
          sex?: string | null
          updated_at?: string
        }
        Update: {
          age?: number | null
          created_at?: string
          date_of_birth?: string | null
          display_name?: string
          id?: string
          is_demo?: boolean
          owner_id?: string
          patient_identifier?: string | null
          sex?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      summaries: {
        Row: {
          content: Json
          generated_at: string
          id: string
          model: string | null
          observation_ids: string[]
          patient_id: string
        }
        Insert: {
          content: Json
          generated_at?: string
          id?: string
          model?: string | null
          observation_ids?: string[]
          patient_id: string
        }
        Update: {
          content?: Json
          generated_at?: string
          id?: string
          model?: string | null
          observation_ids?: string[]
          patient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "summaries_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      owns_patient: { Args: { _patient_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
