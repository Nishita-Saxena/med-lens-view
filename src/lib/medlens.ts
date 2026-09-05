import { supabase } from "@/integrations/supabase/client";

export type Patient = {
  id: string;
  display_name: string;
  date_of_birth: string | null;
  age: number | null;
  sex: string | null;
  patient_identifier: string | null;
  created_at: string;
};

export type Observation = {
  id: string;
  test_name: string;
  value: string | null;
  unit: string | null;
  range_lower: number | null;
  range_upper: number | null;
  range_original_text: string | null;
  status: string;
  verification_status: string;
  report_date: string | null;
  source_text: string | null;
};

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signUp(email: string, password: string, displayName: string) {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  });
  if (error) throw error;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function listPatients() {
  const { data, error } = await supabase
    .from("patients")
    .select("id,display_name,date_of_birth,age,sex,patient_identifier,created_at")
    .eq("is_demo", false)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Patient[];
}

export async function createPatient(input: {
  display_name: string;
  date_of_birth?: string;
  age?: number;
  sex?: string;
  patient_identifier?: string;
}) {
  const session = await getSession();
  if (!session?.user) throw new Error("Please sign in before creating a patient.");
  const { data, error } = await supabase
    .from("patients")
    .insert({ ...input, owner_id: session.user.id })
    .select("id,display_name,date_of_birth,age,sex,patient_identifier,created_at")
    .single();
  if (error) throw error;
  return data as Patient;
}

export async function getPatient(patientId: string) {
  const { data, error } = await supabase
    .from("patients")
    .select("id,display_name,date_of_birth,age,sex,patient_identifier,created_at")
    .eq("id", patientId)
    .single();
  if (error) throw error;
  return data as Patient;
}

export async function listObservations(patientId: string) {
  const { data, error } = await supabase
    .from("observations")
    .select("id,test_name,value,unit,range_lower,range_upper,range_original_text,status,verification_status,report_date,source_text")
    .eq("patient_id", patientId)
    .order("report_date", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as Observation[];
}

export async function addPatientInformation(patientId: string, category: string, label: string, value: string) {
  const { data, error } = await supabase
    .from("patient_information")
    .insert({ patient_id: patientId, category, label, value, source_type: "USER_PROVIDED", verification_status: "HUMAN_VERIFIED" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export function observationStatus(observation: Observation) {
  if (observation.status !== "UNDETERMINED") return observation.status;
  if (observation.range_lower == null || observation.range_upper == null || observation.value == null) return "UNDETERMINED";
  const numeric = Number.parseFloat(observation.value.replace(",", ""));
  if (!Number.isFinite(numeric)) return "UNDETERMINED";
  if (numeric < observation.range_lower) return "LOW";
  if (numeric > observation.range_upper) return "HIGH";
  return "NORMAL";
}
