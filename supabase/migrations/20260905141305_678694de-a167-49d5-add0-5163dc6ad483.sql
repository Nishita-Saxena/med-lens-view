CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_own" ON public.profiles FOR ALL TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  date_of_birth DATE,
  age INTEGER,
  sex TEXT,
  patient_identifier TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patients TO authenticated;
GRANT ALL ON public.patients TO service_role;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "patients_own" ON public.patients FOR ALL TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE INDEX patients_owner_idx ON public.patients(owner_id);

CREATE OR REPLACE FUNCTION public.owns_patient(_patient_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.patients p WHERE p.id = _patient_id AND p.owner_id = auth.uid())
$$;

CREATE TABLE public.patient_information (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  label TEXT,
  value TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'USER_PROVIDED',
  verification_status TEXT NOT NULL DEFAULT 'HUMAN_VERIFIED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patient_information TO authenticated;
GRANT ALL ON public.patient_information TO service_role;
ALTER TABLE public.patient_information ENABLE ROW LEVEL SECURITY;
CREATE POLICY "patient_information_own" ON public.patient_information FOR ALL TO authenticated
  USING (public.owns_patient(patient_id)) WITH CHECK (public.owns_patient(patient_id));
CREATE INDEX patient_information_patient_idx ON public.patient_information(patient_id);

CREATE TABLE public.medical_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  storage_path TEXT,
  mime_type TEXT,
  file_size INTEGER,
  document_type TEXT,
  report_date DATE,
  processing_status TEXT NOT NULL DEFAULT 'PENDING',
  processing_error TEXT,
  checksum TEXT,
  page_count INTEGER,
  extracted_text TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.medical_documents TO authenticated;
GRANT ALL ON public.medical_documents TO service_role;
ALTER TABLE public.medical_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "medical_documents_own" ON public.medical_documents FOR ALL TO authenticated
  USING (public.owns_patient(patient_id)) WITH CHECK (public.owns_patient(patient_id));
CREATE INDEX medical_documents_patient_idx ON public.medical_documents(patient_id);

CREATE TABLE public.observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.medical_documents(id) ON DELETE CASCADE,
  test_name TEXT NOT NULL,
  test_category TEXT,
  value TEXT,
  numeric_value NUMERIC,
  unit TEXT,
  range_lower NUMERIC,
  range_upper NUMERIC,
  range_original_text TEXT,
  status TEXT NOT NULL DEFAULT 'UNDETERMINED',
  observation_note TEXT,
  report_date DATE,
  source_page INTEGER,
  source_text TEXT,
  confidence TEXT NOT NULL DEFAULT 'NEEDS_VERIFICATION',
  verification_status TEXT NOT NULL DEFAULT 'NEEDS_REVIEW',
  source_type TEXT NOT NULL DEFAULT 'DOCUMENT_EXTRACTED',
  extraction_model TEXT,
  original_extracted JSONB,
  review_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.observations TO authenticated;
GRANT ALL ON public.observations TO service_role;
ALTER TABLE public.observations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "observations_own" ON public.observations FOR ALL TO authenticated
  USING (public.owns_patient(patient_id)) WITH CHECK (public.owns_patient(patient_id));
CREATE INDEX observations_patient_idx ON public.observations(patient_id);
CREATE INDEX observations_document_idx ON public.observations(document_id);

CREATE TABLE public.summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  content JSONB NOT NULL,
  model TEXT,
  observation_ids UUID[] NOT NULL DEFAULT '{}',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.summaries TO authenticated;
GRANT ALL ON public.summaries TO service_role;
ALTER TABLE public.summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "summaries_own" ON public.summaries FOR ALL TO authenticated
  USING (public.owns_patient(patient_id)) WITH CHECK (public.owns_patient(patient_id));
CREATE INDEX summaries_patient_idx ON public.summaries(patient_id);

CREATE TABLE public.audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  actor TEXT NOT NULL DEFAULT 'HUMAN',
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  previous_value JSONB,
  new_value JSONB,
  detail TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_events TO authenticated;
GRANT ALL ON public.audit_events TO service_role;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_events_select_own" ON public.audit_events FOR SELECT TO authenticated
  USING (public.owns_patient(patient_id));
CREATE POLICY "audit_events_insert_own" ON public.audit_events FOR INSERT TO authenticated
  WITH CHECK (public.owns_patient(patient_id));
CREATE INDEX audit_events_patient_idx ON public.audit_events(patient_id);

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER patients_updated BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER patient_information_updated BEFORE UPDATE ON public.patient_information FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER medical_documents_updated BEFORE UPDATE ON public.medical_documents FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER observations_updated BEFORE UPDATE ON public.observations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE POLICY "patient_docs_select_own" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'patient-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "patient_docs_insert_own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'patient-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "patient_docs_update_own" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'patient-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "patient_docs_delete_own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'patient-documents' AND (storage.foldername(name))[1] = auth.uid()::text);