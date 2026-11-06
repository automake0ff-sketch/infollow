/** Normaliza cabeceras y valores de CSV (español/inglés). Funciones puras, usadas en cliente y servidor. */

export function normHeader(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function clean(s: string | undefined | null, max: number): string | null {
  const t = (s ?? "").replace(/\s+/g, " ").trim();
  if (!t) return null;
  return t.length > max ? t.slice(0, max - 1) + "…" : t;
}

/** "250.000,50" · "250000" · "250.000 €" · "1,5" → número. undefined = no válido; null = vacío. */
export function parseNumber(s: string | undefined): number | null | undefined {
  const t = (s ?? "").replace(/[€$\s]|eur(os)?/gi, "").trim();
  if (!t) return null;
  let n: string;
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(t)) n = t.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(t)) n = t.replace(/,/g, "");
  else n = t.replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(n)) return undefined;
  const v = Number(n);
  return Number.isFinite(v) ? v : undefined;
}

export function parseInteger(s: string | undefined, max: number): number | null | undefined {
  const v = parseNumber(s);
  if (v === null || v === undefined) return v;
  return Number.isInteger(v) && v >= 0 && v <= max ? v : undefined;
}

const LEAD_TYPE_MAP: Record<string, string> = {
  comprador: "comprador", compra: "comprador", comprar: "comprador", buyer: "comprador",
  vendedor: "vendedor", venta: "vendedor", vender: "vendedor", seller: "vendedor",
  propietario: "propietario", dueno: "propietario", owner: "propietario",
  arrendatario: "arrendatario", inquilino: "arrendatario", alquiler: "arrendatario", alquilar: "arrendatario", tenant: "arrendatario",
  otro: "otro", other: "otro",
};
export function parseLeadType(s: string | undefined): string {
  const k = normHeader(s ?? "");
  return k ? (LEAD_TYPE_MAP[k] ?? "otro") : "comprador";
}

export function parseOperation(s: string | undefined): string | undefined {
  const k = normHeader(s ?? "");
  if (!k) return "venta";
  if (["venta", "vender", "sale", "comprar", "compra"].includes(k)) return "venta";
  if (["alquiler", "alquilar", "renta", "rent", "arrendamiento"].includes(k)) return "alquiler";
  return undefined;
}

const PROP_STATUS_MAP: Record<string, string> = {
  disponible: "disponible", activo: "disponible", activa: "disponible", available: "disponible",
  reservada: "reservada", reservado: "reservada", reserved: "reservada",
  vendida: "vendida", vendido: "vendida", sold: "vendida",
  alquilada: "alquilada", alquilado: "alquilada", rented: "alquilada",
  retirada: "retirada", retirado: "retirada", baja: "retirada", withdrawn: "retirada",
};
export function parsePropertyStatus(s: string | undefined): string | undefined {
  const k = normHeader(s ?? "");
  return k ? PROP_STATUS_MAP[k] : "disponible";
}

/** Estado del pipeline por etiqueta o clave; vacío o desconocido → "nuevo". */
export function parseStageKey(s: string | undefined, stages: { key: string; label: string }[]): string {
  const k = normHeader(s ?? "");
  if (!k) return "nuevo";
  const hit = stages.find((st) => normHeader(st.label) === k || normHeader(st.key) === k);
  return hit?.key ?? "nuevo";
}

/** Mismo criterio que la columna generada de SQL: últimos 9 dígitos. */
export function phoneNorm(s: string | null | undefined): string | null {
  const d = (s ?? "").replace(/\D/g, "").slice(-9);
  return d || null;
}

export function emailNorm(s: string | null | undefined): string | null {
  const t = (s ?? "").trim().toLowerCase();
  return t || null;
}

export function splitFeatures(s: string | undefined): string[] {
  return (s ?? "")
    .split(/[;,|]/)
    .map((x) => x.trim().slice(0, 60))
    .filter(Boolean)
    .slice(0, 30);
}
