import { leadSchema, propertySchema } from "../schemas";
import {
  clean, parseInteger, parseLeadType, parseNumber, parseOperation, parsePropertyStatus, parseStageKey, splitFeatures,
} from "./normalize";

export type RowResult<T> = { ok: true; data: T } | { ok: false; error: string };
type Stage = { key: string; label: string };

export type LeadInsert = {
  full_name: string; phone: string | null; email: string | null; lead_type: string; stage_key: string;
  budget: number | null; zone: string | null; property_type: string | null; bedrooms: number | null;
  preferences: string | null; notes: string | null; source: string | null;
};

export function validateLeadRow(raw: Record<string, string>, stages: Stage[]): RowResult<LeadInsert> {
  const budget = parseNumber(raw.budget);
  if (budget === undefined) return { ok: false, error: `Presupuesto no válido: "${raw.budget}"` };
  const bedrooms = parseInteger(raw.bedrooms, 20);
  if (bedrooms === undefined) return { ok: false, error: `Habitaciones no válidas: "${raw.bedrooms}"` };
  const name = clean(raw.full_name, 500);
  if (!name) return { ok: false, error: "Falta el nombre" };

  const parsed = leadSchema.safeParse({
    full_name: name,
    phone: clean(raw.phone, 30),
    email: clean(raw.email, 160),
    lead_type: parseLeadType(raw.lead_type),
    budget,
    zone: clean(raw.zone, 120),
    property_type: clean(raw.property_type, 60),
    bedrooms,
    preferences: clean(raw.preferences, 2000),
    notes: clean(raw.notes, 4000),
    source: clean(raw.source, 80) ?? "Importación CSV",
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  return { ok: true, data: { ...parsed.data, stage_key: parseStageKey(raw.stage, stages) } };
}

export type PropertyInsert = {
  reference: string; property_type: string | null; operation: string; price: number | null; address: string | null;
  zone: string | null; bedrooms: number | null; bathrooms: number | null; area_m2: number | null;
  description: string | null; features: string[]; status: string;
};

export function validatePropertyRow(raw: Record<string, string>): RowResult<PropertyInsert> {
  const price = parseNumber(raw.price);
  if (price === undefined) return { ok: false, error: `Precio no válido: "${raw.price}"` };
  const area = parseNumber(raw.area_m2);
  if (area === undefined) return { ok: false, error: `Superficie no válida: "${raw.area_m2}"` };
  const bedrooms = parseInteger(raw.bedrooms, 50);
  if (bedrooms === undefined) return { ok: false, error: `Habitaciones no válidas: "${raw.bedrooms}"` };
  const bathrooms = parseInteger(raw.bathrooms, 50);
  if (bathrooms === undefined) return { ok: false, error: `Baños no válidos: "${raw.bathrooms}"` };
  const operation = parseOperation(raw.operation);
  if (!operation) return { ok: false, error: `Operación no reconocida: "${raw.operation}" (usa venta o alquiler)` };
  const status = parsePropertyStatus(raw.status);
  if (!status) return { ok: false, error: `Estado no reconocido: "${raw.status}"` };
  const reference = clean(raw.reference, 100);
  if (!reference) return { ok: false, error: "Falta la referencia" };

  const parsed = propertySchema.safeParse({
    reference,
    property_type: clean(raw.property_type, 60),
    operation,
    price,
    address: clean(raw.address, 200),
    zone: clean(raw.zone, 120),
    bedrooms,
    bathrooms,
    area_m2: area,
    description: clean(raw.description, 4000),
    features: splitFeatures(raw.features),
    status,
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  return { ok: true, data: parsed.data as PropertyInsert };
}
