"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireUser } from "@/lib/auth";
import { text } from "@/lib/form";
import { uuid } from "@/lib/schemas";
import { userMessage } from "@/lib/ai/openrouter";
import { runAi } from "@/lib/ai/service";
import { buildLeadContext } from "@/lib/ai/context";
import { ASSISTANT_KINDS, SCENARIOS, TONES, assistantPrompt, messagePrompt, refinePrompt, type AssistantKind, type RefineMode, type Scenario, type Tone } from "@/lib/ai/prompts";

const back = (id: string, error?: string): never => {
  revalidatePath(`/leads/${id}`);
  redirect(error ? `/leads/${id}?error=${encodeURIComponent(error)}#asistente` : `/leads/${id}#asistente`);
};

async function loadContext(supabase: SupabaseClient, leadId: string): Promise<string | null> {
  const { data: lead } = await supabase.from("leads").select("*").eq("id", leadId).maybeSingle();
  if (!lead) return null;
  const [{ data: stage }, { data: activities }, { data: links }, { data: tasks }] = await Promise.all([
    supabase.from("pipeline_stages").select("label").eq("key", lead.stage_key).maybeSingle(),
    supabase.from("activities").select("type, content, occurred_at").eq("lead_id", leadId).order("occurred_at", { ascending: false }).limit(8),
    supabase.from("lead_properties").select("property_id").eq("lead_id", leadId),
    supabase.from("tasks").select("title, due_at").eq("lead_id", leadId).eq("status", "pendiente").order("due_at").limit(3),
  ]);
  const ids = (links ?? []).map((l) => l.property_id);
  const { data: props } = ids.length
    ? await supabase.from("properties").select("reference, property_type, operation, zone, price").in("id", ids).limit(5)
    : { data: [] as { reference: string; property_type: string | null; operation: string; zone: string | null; price: number | null }[] };
  return buildLeadContext({ lead, stageLabel: stage?.label ?? lead.stage_key, activities: activities ?? [], properties: props ?? [], tasks: tasks ?? [] });
}

export async function generateMessage(f: FormData) {
  const { supabase } = await requireUser();
  const id = String(f.get("lead_id") ?? "");
  if (!uuid.safeParse(id).success) redirect("/leads");
  const scenario = String(f.get("scenario") ?? "");
  const tone = String(f.get("tone") ?? "cercano");
  if (!(scenario in SCENARIOS) || !(tone in TONES)) back(id, "Elige una situación y un tono");
  const extra = text(f, "extra")?.slice(0, 300) ?? null;
  const context = await loadContext(supabase, id);
  if (!context) redirect("/leads");
  try {
    const p = messagePrompt(context!, scenario as Scenario, tone as Tone, extra);
    const r = await runAi(supabase, "mensaje", { ...p, maxTokens: 400 });
    const { error } = await supabase.from("ai_messages").insert({
      lead_id: id, kind: "mensaje", scenario, tone, content: r.text.slice(0, 6000), original_content: r.text.slice(0, 6000), model: r.model,
    });
    if (error) back(id, "No se pudo guardar el mensaje generado");
  } catch (e) {
    back(id, userMessage(e));
  }
  back(id);
}

export async function refineMessage(f: FormData) {
  const { supabase } = await requireUser();
  const mid = String(f.get("message_id") ?? "");
  const mode = String(f.get("mode") ?? "") as RefineMode;
  const tone = String(f.get("tone") ?? "cercano") as Tone;
  if (!uuid.safeParse(mid).success || !["acortar", "mejorar", "cambiar_tono"].includes(mode) || !(tone in TONES)) redirect("/leads");
  const { data: m } = await supabase.from("ai_messages").select("lead_id, content, scenario, kind").eq("id", mid).maybeSingle();
  if (!m || m.kind !== "mensaje") redirect("/leads");
  try {
    const p = refinePrompt(m!.content, mode, tone);
    const r = await runAi(supabase, "mensaje_refinar", { ...p, maxTokens: 400 });
    const { error } = await supabase.from("ai_messages").insert({
      lead_id: m!.lead_id, kind: "mensaje", scenario: m!.scenario, tone: mode === "cambiar_tono" ? tone : null,
      content: r.text.slice(0, 6000), original_content: r.text.slice(0, 6000), model: r.model,
    });
    if (error) back(m!.lead_id, "No se pudo guardar el mensaje");
  } catch (e) {
    back(m!.lead_id, userMessage(e));
  }
  back(m!.lead_id);
}

export async function assistantAction(f: FormData) {
  const { supabase } = await requireUser();
  const id = String(f.get("lead_id") ?? "");
  const kind = String(f.get("kind") ?? "");
  if (!uuid.safeParse(id).success) redirect("/leads");
  if (!(kind in ASSISTANT_KINDS)) back(id, "Acción no válida");
  const context = await loadContext(supabase, id);
  if (!context) redirect("/leads");
  try {
    const r = await runAi(supabase, kind, { ...assistantPrompt(context!, kind as AssistantKind), maxTokens: 600 });
    const { error } = await supabase.from("ai_messages").insert({
      lead_id: id, kind, content: r.text.slice(0, 6000), original_content: r.text.slice(0, 6000), model: r.model,
    });
    if (error) back(id, "No se pudo guardar el resultado");
  } catch (e) {
    back(id, userMessage(e));
  }
  back(id);
}

export async function saveMessageEdit(f: FormData) {
  const { supabase } = await requireUser();
  const mid = String(f.get("message_id") ?? "");
  const content = text(f, "content");
  if (!uuid.safeParse(mid).success) redirect("/leads");
  const { data: m } = await supabase.from("ai_messages").select("lead_id, original_content, status").eq("id", mid).maybeSingle();
  if (!m) redirect("/leads");
  if (!content || content.length > 6000) back(m!.lead_id, "El mensaje no puede estar vacío");
  if (m!.status === "enviado") back(m!.lead_id, "Este mensaje ya está marcado como enviado");
  await supabase.from("ai_messages").update({ content, status: content === m!.original_content ? "generado" : "editado" }).eq("id", mid);
  back(m!.lead_id);
}

export async function markSent(f: FormData) {
  const { supabase } = await requireUser();
  const mid = String(f.get("message_id") ?? "");
  if (!uuid.safeParse(mid).success) redirect("/leads");
  const { data: m } = await supabase.from("ai_messages").select("lead_id").eq("id", mid).maybeSingle();
  if (!m) redirect("/leads");
  const { error } = await supabase.rpc("mark_message_sent", { p_message: mid });
  revalidatePath("/hoy");
  back(m!.lead_id, error ? "No se pudo registrar el envío" : undefined);
}
