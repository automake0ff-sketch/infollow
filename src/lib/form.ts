export function text(f: FormData, name: string): string | null {
  const v = f.get(name);
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t === "" ? null : t;
}

export function num(f: FormData, name: string): number | null {
  const t = text(f, name);
  if (t === null) return null;
  const n = Number(t.replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
}

export function fmtDate(iso: string | null | undefined) {
  return iso ? new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" }) : "—";
}

export function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function fmtMoney(n: number | string | null | undefined) {
  if (n === null || n === undefined || n === "") return "—";
  return Number(n).toLocaleString("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}

/** Elimina caracteres con significado especial en filtros PostgREST (.or / ilike). */
export function safeSearch(q: string) {
  return q.replace(/[,()%*\\:"']/g, " ").trim().slice(0, 60);
}
