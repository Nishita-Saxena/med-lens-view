import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type"};
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return new Response(JSON.stringify({error:"Unauthorized"}), {status:401,headers:{...corsHeaders,"Content-Type":"application/json"}});
    const url = Deno.env.get("SUPABASE_URL")!;
    const service = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const anon = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {global:{headers:{Authorization:auth}}});
    const {data:{user}} = await anon.auth.getUser();
    if (!user) throw new Error("Unauthorized");
    const {patient_id} = await req.json() as {patient_id:string};
    const {data:patient} = await service.from("patients").select("id,display_name,owner_id").eq("id",patient_id).single();
    if (!patient || patient.owner_id !== user.id) return new Response(JSON.stringify({error:"Forbidden"}),{status:403,headers:{...corsHeaders,"Content-Type":"application/json"}});
    const {data:observations,error} = await service.from("observations").select("id,test_name,value,unit,range_original_text,status,verification_status,report_date,source_text").eq("patient_id",patient_id).order("report_date",{ascending:false,nullsFirst:false});
    if (error) throw error;
    const verified = (observations ?? []).filter((o) => o.verification_status === "HUMAN_VERIFIED");
    const summary = {
      title: "Source-grounded record summary",
      statement: "This summary only restates structured observations already present in the MedLens record. It is not a diagnosis or treatment recommendation.",
      verified_count: verified.length,
      review_count: (observations ?? []).length - verified.length,
      sections: [{heading:"Verified observations", items: verified.map((o) => ({test:o.test_name,value:o.value,unit:o.unit,reference:o.range_original_text,status:o.status,date:o.report_date}))}],
    };
    const {data:saved,error:savedError}=await service.from("summaries").insert({patient_id,content:summary,model:"grounded-template-v1",observation_ids:(verified.map((o)=>o.id))}).select().single();
    if(savedError) throw savedError;
    await service.from("audit_events").insert({patient_id,actor:"SYSTEM",action:"SUMMARY_GENERATED",entity_type:"summaries",entity_id:saved.id,detail:`Generated a source-grounded summary from ${verified.length} human-verified observations.`});
    return new Response(JSON.stringify({summary:saved}),{headers:{...corsHeaders,"Content-Type":"application/json"}});
  } catch(error) {
    return new Response(JSON.stringify({error:error instanceof Error?error.message:"Summary generation failed"}),{status:500,headers:{...corsHeaders,"Content-Type":"application/json"}});
  }
});
