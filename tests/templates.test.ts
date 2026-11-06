import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import Papa from "papaparse";
import { FIELDS, guessMapping, mapRow } from "@/lib/import/fields";
import { validateLeadRow, validatePropertyRow } from "@/lib/import/validate";

const stages = [{ key: "nuevo", label: "Nuevo" }, { key: "contactado", label: "Contactado" }];

describe("plantillas CSV descargables", () => {
  it("la plantilla de contactos se mapea sola y todas sus filas son válidas", () => {
    const p = Papa.parse<Record<string, string>>(readFileSync("public/plantilla-contactos.csv", "utf8"), { header: true, skipEmptyLines: "greedy" });
    const m = guessMapping(p.meta.fields ?? [], FIELDS.leads);
    expect(m.full_name && m.phone && m.email && m.budget && m.zone).toBeTruthy();
    expect(p.data.length).toBeGreaterThan(0);
    for (const r of p.data) expect(validateLeadRow(mapRow(r, m), stages).ok).toBe(true);
  });
  it("la plantilla de propiedades se mapea sola y todas sus filas son válidas", () => {
    const p = Papa.parse<Record<string, string>>(readFileSync("public/plantilla-propiedades.csv", "utf8"), { header: true, skipEmptyLines: "greedy" });
    const m = guessMapping(p.meta.fields ?? [], FIELDS.properties);
    expect(m.reference && m.operation && m.price && m.bathrooms && m.area_m2).toBeTruthy();
    for (const r of p.data) expect(validatePropertyRow(mapRow(r, m)).ok).toBe(true);
  });
  it("detecta delimitador ; típico de Excel en español y decodifica Windows-1252", () => {
    const bytes = Buffer.from("nombre;teléfono;presupuesto\nJosé Peña;600123456;180.000\n", "latin1");
    expect(() => new TextDecoder("utf-8", { fatal: true }).decode(bytes)).toThrow();
    const text = new TextDecoder("windows-1252").decode(bytes);
    const p = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: "greedy" });
    expect(p.data[0].nombre).toBe("José Peña");
    const m = guessMapping(p.meta.fields ?? [], FIELDS.leads);
    const v = validateLeadRow(mapRow(p.data[0], m), stages);
    expect(v.ok && v.data.budget).toBe(180000);
  });
});
