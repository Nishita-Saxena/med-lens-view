-- MedLens production hardening: storage bucket + ownership helper + update triggers.
-- The application still requires human review for extracted clinical information.

insert into storage.buckets (id, name, public)
values ('patient-documents', 'patient-documents', false)
on conflict (id) do update set public = false;

create policy "patient_docs_select_owned"
on storage.objects for select to authenticated
using (
  bucket_id = 'patient-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "patient_docs_insert_owned"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'patient-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "patient_docs_update_owned"
on storage.objects for update to authenticated
using (
  bucket_id = 'patient-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'patient-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "patient_docs_delete_owned"
on storage.objects for delete to authenticated
using (
  bucket_id = 'patient-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);
