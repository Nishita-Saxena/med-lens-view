# MedLens server functions

Use Supabase Edge Functions for privileged document processing and AI calls. Never expose service-role credentials in browser code. Any extraction pipeline must return source text/page provenance and a verification state; it must not produce diagnoses or treatment recommendations.

Recommended lifecycle for `medical_documents.processing_status`:

`PENDING` → `PROCESSING` → `READY` or `FAILED`

Create observations only from source material, preserve the original extracted payload, and require human verification before treating an observation as verified.
