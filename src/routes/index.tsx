import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, LogOut, Plus, Search, ShieldCheck, UserRound } from "lucide-react";
import { createPatient, getSession, listPatients, signIn, signOut, signUp, type Patient } from "@/lib/medlens";

export const Route = createFileRoute("/")({ component: Index });

type AuthMode = "signin" | "signup";

function Index() {
  const [session, setSession] = useState<boolean | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [query, setQuery] = useState("");
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [newName, setNewName] = useState("");
  const [newAge, setNewAge] = useState("");
  const [newSex, setNewSex] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function refresh() {
    const current = await getSession();
    setSession(Boolean(current));
    if (current) setPatients(await listPatients());
  }

  useEffect(() => { refresh().catch((e) => setError(e.message)); }, []);

  async function authenticate() {
    setBusy(true); setError("");
    try {
      if (authMode === "signin") await signIn(email, password);
      else await signUp(email, password, displayName);
      await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Authentication failed."); }
    finally { setBusy(false); }
  }

  async function addPatient() {
    if (!newName.trim()) return;
    setBusy(true); setError("");
    try {
      const patient = await createPatient({ display_name: newName.trim(), age: newAge ? Number(newAge) : undefined, sex: newSex || undefined });
      setPatients((items) => [patient, ...items]);
      setNewName(""); setNewAge(""); setNewSex("");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not create patient."); }
    finally { setBusy(false); }
  }

  if (session === null) return <div className="min-h-screen grid place-items-center bg-slate-50 text-slate-600">Loading MedLens…</div>;

  if (!session) return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-2 lg:items-center">
        <section>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-slate-300"><ShieldCheck className="h-4 w-4" /> Traceable clinical information</div>
          <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">MedLens</h1>
          <p className="mt-5 max-w-xl text-xl leading-8 text-slate-300">AI-powered clinical information intelligence for organizing, reviewing, and understanding medical records.</p>
          <div className="mt-8 grid gap-3 text-sm text-slate-300"><p>✓ Keep source information separate from generated summaries</p><p>✓ Preserve provenance and human verification</p><p>✓ Never turn extracted information into a diagnosis</p></div>
        </section>
        <section className="rounded-3xl bg-white p-7 text-slate-900 shadow-2xl">
          <div className="mb-6 flex gap-2 rounded-xl bg-slate-100 p-1"><button onClick={() => setAuthMode("signin")} className={`flex-1 rounded-lg py-2 text-sm font-medium ${authMode === "signin" ? "bg-white shadow" : "text-slate-500"}`}>Sign in</button><button onClick={() => setAuthMode("signup")} className={`flex-1 rounded-lg py-2 text-sm font-medium ${authMode === "signup" ? "bg-white shadow" : "text-slate-500"}`}>Create account</button></div>
          {authMode === "signup" && <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" className="mb-3 w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300" />}
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" className="mb-3 w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300" />
          <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" className="mb-4 w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300" />
          {error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          <button disabled={busy} onClick={authenticate} className="w-full rounded-xl bg-slate-950 px-4 py-3 font-medium text-white disabled:opacity-50">{busy ? "Working…" : authMode === "signin" ? "Sign in to MedLens" : "Create account"}</button>
        </section>
      </div>
    </main>
  );

  const filtered = patients.filter((p) => p.display_name.toLowerCase().includes(query.toLowerCase()) || (p.patient_identifier ?? "").toLowerCase().includes(query.toLowerCase()));
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5"><div><div className="text-xl font-semibold tracking-tight">MedLens</div><div className="text-xs text-slate-500">Clinical information workspace</div></div><button onClick={() => signOut().then(() => setSession(false))} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm"><LogOut className="h-4 w-4" /> Sign out</button></div></header>
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="text-sm font-medium text-slate-500">Patient workspace</p><h1 className="mt-1 text-4xl font-semibold tracking-tight">Your patients</h1><p className="mt-2 text-slate-600">Review source records, extracted observations, and verified information.</p></div><div className="relative w-full md:w-72"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search patients" className="w-full rounded-xl border bg-white py-2.5 pl-9 pr-3 text-sm" /></div></div>
        {error && <p className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        <div className="mb-8 rounded-2xl border bg-white p-5"><div className="mb-4 flex items-center gap-2 font-medium"><Plus className="h-4 w-4" /> Add patient</div><div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_auto]"><input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Patient name" className="rounded-xl border px-3 py-2.5" /><input value={newAge} onChange={(e) => setNewAge(e.target.value)} placeholder="Age" type="number" className="rounded-xl border px-3 py-2.5" /><input value={newSex} onChange={(e) => setNewSex(e.target.value)} placeholder="Sex" className="rounded-xl border px-3 py-2.5" /><button disabled={busy || !newName.trim()} onClick={addPatient} className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-40">Add</button></div></div>
        {filtered.length === 0 ? <div className="rounded-2xl border border-dashed bg-white py-16 text-center"><UserRound className="mx-auto h-8 w-8 text-slate-400" /><p className="mt-3 font-medium">No patients yet</p><p className="mt-1 text-sm text-slate-500">Create a patient above to start building a record.</p></div> : <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{filtered.map((p) => <Link key={p.id} to="/patients/$patientId" params={{ patientId: p.id }} className="group rounded-2xl border bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg"><div className="flex items-start justify-between"><div className="grid h-11 w-11 place-items-center rounded-xl bg-slate-100"><UserRound className="h-5 w-5" /></div><FileText className="h-5 w-5 text-slate-400 transition group-hover:text-slate-900" /></div><h2 className="mt-5 font-semibold">{p.display_name}</h2><p className="mt-1 text-sm text-slate-500">{[p.age && `${p.age} years`, p.sex].filter(Boolean).join(" · ") || "Patient record"}</p></Link>)}</div>}
      </div>
    </main>
  );
}
