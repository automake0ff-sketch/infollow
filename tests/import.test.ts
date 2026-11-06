import { describe, expect, it } from "vitest";
import { guessMapping, LEAD_FIELDS, PROPERTY_FIELDS, mapRow } from "@/lib/import/fields";
import { emailNorm, parseInteger, parseNumber, parseOperation, parseStageKey, phoneNorm } from "@/lib/import/normalize";
import { validateLeadRow, validatePropertyRow } from "@/lib/import/validate";

const stages = [
  { key: "nuevo", label: "Nuevo" },
  { key: "visita_pendiente", label: "Visita pendiente" },
  { key: "negociacion", label: "Negociación" },
];

describe("números", () => {
  it("entiende formatos españoles y vacíos", () => {
    expect(parseNumber("250.000")).toBe(250000);
    expect(parseNumber("250.000,50 €")).toBe(250000.5);
    expect(parseNumber("1,5")).toBe(1.5);
    expect(parseNumber("250000")).toBe(250000);
    expect(parseNumber("")).toBeNull();
    expect(parseNumber("mucho")).toBeUndefined();
    expect(parseInteger("3", 20)).toBe(3);
    expect(parseInteger("99", 20)).toBeUndefined();
  });
});

describe("claves de duplicado (mismas reglas que SQL)", () => {
  it("normaliza teléfonos y emails", () => {
    expect(phoneNorm("+34 600-123 456")).toBe("600123456");
    expect(phoneNorm("600 123 456")).toBe("600123456");
    expect(phoneNorm("abc")).toBeNull();
    expect(emailNorm(" ANA@Mail.com ")).toBe("ana@mail.com");
    expect(emailNorm("  ")).toBeNull();
  });
});

describe("mapeo de columnas", () => {
  it("propone la correspondencia por sinónimos y acentos", () => {
    const m = guessMapping(["Nombre completo", "Teléfono móvil", "E-mail", "Presupuesto máx.", "Zona", "Observaciones"], LEAD_FIELDS);
    expect(m.full_name).toBe("Nombre completo");
    expect(m.phone).toBe("Teléfono móvil");
    expect(m.email).toBe("E-mail");
    expect(m.zone).toBe("Zona");
    expect(m.notes).toBe("Observaciones");
  });
  it("mapea columnas de propiedades", () => {
    const m = guessMapping(["Ref", "Operación", "Precio", "Baños", "m2"], PROPERTY_FIELDS);
    expect(m).toMatchObject({ reference: "Ref", operation: "Operación", price: "Precio", bathrooms: "Baños", area_m2: "m2" });
  });
  it("mapRow solo copia columnas asignadas", () => {
    expect(mapRow({ A: "x", B: "y" }, { full_name: "A", phone: "" })).toEqual({ full_name: "x" });
  });
});

describe("validación de filas de contactos", () => {
  it("acepta una fila válida y aplica valores por defecto", () => {
    const r = validateLeadRow({ full_name: "Lucía Fernández", phone: "600 123 456", budget: "250.000", bedrooms: "3", stage: "Visita pendiente" }, stages);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data).toMatchObject({ full_name: "Lucía Fernández", budget: 250000, bedrooms: 3, stage_key: "visita_pendiente", lead_type: "comprador", source: "Importación CSV" });
    }
  });
  it("estado desconocido o vacío cae en 'nuevo'", () => {
    expect(parseStageKey("Estado raro", stages)).toBe("nuevo");
    expect(parseStageKey("", stages)).toBe("nuevo");
  });
  it("rechaza filas sin nombre, con email o presupuesto inválidos", () => {
    expect(validateLeadRow({ full_name: "  " }, stages).ok).toBe(false);
    expect(validateLeadRow({ full_name: "Ana", email: "no-es-email" }, stages).ok).toBe(false);
    expect(validateLeadRow({ full_name: "Ana", budget: "abc" }, stages).ok).toBe(false);
  });
  it("no se deja inyectar campos que no existen", () => {
    const r = validateLeadRow({ full_name: "Ana", agency_id: "otra", id: "x" } as Record<string, string>, stages);
    expect(r.ok && Object.keys(r.data)).not.toContain("agency_id");
  });
});

describe("validación de filas de propiedades", () => {
  it("normaliza operación, estado y características", () => {
    const r = validatePropertyRow({ reference: "TRI-001", operation: "Alquiler", price: "950", features: "Terraza; Ascensor,Garaje", status: "Reservada" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toMatchObject({ operation: "alquiler", status: "reservada", price: 950, features: ["Terraza", "Ascensor", "Garaje"] });
  });
  it("rechaza operación no reconocida y falta de referencia", () => {
    expect(parseOperation("permuta")).toBeUndefined();
    expect(validatePropertyRow({ reference: "A", operation: "permuta" }).ok).toBe(false);
    expect(validatePropertyRow({ reference: "" }).ok).toBe(false);
  });
});
