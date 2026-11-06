import { stripThinking } from "./openrouter";

/** Extrae el primer objeto JSON de una respuesta de modelo (tolera ```json, texto previo y razonamiento). */
export function extractJson(text: string): unknown {
  const t = stripThinking(text).replace(/```(?:json)?/gi, "");
  const start = t.indexOf("{");
  if (start < 0) throw new Error("sin JSON");
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < t.length; i++) {
    const c = t[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return JSON.parse(t.slice(start, i + 1));
  }
  throw new Error("JSON incompleto");
}
