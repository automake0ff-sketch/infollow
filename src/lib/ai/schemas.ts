import { z } from "zod";
import { parseNumber } from "../import/normalize";

const NS = "No especificado";
const str = z.preprocess(
  (v) => (v == null || (typeof v === "string" && v.trim() === "") ? NS : String(v).trim()),
  z.string().max(1500)
);
const list = z.preprocess(
  (v) =>
    Array.isArray(v)
      ? v.filter((x) => x != null && String(x).trim() && String(x).trim().toLowerCase() !== NS.toLowerCase()).map((x) => String(x).trim())
      : typeof v === "string" && v.trim() && v.trim().toLowerCase() !== NS.toLowerCase() ? [v.trim()] : [],
  z.array(z.string().max(500)).max(15)
);
const interest = z.preprocess(
  (v) => (["alto", "medio", "bajo"].includes(String(v ?? "").toLowerCase()) ? String(v).toLowerCase() : "no_especificado"),
  z.enum(["alto", "medio", "bajo", "no_especificado"])
);
const days = z.preprocess((v) => {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(90, Math.max(0, Math.round(n))) : null;
}, z.number().int().min(0).max(90).nullable());
const amount = z.preprocess((v) => {
  if (v == null || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) && v >= 0 ? v : null;
  const n = parseNumber(String(v)); // entiende "250.000 €", "250000", "1,5"
  return typeof n === "number" && n >= 0 ? n : null;
}, z.number().nonnegative().nullable());

export const analysisSchema = z.object({
  resumen: str,
  necesidades: str,
  presupuesto_mencionado: str,
  presupuesto_numero: amount,
  zona: str,
  tipo_inmueble: str,
  nivel_interes: interest,
  objeciones: list,
  informacion_pendiente: list,
  proxima_accion: str,
  dias_hasta_proximo_contacto: days,
  borrador_respuesta: str,
});
export type Analysis = z.infer<typeof analysisSchema>;
