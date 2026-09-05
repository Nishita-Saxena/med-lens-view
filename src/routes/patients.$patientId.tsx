import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, FileText, FlaskConical, ShieldCheck } from "lucide-react";
import { getPatient, listObservations, observationStatus, type Observation, type Patient } from "@/lib/medlens";

export const Route = createFileRoute("/patients/$patientId")({ component: PatientRoute });

function PatientRoute() {
  const { patientId } = Route.useParams();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getPatient(patientId), listObservations(patientId)])
      .then(([p, o]) => { setPatient(p); setObservations(o); })
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load patient."));
  }, [patientId]);

  if (error) return <main className="min-h-screen bg-slate-50 p-8"><div className="mx-auto max-w-3xl rounded-2xl border bg-white p-8 text-red-700">{error}</div></main>;
  if (!patient) return <div className="min-h-screen grid place-items-center bg-slate-50 text-slate-500">Loading patient record…</div>;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b bg-white"><div className="mx-auto max-w-6xl px-6 py-5"><Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"><ArrowLeft className="h-4 w-4" /> Patients</Link></div></header>
      <div className="mx-auto max-w-6xl px-6 py-8">
        <section className="rounded-3xl bg-slate-950 p-7 text-white"><div className="flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><div className="mb-3 inline-flex items-center gap-2 text-sm text-slate-300"><ShieldCheck className="h-4 w-4" /> Source-aware patient record</div><h1 className="text-4xl font-semibold tracking-tight">{patient.display_name}</h1><p className="mt-2 text-slate-300">{[patient.age && `${patient.age} years`, patient.sex, patient.patient_identifier].filter(Boolean).join(" · ") || "Patient details"}</p></div><div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">AI summaries are informational and require human review.</div></div></section>
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_2fr]">
          <section className="rounded-2xl border bg-white p-6"><h2 className="flex items-center gap-2 font-semibold"><FileText className="h-5 w-5" /> Documents</h2><div className="mt-8 text-center text-sm text-slate-500"><FileText className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3">No documents uploaded yet.</p><p className="mt-1">Document ingestion will preserve source pages and extracted text.</p></div></section>
          <section className="rounded-2xl border bg-white p-6"><div className="flex items-center justify-between"><div><h2 className="flex items-center gap-2 font-semibold"><FlaskConical className="h-5 w-5" /> Observations</h2><p className="mt-1 text-sm text-slate-500">Only source-supported ranges are used to classify values.</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium">{observations.length} recorded</span></div>
            {observations.length === 0 ? <div className="py-12 text-center text-sm text-slate-500">No extracted observations yet.</div> : <div className="mt-5 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b text-xs uppercase text-slate-400"><tr><th className="pb-3">Test</th><th className="pb-3">Value</th><th className="pb-3">Range</th><th className="pb-3">Status</th><th className="pb-3">Review</th></tr></thead><tbody>{observations.map((o) => { const status = observationStatus(o); return <tr key={o.id} className="border-b last:border-0"><td className="py-4 font-medium">{o.test_name}</td><td className="py-4">{o.value ?? "—"} {o.unit ?? ""}</td><td className="py-4 text-slate-500">{o.range_original_text ?? (o.range_lower != null && o.range_upper != null ? `${o.range_lower}–${o.range_upper}` : "Not provided")}</td><td className="py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${status === "NORMAL" ? "bg-emerald-50 text-emerald-700" : status === "UNDETERMINED" ? "bg-slate-100 text-slate-600" : "bg-amber-50 text-amber-700"}`}>{status}</span></td><td className="py-4 text-slate-500">{o.verification_status === "HUMAN_VERIFIED" ? <span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle2 className="h-4 w-4" /> Verified</span> : "Needs review"}</td></tr>; })}</tbody></table></div>}
          </section>
        </div>
      </div>
    </main>
  );
}
