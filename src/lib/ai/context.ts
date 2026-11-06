/** Contexto mínimo del lead para la IA: sin teléfono, email ni apellidos; texto libre con datos de contacto ocultados. */

export function redact(s: string): string {
  return s
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[dato oculto]")
    .replace(/\+?\d[\d\s().-]{6,}\d/g, "[dato oculto]");
}

const cut = (s: string | null | undefined, n: number) => {
  const t = redact((s ?? "").replace(/\s+/g, " ").trim());
  return t.length > n ? t.slice(0, n) + "…" : t;
};

export function firstName(full: string): string {
  return (full.trim().split(/\s+/)[0] ?? "").slice(0, 40);
}

const daysAgo = (iso: string | null | undefined, now: Date) =>
  iso ? Math.max(0, Math.floor((now.getTime() - new Date(iso).getTime()) / 86400000)) : null;

export type CtxLead = {
  full_name: string; lead_type: string; budget: number | string | null; zone: string | null; property_type: string | null;
  bedrooms: number | null; preferences: string | null; notes: string | null; source: string | null;
  created_at: string; last_interaction_at: string | null;
};
export type CtxActivity = { type: string; content: string | null; occurred_at: string };
export type CtxProperty = { reference: string; property_type: string | null; operation: string; zone: string | null; price: number | string | null };
export type CtxTask = { title: string; due_at: string };

export function buildLeadContext(i: {
  lead: CtxLead; stageLabel: string; activities: CtxActivity[]; properties: CtxProperty[]; tasks: CtxTask[]; now?: Date;
}): string {
  const now = i.now ?? new Date();
  const l = i.lead;
  const lines: string[] = [];
  lines.push(`Nombre de pila del cliente: ${firstName(l.full_name) || "No consta"}`);
  lines.push(`Tipo de contacto: ${l.lead_type}`);
  lines.push(`Estado comercial: ${i.stageLabel}`);
  lines.push(`Presupuesto: ${l.budget ? `${Number(l.budget).toLocaleString("es-ES")} €` : "No consta"}`);
  lines.push(`Zona de interés: ${l.zone || "No consta"}`);
  lines.push(`Tipo de inmueble buscado: ${l.property_type || "No consta"}`);
  lines.push(`Habitaciones: ${l.bedrooms ?? "No consta"}`);
  if (l.source) lines.push(`Fuente: ${cut(l.source, 60)}`);
  if (l.preferences) lines.push(`Preferencias: ${cut(l.preferences, 500)}`);
  if (l.notes) lines.push(`Notas del agente: ${cut(l.notes, 600)}`);
  lines.push(`Lead creado hace ${daysAgo(l.created_at, now)} días`);
  const last = daysAgo(l.last_interaction_at, now);
  lines.push(`Última interacción registrada: ${last === null ? "ninguna" : `hace ${last} días`}`);

  if (i.properties.length) {
    lines.push("Propiedades relacionadas:");
    for (const p of i.properties.slice(0, 5))
      lines.push(`- ${cut(p.reference, 40)} · ${p.property_type || "inmueble"} · ${p.operation} · ${p.zone || "zona no consta"} · ${p.price ? `${Number(p.price).toLocaleString("es-ES")} €` : "precio no consta"}`);
  } else lines.push("Propiedades relacionadas: ninguna");

  if (i.tasks.length) {
    lines.push("Seguimientos pendientes:");
    for (const t of i.tasks.slice(0, 3)) lines.push(`- ${cut(t.title, 120)} (para el ${new Date(t.due_at).toLocaleDateString("es-ES", { timeZone: "Europe/Madrid" })})`);
  } else lines.push("Seguimientos pendientes: ninguno");

  if (i.activities.length) {
    lines.push("Historial reciente (más nuevo primero):");
    for (const a of i.activities.slice(0, 8))
      lines.push(`- [${new Date(a.occurred_at).toLocaleDateString("es-ES", { timeZone: "Europe/Madrid" })}] ${a.type}: ${cut(a.content, 300) || "(sin texto)"}`);
  } else lines.push("Historial: sin actividad registrada");

  return lines.join("\n");
}
