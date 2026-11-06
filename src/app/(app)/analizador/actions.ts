"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { text, num } from "@/lib/form";
import { uuid } from "@/lib/schemas";
import { userMessage } from "@/lib/ai/openrouter";
import { runAi } from "@/lib/ai/service";
import { extractJson } from "@/lib/ai/json";
import { analysisSchema, type Analysis } from "@/lib/ai/schemas";
import { analysisPrompt } from "@/lib/ai/prompts";

export type AnalyzeState = { ok: true; analysis: Analysis; leadId: string } | { ok: false; error: string } | null;

export async function analyzeConversation(_prev: AnalyzeState, f: FormData): Promise<AnalyzeState> {
  const { supabase } = await requireUser();
  const conversation = text(f, "conversation");
  const leadId = String(f.get("lead_id") ?? "");
  if (!conversation) return { ok: false, error: "Pega la conversación o las notas de la llamada." };
  if (conversation.length > 8000) return { ok: false, error: "El texto supera los 8.000 caracteres. Pega solo la parte relevante." };
  if (!uuid.safeParse(leadId).success) return { ok: false, error: "Elige el lead al que pertenece la conversación." };
  try {
    const r = await runAi(supabase, "analizador", { ...analysisPrompt(conversation), maxTokens: 900, temperature: 0.2 }, (t) => analysisSchema.parse(extractJson(t)));
    return { ok: true, analysis: r.result, leadId };
  } catch (e) {
    return { ok: false, error: userMessage(e) };
  }
}

/** Guarda en el CRM SOLO lo que el agente ha revisado y marcado. */
export async function saveAnalysis(f: FormData) {
  const { supabase } = await requireUser();
  const id = String(f.get("lead_id") ?? "");
  if (!uuid.safeParse(id).success) redirect("/leads");
  const fail = (m: string): never => redirect(`/analizador?error=${encodeURIComponent(m)}`);
  const on = (k: string) => f.get(k) === "on";
  let did = 0;

  if (on("save_note")) {
    const note = text(f, "note");
    if (!note || note.length > 3500) fail("La nota está vacía o es demasiado larga");
    const { error } = await supabase.from("activities").insert({ lead_id: id, type: "nota", content: `Análisis de conversación (IA, revisado por el agente): ${note}` });
    if (error) fail("No se pudo guardar la nota");
    did++;
  }
  if (on("save_budget")) {
    const b = num(f, "budget");
    if (b === null || !Number.isFinite(b) || b < 0) fail("Presupuesto no válido");
    const { error } = await supabase.from("leads").update({ budget: b }).eq("id", id);
    if (error) fail("No se pudo actualizar el presupuesto");
    did++;
  }
  if (on("save_zone")) {
    const z = text(f, "zone");
    if (!z || z.length > 120) fail("Zona no válida");
    const { error } = await supabase.from("leads").update({ zone: z }).eq("id", id);
    if (error) fail("No se pudo actualizar la zona");
    did++;
  }
  if (on("save_task")) {
    const title = text(f, "task_title");
    const days = Number(f.get("task_days"));
    if (!title || title.length > 200 || !Number.isInteger(days) || days < 0 || days > 90) fail("Seguimiento no válido");
    const { error } = await supabase.rpc("create_task_in_days", { p_lead: id, p_title: title, p_days: days });
    if (error) fail("No se pudo crear el seguimiento");
    did++;
  }
  revalidatePath(`/leads/${id}`);
  revalidatePath("/hoy");
  redirect(did ? `/leads/${id}?saved=1` : `/analizador?error=${encodeURIComponent("No marcaste nada para guardar")}`);
}
