# MedLens — Architecture & Implementation Plan

## Stack conflict (needs your OK)

You asked for Firebase + Next.js. This project already runs on a different, fixed foundation: React + TanStack Start, with Lovable Cloud (managed Postgres database, authentication, file storage, server functions) and Lovable AI (Gemini models) built in. Firebase cannot be swapped in here.

The good news: every capability you listed maps one-to-one — logins, per-user data isolation enforced in the database itself, private document storage, server-side AI with no keys in the browser. I'll build on the existing foundation rather than replace it.

## A. Product architecture

Four layers, kept strictly separate:
1. **Presentation** — pages and reusable components (observation card, provenance badge, review controls).
2. **Application services** — patient service, document service, extraction pipeline, comparison/conflict engine, summary service, audit service.
3. **AI layer** — four separate, narrowly-scoped operations (extract, validate, classify, summarize), each server-side only, each returning schema-validated JSON.
4. **Data layer** — normalized tables with row-level ownership rules; private file storage.

Hard rule wired into the pipeline: raw AI output lands in a *proposed* state. Only a human action promotes it to verified.

## B. User flow

```text
Landing -> Sign up/in -> Patients list
  -> Create patient -> Intake (demographics, symptoms, conditions,
                              allergies, medications, history)
  -> Patient dashboard
       -> Upload report -> validate -> text/OCR -> AI extraction
          -> schema validation -> source mapping -> range analysis
          -> conflict detection -> REVIEW QUEUE
       -> Review (source doc left / extracted data right)
          -> Confirm | Edit | Reject | Mark uncertain  -> audit event
       -> Lab results | Comparison | Timeline | AI summary | Export
```

## C. Routes

Public: `/` landing, `/auth`, `/privacy`, `/responsible-ai`
Signed in: `/patients`, `/patients/new`, `/settings`
Patient context: `/patients/:id` overview, `/information`, `/reports`, `/reports/:docId` (side-by-side review), `/labs`, `/comparison`, `/timeline`, `/summary`

## D. Data model

- `profiles` — account display info
- `patients` — owner, display name, DOB/age, sex, identifier
- `patient_information` — category, value, source type, verification status
- `medical_documents` — patient, file name, storage path, type, report date, processing status, checksum, error detail
- `observations` — patient, document, test name, category, raw value, numeric value, unit, range lower/upper/original text, status, source page, source text, confidence, verification status, original extracted snapshot
- `summaries` — patient, generated at, content (structured sections), model, source observation ids
- `audit_events` — patient, actor, action, entity type/id, previous value, new value, timestamp

Every table: ownership-scoped access rules so one account can never read another's records; enforced in the database, not the browser.

## E. Storage

Private bucket, path `patient-documents/{ownerId}/{patientId}/{uuid}.{ext}`. No public URLs — downloads go through short-lived signed links issued only to the owner. Type allowlist (PDF, PNG, JPEG), size cap, sanitized filenames, checksum for duplicate detection.

## F. AI architecture

Four server-side operations, never one mega-prompt:
- **Extract** — document -> structured observations JSON, must quote source snippet + page for each field.
- **Validate** — checks each extracted field against the source text; flags unverifiable fields.
- **Classify** — pure deterministic code, no AI: compares numeric value to the *source-provided* range only.
- **Summarize** — reads verified/available structured records only, never raw documents.

Shared prompt contract: use only supplied source; never invent values, ranges, dates or history; preserve units and wording; return uncertainty flags instead of guesses; never diagnose, prescribe, or advise treatment.

## G. Extraction schema

`{ document: { date, type }, observations: [{ testName, value, numericValue, unit, referenceRange: { lower, upper, originalText }, status, observation, source: { page, text }, confidence, verificationStatus }] }` — validated with Zod. Malformed or partial output is stored as a failed/partial job with a clear message, never saved as authoritative.

## H. Provenance

Every value carries one of: `USER_PROVIDED`, `DOCUMENT_EXTRACTED`, `AI_GENERATED`, `HUMAN_VERIFIED`, plus document, page, snippet, timestamp, model, confidence. Edits write a new audit event and keep the original extracted value; provenance is never overwritten.

## I. Human verification

Review queue per document. Actions: Confirm, Edit, Reject, Mark uncertain. Editing preserves the AI original side by side. Dashboard counts "needs review" prominently.

## J. Security

Account-based login (email/password plus Google), ownership rules enforced in the database, server-side authorization checks on every data function, private storage with signed access, input and file validation, size limits, safe error messages, audit logging, no patient data in logs or analytics, no secrets in browser code. Privacy copy states "designed with privacy and security considerations" — no compliance claims.

## K. Components

Layout shell, patient context nav, `ObservationCard`, `ProvenanceBadge`, `ConfidenceBadge`, `StatusPill` (text + icon + colour, never colour alone), `ReviewActions`, `DocumentViewer`, `ExtractionPanel`, `ComparisonTable`, `TimelineList`, `SummaryPanel`, `ConflictBanner`, `EmptyState`, `UploadDropzone`, `ResponsibleAINotice`.

## L. Phases

1. Design system (calm clinical palette, typography scale, badges, cards, tables, states)
2. App shell + landing page + navigation
3. Backend: database schema, storage, auth, ownership rules
4. Patient intake + information editing
5. Document upload + processing status
6. AI extraction pipeline + schema validation + provenance
7. Review workspace (side-by-side source view)
8. Structured record: labs, timeline, provenance views
9. AI summary
10. Comparison + conflict detection
11. Export (JSON/CSV, labelled), settings, deletion flows
12. Quality pass: responsive, accessibility, all states, seeded synthetic demo patient

## M. Technical risks

- Scanned-image PDFs need OCR quality that varies; low-quality scans will be surfaced as partial extraction, not silently dropped.
- Page/snippet mapping is approximate for image-only documents; unmapped fields are flagged for review.
- Large PDFs must be chunked to stay within model limits.
- Unit variation across labs makes some comparisons invalid; those rows show "not comparable" rather than converting.

## N. Safety risks and mitigations

- *Fabricated reference ranges* — classification is deterministic code using only source ranges; missing range renders "Reference range not provided in source."
- *AI output treated as fact* — nothing is authoritative until human-confirmed; AI content is always badged.
- *Diagnostic drift in summaries* — summary built from structured fields with a constrained prompt and a mandatory disclaimer.
- *Alarmist framing* — neutral wording ("the reported value increased from X to Y"), no red-alert styling.
- *Data leakage* — ownership enforced server-side and in the database; private storage only.

## O. Recommended MVP

Phases 1–9 plus conflict detection and the seeded synthetic demo patient. Export, advanced search/filtering, and account deletion follow after.

## Ambiguities I will not guess at

- Whether reports should be processed for other people (caregiver access) — building single-owner only for now.
- Retention/deletion policy duration — records persist until the user deletes them.
- Whether OCR of handwritten notes is in scope — treating as out of scope; typed/printed documents only.
