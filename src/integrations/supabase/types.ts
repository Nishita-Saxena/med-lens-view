export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.5" }
  public: {
    Tables: {
      profiles: { Row: any; Insert: any; Update: any; Relationships: any[] }
      patients: { Row: any; Insert: any; Update: any; Relationships: any[] }
      patient_information: { Row: any; Insert: any; Update: any; Relationships: any[] }
      medical_documents: { Row: any; Insert: any; Update: any; Relationships: any[] }
      observations: { Row: any; Insert: any; Update: any; Relationships: any[] }
      summaries: { Row: any; Insert: any; Update: any; Relationships: any[] }
      audit_events: { Row: any; Insert: any; Update: any; Relationships: any[] }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

export type PatientRow = {
  id: string; owner_id: string; display_name: string; date_of_birth: string | null; age: number | null; sex: string | null; patient_identifier: string | null; is_demo: boolean; created_at: string; updated_at: string;
}

export type ObservationRow = {
  id: string; patient_id: string; document_id: string | null; test_name: string; test_category: string | null; value: string | null; numeric_value: number | null; unit: string | null; range_lower: number | null; range_upper: number | null; range_original_text: string | null; status: string; observation_note: string | null; report_date: string | null; source_page: number | null; source_text: string | null; confidence: string; verification_status: string; source_type: string; extraction_model: string | null; original_extracted: Json | null; review_note: string | null; created_at: string; updated_at: string;
}
