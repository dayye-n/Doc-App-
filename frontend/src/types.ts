export type FieldType = "checkbox" | "dropdown" | "text-short";

export type TherapyOption = "dressing change" | "follow-up in X days" | "antibiotics" | "pain management";

export interface ProcedureField {
  name: string;
  label: string;
  type: FieldType;
  options?: string[];
}

export interface ProcedureTemplate {
  id: string;
  region: string;
  name: string;
  fields: ProcedureField[];
  text_blocks: string[];
}

export interface Patient {
  id: string;
  patient_id: string;
  full_name: string;
  date_of_birth?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface Note {
  id: string;
  patient_id: string;
  template_id: string;
  encounter_date: string;
  region: string;
  procedure_name: string;
  selected_fields: Record<string, unknown>;
  therapy: string[];
  follow_up?: string | null;
  final_text: string;
  created_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

// AI Feature Types
export interface ParsedNoteResponse {
  procedure: string;
  side: string; // "left" | "right" | "bilateral" | "na"
  symptoms: string[];
  findings: string[];
  diagnosis: string;
  medications: string[];
  packing: string;
  follow_up: string;
  instructions: string;
  red_flags: string[];
}

export interface CheckNoteResponse {
  warnings: string[];
  score: number; // 0-100
}

export interface PatientInstructionsResponse {
  discharge_text: string;
  red_flags: string[];
  follow_up: string;
}
