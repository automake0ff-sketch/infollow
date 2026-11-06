import type { SupabaseClient } from "@supabase/supabase-js";
import { AiError, chat, type ChatParams } from "./openrouter";

/**
 * Único camino hacia el modelo: reserva cupo en backend (límites por agencia y globales),
 * llama al proveedor y registra el resultado. Si algo falla, el uso queda como "error" y no consume cupo de agencia.
 */
export async function runAi<T = string>(
  supabase: SupabaseClient,
  feature: string,
  params: ChatParams,
  parse?: (text: string) => T
): Promise<{ result: T; text: string; model: string }> {
  const { data: usageId, error } = await supabase.rpc("ai_reserve", { p_feature: feature });
  if (error) {
    const m = error.message ?? "";
    if (m.includes("LIMITE_GLOBAL_IA")) throw new AiError("limit_global", "Límite global");
    if (m.includes("LIMITE_IA")) throw new AiError("limit_agency", "Límite de agencia");
    throw new AiError("unavailable", "No se pudo reservar el uso de IA");
  }
  try {
    const r = await chat(params);
    const result = parse ? parse(r.text) : (r.text as unknown as T);
    await supabase.rpc("ai_finish", { p_id: usageId, p_status: "ok", p_model: r.model });
    return { result, text: r.text, model: r.model };
  } catch (e) {
    await supabase.rpc("ai_finish", { p_id: usageId, p_status: "error" });
    if (e instanceof AiError) throw e;
    throw new AiError("bad_output", "Formato de respuesta no válido");
  }
}
