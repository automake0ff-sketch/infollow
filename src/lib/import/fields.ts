import { normHeader } from "./normalize";

export type FieldDef = { key: string; label: string; synonyms: string[]; required?: boolean };

export const LEAD_FIELDS: FieldDef[] = [
  { key: "full_name", label: "Nombre", required: true, synonyms: ["nombre", "nombrecompleto", "cliente", "contacto", "name", "fullname", "nombreyapellidos", "nombreapellidos"] },
  { key: "phone", label: "Teléfono", synonyms: ["telefono", "tel", "movil", "celular", "phone", "mobile", "telefonomovil", "whatsapp"] },
  { key: "email", label: "Email", synonyms: ["email", "correo", "correoelectronico", "mail", "emailaddress"] },
  { key: "lead_type", label: "Tipo de contacto", synonyms: ["tipo", "tipodecontacto", "tipocontacto", "type", "perfil"] },
  { key: "stage", label: "Estado comercial", synonyms: ["estado", "fase", "etapa", "status", "stage"] },
  { key: "budget", label: "Presupuesto", synonyms: ["presupuesto", "budget", "preciomaximo", "maximo"] },
  { key: "zone", label: "Zona de interés", synonyms: ["zona", "zonadeinteres", "barrio", "localidad", "ciudad", "zone", "area"] },
  { key: "property_type", label: "Tipo de inmueble", synonyms: ["tipodeinmueble", "tipoinmueble", "inmueble", "propertytype", "tipodevivienda"] },
  { key: "bedrooms", label: "Habitaciones", synonyms: ["habitaciones", "dormitorios", "hab", "bedrooms", "rooms"] },
  { key: "source", label: "Fuente", synonyms: ["fuente", "origen", "procedencia", "source", "canal"] },
  { key: "preferences", label: "Preferencias", synonyms: ["preferencias", "preferences"] },
  { key: "notes", label: "Notas", synonyms: ["notas", "observaciones", "comentarios", "notes", "comments"] },
];

export const PROPERTY_FIELDS: FieldDef[] = [
  { key: "reference", label: "Referencia", required: true, synonyms: ["referencia", "ref", "codigo", "id", "reference", "refinmueble"] },
  { key: "property_type", label: "Tipo de inmueble", synonyms: ["tipo", "tipodeinmueble", "tipoinmueble", "propertytype", "inmueble"] },
  { key: "operation", label: "Operación", synonyms: ["operacion", "tipooperacion", "operation", "ventaalquiler"] },
  { key: "price", label: "Precio", synonyms: ["precio", "price", "importe"] },
  { key: "address", label: "Dirección", synonyms: ["direccion", "domicilio", "calle", "address"] },
  { key: "zone", label: "Zona", synonyms: ["zona", "barrio", "localidad", "ciudad", "zone", "area"] },
  { key: "bedrooms", label: "Habitaciones", synonyms: ["habitaciones", "dormitorios", "hab", "bedrooms", "rooms"] },
  { key: "bathrooms", label: "Baños", synonyms: ["banos", "bano", "aseos", "wc", "bathrooms"] },
  { key: "area_m2", label: "Superficie (m²)", synonyms: ["superficie", "m2", "metros", "metroscuadrados", "sqm", "tamano", "aream2"] },
  { key: "description", label: "Descripción", synonyms: ["descripcion", "description", "detalle"] },
  { key: "features", label: "Características", synonyms: ["caracteristicas", "extras", "features", "equipamiento"] },
  { key: "status", label: "Estado", synonyms: ["estado", "status", "situacion"] },
];

export const FIELDS = { leads: LEAD_FIELDS, properties: PROPERTY_FIELDS } as const;
export type ImportKind = keyof typeof FIELDS;

/** Propone qué columna del CSV corresponde a cada campo (primero coincidencia exacta, luego parcial). */
export function guessMapping(headers: string[], fields: FieldDef[]): Record<string, string> {
  const norm = headers.map((h) => ({ h, n: normHeader(h) }));
  const used = new Set<string>();
  const out: Record<string, string> = {};
  for (const pass of ["exact", "partial"] as const) {
    for (const f of fields) {
      if (out[f.key]) continue;
      const hit = norm.find(
        (c) =>
          !used.has(c.h) &&
          (pass === "exact" ? f.synonyms.includes(c.n) : f.synonyms.some((s) => s.length >= 4 && c.n.includes(s)))
      );
      if (hit) {
        out[f.key] = hit.h;
        used.add(hit.h);
      }
    }
  }
  return out;
}

export function mapRow(record: Record<string, string>, mapping: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [field, header] of Object.entries(mapping)) {
    if (header) out[field] = String(record[header] ?? "");
  }
  return out;
}
