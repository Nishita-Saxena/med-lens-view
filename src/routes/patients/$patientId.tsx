import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, FileText, ShieldCheck, UserRound } from "lucide-react";
import { getPatient, listObservations, observationStatus, type Observation } from "@/lib/medlens";

export const Route = createFileRoute("/patients/$patientId")({ component: PatientPage });

function PatientPage() {
  const { patientId } = Route.useParams();
  const [patient, setPatient] = useState<Awaited<ReturnType<typeof getPatient>> | null>(null);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getPatient(patientId), listObservations(patientId)])
      .then(([p, o]) => { setPatient(p); setObservations(o); })
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load patient."))
      .finally(() => setLoading(false));
  }, [patientId]);

  const counts = useMemo(() => observations.reduce((acc, item) => { const key = observationStatus(item); acc[key] = (acc[key] ?? 0) + 1; return acc; }, {} as Record<string, number>), [observations]);

  if (loading) return <div className="min-h-screen grid place-items-center bg-slate-50 text-slate-600">Loading patient record…</div>;
  if (error || !patient) return <main className="min-h-screen bg-slate-50 p-6"><div className="mx-auto max-w-2xl rounded-2xl border bg-white p-8"><p className="font-medium">Unable to open patient</p><p className="mt-2 text-sm text-slate-600">{error || "Patient not found."}</p><Link className="mt-5 inline-flex text-sm font-medium underline" to="/">Back to patients</Link></div></main>;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b bg-white"><div className="mx-auto flex max-w-6xl items-center px-6 py-5"><Link to="/" className="mr-4 inline-flex items-center gap-2 text-sm text-slate-600"><ArrowLeft className="h-4 w-4" /> Patients</Link><div className="h-5 w-px bg-slate-200"/><div className="ml-4"><div className="text-xl font-semibold">MedLens</div><div className="text-xs text-slate-500">Patient record</div></div></div></header>
      <div className="mx-auto max-w-6xl px-6 py-10">
        <section className="rounded-3xl border bg-white p-7 shadow-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between"><div className="flex gap-4"><div className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-100"><UserRound className="h-6 w-6"/></div><div><p className="text-sm text-slate-500">Patient</p><h1 className="text-3xl font-semibold tracking-tight">{patient.display_name}</h1><p className="mt-2 text-sm text-slate-500">{[patient.age && `${patient.age} years`, patient.sex, patient.patient_identifier].filter(Boolean).join(" · ") || "No additional demographics"}</p></div></div><div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700"><ShieldCheck className="h-4 w-4"/> Source-aware workspace</div></div>
        </section>
        <div className="mt-6 grid gap-4 md:grid-cols-4">{[["Observations", observations.length], ["Low", counts.LOW ?? 0], ["High", counts.HIGH ?? 0], ["Needs review", observations.filter((o) => o.verification_status !== "HUMAN_VERIFIED").length]].map(([label, value]) => <div key={String(label)} className="rounded-2xl border bg-white p-5"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-semibold">{value}</p></div>)}</div>
        <section className="mt-6 overflow-hidden rounded-2xl border bg-white"><div className="flex items-center justify-between border-b px-5 py-4"><div><h2 className="font-semibold">Clinical observations</h2><p className="text-sm text-slate-500">Only values and ranges represented in source data are displayed.</p></div><FileText className="h-5 w-5 text-slate-400"/></div>{observations.length === 0 ? <div className="px-5 py-14 text-center text-sm text-slate-500">No extracted observations yet. Document upload and processing can populate this section.</div> : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Test</th><th className="px-5 py-3">Value</th><th className="px-5 py-3">Reference</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Verification</th></tr></thead><tbody className="divide-y">{observations.map((o) => { const status = observationStatus(o); return <tr key={o.id}><td className="px-5 py-4 font-medium">{o.test_name}</td><td className="px-5 py-4">{o.value ?? "—"} {o.unit ?? ""}</td><td className="px-5 py-4 text-slate-600">{o.range_original_text ?? (o.range_lower != null && o.range_upper != null ? `${o.range_lower} – ${o.range_upper}` : "Not provided")}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${status === "HIGH" ? "bg-red-50 text-red-700" : status === "LOW" ? "bg-amber-50 text-amber-700" : status === "NORMAL" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{status}</span></td><td className="px-5 py-4 text-slate-600">{o.verification_status}</td></tr>; })}</tbody></table></div>}</section>
        <section className="mt-6 rounded-2xl border bg-white p-5"><h2 className="font-semibold">Safety boundary</h2><p className="mt-2 text-sm leading-6 text-slate-600">MedLens organizes and summarizes source information. It does not provide diagnoses, prescribe treatment, or recommend medication changes.</p></section>
      </div>
    </main>
  );
}
