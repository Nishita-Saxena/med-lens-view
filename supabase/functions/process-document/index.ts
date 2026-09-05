import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ExtractedObservation = {
  test_name: string;
  value: string;
  numeric_value: number | null;
  unit: string | null;
  range_lower: number | null;
  range_upper: number | null;
  range_original_text: string | null;
  status: string;
  confidence: string;
  source_page: number | null;
  source_text: string;
};

function csvLines(text: string): string[][] {
  return text.split(/\r?\n/).filter(Boolean).map((line) => {
    const cells: string[] = [];
    let current = "";
    let quoted = false;
    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      if (char === '"' && line[i + 1] === '"') { current += '"'; i += 1; continue; }
      if (char === '"') { quoted = !quoted; continue; }
      if (char === "," && !quoted) { cells.push(current.trim()); current = ""; continue; }
      current += char;
    }
    cells.push(current.trim());
    return cells;
  });
}

function inferObservations(text: string): ExtractedObservation[] {
  const rows = csvLines(text.replace(/\u00a0/g, " "));
  const results: ExtractedObservation[] = [];
  for (const row of rows) {
    if (row.length < 2) continue;
    const lower = row.map((c) => c.toLowerCase());
    const numericIndex = row.findIndex((c) => /^[-+]?\d+(?:\.\d+)?$/.test(c.replace(/,/g, "")));
    if (numericIndex < 0) continue;
    const testName = row.slice(0, numericIndex).join(" ").trim();
    if (!testName || /^(test|name|analyte|parameter)$/i.test(testName)) continue;
    const value = row[numericIndex];
    let unit: string | null = null;
    const after = row.slice(numericIndex + 1).filter(Boolean);
    const rangeCell = after.find((c) => /\d/.test(c) && /[-–—]|to|</.test(c));
    const unitCell = after.find((c) => /^[A-Za-zµμ/%^0-9.]+(?:\/[A-Za-z0-9]+)?$/.test(c) && !/\d+\s*[-–—]\s*\d+/.test(c));
    if (unitCell && !/^\d/.test(unitCell)) unit = unitCell;
    let rangeLower: number | null = null;
    let rangeUpper: number | null = null;
    let rangeOriginal: string | null = null;
    if (rangeCell) {
      rangeOriginal = rangeCell;
      const nums = rangeCell.match(/[-+]?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
      if (nums.length >= 2) { rangeLower = nums[0]; rangeUpper = nums[1]; }
    }
    const numeric = Number(value.replace(/,/g, ""));
    let status = "UNDETERMINED";
    if (rangeLower != null && rangeUpper != null) status = numeric < rangeLower ? "LOW" : numeric > rangeUpper ? "HIGH" : "NORMAL";
    results.push({ test_name: testName, value, numeric_value: numeric, unit, range_lower: rangeLower, range_upper: rangeUpper, range_original_text: rangeOriginal, status, confidence: "NEEDS_VERIFICATION", source_page: null, source_text: row.join(" | ") });
  }
  return results.slice(0, 500);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const url = Deno.env.get("SUPABASE_URL")!;
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, key);
    const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { document_id } = await req.json() as { document_id: string };
    const { data: document, error: documentError } = await admin.from("medical_documents").select("*").eq("id", document_id).single();
    if (documentError || !document) throw new Error("Document not found");
    const { data: patient } = await admin.from("patients").select("owner_id").eq("id", document.patient_id).single();
    if (!patient || patient.owner_id !== user.id) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    await admin.from("medical_documents").update({ processing_status: "PROCESSING", processing_error: null }).eq("id", document_id);
    let extractedText = document.extracted_text ?? "";
    if (document.storage_path) {
      const { data: file, error: downloadError } = await admin.storage.from("patient-documents").download(document.storage_path);
      if (!downloadError && file) {
        if ((document.mime_type ?? "").includes("text")) extractedText = await file.text();
        else if ((document.mime_type ?? "").includes("csv")) extractedText = await file.text();
      }
    }
    const observations = inferObservations(extractedText);
    await admin.from("medical_documents").update({ extracted_text: extractedText, processing_status: "COMPLETED", page_count: null }).eq("id", document_id);
    if (observations.length) {
      await admin.from("observations").delete().eq("document_id", document_id);
      const payload = observations.map((o) => ({ ...o, patient_id: document.patient_id, document_id, report_date: document.report_date, source_type: "DOCUMENT_EXTRACTED", extraction_model: "rules-v1", verification_status: "NEEDS_REVIEW", original_extracted: o }));
      await admin.from("observations").insert(payload);
    }
    await admin.from("audit_events").insert({ patient_id: document.patient_id, actor: "SYSTEM", action: "DOCUMENT_PROCESSED", entity_type: "medical_documents", entity_id: document_id, detail: `Extracted ${observations.length} candidate observations; all require human verification.` });
    return new Response(JSON.stringify({ ok: true, observations: observations.length }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Processing failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
