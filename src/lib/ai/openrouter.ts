/** Cliente de OpenRouter (solo servidor). Un único punto de acceso al proveedor de IA. */

export type AiErrorCode = "no_key" | "auth" | "credits" | "rate" | "unavailable" | "bad_output" | "limit_agency" | "limit_global";

export class AiError extends Error {
  constructor(public code: AiErrorCode, message: string) {
    super(message);
    this.name = "AiError";
  }
}

export type ChatParams = { system: string; user: string; maxTokens?: number; temperature?: number };
export type AiEnv = Partial<Record<
  "OPENROUTER_API_KEY" | "OPENROUTER_MODELS" | "OPENROUTER_DATA_COLLECTION" | "OPENROUTER_APP_URL" | "OPENROUTER_TIMEOUT_MS",
  string
>>;

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
// "openrouter/free" elige un modelo gratuito disponible en cada momento (la lista de :free cambia sin aviso).
export const DEFAULT_MODELS = ["openrouter/free"];

export function stripThinking(s: string): string {
  return s.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
}

export async function chat(
  p: ChatParams,
  deps: { fetchImpl?: typeof fetch; env?: AiEnv } = {}
): Promise<{ text: string; model: string }> {
  const env = deps.env ?? (process.env as AiEnv);
  const f = deps.fetchImpl ?? fetch;
  const key = env.OPENROUTER_API_KEY;
  if (!key) throw new AiError("no_key", "Falta OPENROUTER_API_KEY");

  const configured = (env.OPENROUTER_MODELS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const models = configured.length ? configured : DEFAULT_MODELS;
  const timeout = Number(env.OPENROUTER_TIMEOUT_MS) || 45000;
  // Por defecto se excluyen endpoints que puedan entrenar con los prompts (privacidad por defecto).
  const dataCollection = env.OPENROUTER_DATA_COLLECTION === "allow" ? "allow" : "deny";

  let last: AiError | null = null;
  for (const model of models) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeout);
    try {
      const res = await f(ENDPOINT, {
        method: "POST",
        signal: ctl.signal,
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          "X-Title": "INMO FOLLOW AI",
          ...(env.OPENROUTER_APP_URL ? { "HTTP-Referer": env.OPENROUTER_APP_URL } : {}),
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: p.system },
            { role: "user", content: p.user },
          ],
          max_tokens: p.maxTokens ?? 700,
          temperature: p.temperature ?? 0.4,
          provider: { data_collection: dataCollection },
        }),
      });
      if (res.status === 401 || res.status === 403) throw new AiError("auth", "Clave de OpenRouter no válida");
      if (res.status === 402) throw new AiError("credits", "Saldo negativo en OpenRouter");
      if (res.status === 429) { last = new AiError("rate", "Límite de OpenRouter alcanzado"); continue; }
      if (!res.ok) { last = new AiError("unavailable", `OpenRouter respondió ${res.status}`); continue; }
      const data = (await res.json()) as { model?: unknown; choices?: { message?: { content?: unknown } }[] };
      const raw = data?.choices?.[0]?.message?.content;
      const text = typeof raw === "string" ? stripThinking(raw) : "";
      if (!text) { last = new AiError("bad_output", "Respuesta vacía"); continue; }
      return { text, model: typeof data.model === "string" ? data.model : model };
    } catch (e) {
      if (e instanceof AiError && (e.code === "auth" || e.code === "credits")) throw e;
      last = new AiError("unavailable", "No se pudo contactar con el proveedor");
    } finally {
      clearTimeout(timer);
    }
  }
  throw last ?? new AiError("unavailable", "Sin modelos configurados");
}

export function userMessage(e: unknown): string {
  if (e instanceof AiError) {
    switch (e.code) {
      case "limit_agency": return "Has alcanzado el límite diario de usos de IA de tu agencia. Se renueva mañana.";
      case "limit_global": return "El servicio de IA ha alcanzado su capacidad diaria. Inténtalo mañana.";
      case "rate": return "El servicio de IA está saturado en este momento. Inténtalo de nuevo en un minuto.";
      case "no_key": return "La IA aún no está configurada en este entorno.";
      case "bad_output": return "La IA no devolvió una respuesta utilizable. Inténtalo de nuevo (este intento no consume tu cupo).";
      default: return "El servicio de IA no está disponible ahora mismo. Inténtalo más tarde.";
    }
  }
  return "No se pudo completar la acción de IA.";
}
