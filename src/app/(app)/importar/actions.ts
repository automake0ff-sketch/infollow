"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { uuid } from "@/lib/schemas";
import { emailNorm, phoneNorm } from "@/lib/import/normalize";
import { validateLeadRow, validatePropertyRow } from "@/lib/import/validate";

const kindSchema = z.enum(["leads", "properties"]);
const rowsSchema = z.array(z.record(z.string(), z.string().max(5000))).max(200);

export type BatchResult = { inserted: number; skipped: number; failed: number; errors: { row: number; message: string }[] };
type Row = Record<string, unknown>;
const empty = (): BatchResult => ({ inserted: 0, skipped: 0, failed: 0, errors: [] });

export async function startImport(kind: string, filename: string): Promise<{ id?: string; error?: string }> {
  const { supabase } = await requireUser();
  const k = kindSchema.safeParse(kind);
  if (!k.success) return { error: "Tipo de importación no válido" };
  const { data, error } = await supabase.from("imports").insert({ kind: k.data, filename: filename.slice(0, 200) }).select("id").single();
  if (error || !data) return { error: "No se pudo iniciar la importación" };
  return { id: data.id };
}

export async function importBatch(kind: string, importId: string, rawRows: unknown, rowOffset: number): Promise<BatchResult & { fatal?: string }> {
  const { supabase } = await requireUser();
  const k = kindSchema.safeParse(kind);
  const rows = rowsSchema.safeParse(rawRows);
  if (!k.success || !rows.success || !uuid.safeParse(importId).success || !Number.isInteger(rowOffset) || rowOffset < 0)
    return { ...empty(), fatal: "Datos de importación no válidos" };

  const res = empty();
  const { data: imp } = await supabase.from("imports").select("id").eq("id", importId).maybeSingle();
  if (!imp) return { ...res, fatal: "Importación no encontrada" };

  if (k.data === "leads") {
    const { data: stages } = await supabase.from("pipeline_stages").select("key,label");
    const valid: { row: number; data: Row; ph: string | null; em: string | null }[] = [];
    rows.data.forEach((raw, i) => {
      const row = rowOffset + i + 2;
      const v = validateLeadRow(raw, stages ?? []);
      if (!v.ok) { res.failed++; res.errors.push({ row, message: v.error }); return; }
      valid.push({ row, data: v.data, ph: phoneNorm(v.data.phone), em: emailNorm(v.data.email) });
    });

    // duplicados: contra la base de datos y dentro del propio lote
    const phones = [...new Set(valid.map((v) => v.ph).filter((x): x is string => !!x))];
    const emails = [...new Set(valid.map((v) => v.em).filter((x): x is string => !!x))];
    const [{ data: byPhone }, { data: byEmail }] = await Promise.all([
      phones.length ? supabase.from("leads").select("phone_norm").in("phone_norm", phones) : Promise.resolve({ data: [] as { phone_norm: string }[] }),
      emails.length ? supabase.from("leads").select("email_norm").in("email_norm", emails) : Promise.resolve({ data: [] as { email_norm: string }[] }),
    ]);
    const seenPh = new Set((byPhone ?? []).map((r) => r.phone_norm));
    const seenEm = new Set((byEmail ?? []).map((r) => r.email_norm));
    const toInsert: { row: number; data: Row }[] = [];
    for (const v of valid) {
      if ((v.ph && seenPh.has(v.ph)) || (v.em && seenEm.has(v.em))) { res.skipped++; continue; }
      if (v.ph) seenPh.add(v.ph);
      if (v.em) seenEm.add(v.em);
      toInsert.push({ row: v.row, data: v.data });
    }
    await insertAll(supabase, "leads", importId, toInsert, res);
  } else {
    const valid: { row: number; data: Row }[] = [];
    rows.data.forEach((raw, i) => {
      const row = rowOffset + i + 2;
      const v = validatePropertyRow(raw);
      if (!v.ok) { res.failed++; res.errors.push({ row, message: v.error }); return; }
      valid.push({ row, data: v.data });
    });
    const refs = [...new Set(valid.map((v) => (v.data as { reference: string }).reference))];
    const { data: existing } = refs.length ? await supabase.from("properties").select("reference").in("reference", refs) : { data: [] as { reference: string }[] };
    const seen = new Set((existing ?? []).map((r) => r.reference));
    const toInsert: { row: number; data: Row }[] = [];
    for (const v of valid) {
      const ref = (v.data as { reference: string }).reference;
      if (seen.has(ref)) { res.skipped++; continue; }
      seen.add(ref);
      toInsert.push(v);
    }
    await insertAll(supabase, "properties", importId, toInsert, res);
  }
  return res;
}


async function insertAll(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  table: "leads" | "properties",
  importId: string,
  items: { row: number; data: Record<string, unknown> }[],
  res: BatchResult
) {
  if (!items.length) return;
  const payload = items.map((i) => ({ ...i.data, import_batch: importId }));
  const { error } = await supabase.from(table).insert(payload);
  if (!error) { res.inserted += items.length; return; }
  // si el lote falla, se aíslan las filas problemáticas una a una
  for (const it of items) {
    const { error: e } = await supabase.from(table).insert({ ...it.data, import_batch: importId });
    if (e) { res.failed++; res.errors.push({ row: it.row, message: e.code === "23505" ? "Duplicado" : "No se pudo guardar la fila" }); }
    else res.inserted++;
  }
}

export async function finishImport(importId: string, totals: { imported: number; skipped: number; failed: number }) {
  const { supabase } = await requireUser();
  if (!uuid.safeParse(importId).success) return;
  const n = (x: unknown) => (Number.isInteger(x) && (x as number) >= 0 ? (x as number) : 0);
  await supabase.from("imports").update({ imported: n(totals.imported), skipped: n(totals.skipped), failed: n(totals.failed) }).eq("id", importId);
  revalidatePath("/importar");
  revalidatePath("/leads");
  revalidatePath("/propiedades");
  revalidatePath("/hoy");
}

export async function undoImport(f: FormData) {
  const { supabase } = await requireUser();
  const id = String(f.get("import_id") ?? "");
  const kind = kindSchema.safeParse(String(f.get("kind") ?? ""));
  if (!uuid.safeParse(id).success || !kind.success) redirect("/importar");
  const { data } = await supabase.from(kind.data!).delete().eq("import_batch", id).select("id");
  await supabase.from("imports").delete().eq("id", id);
  revalidatePath("/importar");
  revalidatePath("/leads");
  revalidatePath("/propiedades");
  revalidatePath("/hoy");
  redirect(`/importar?undone=${data?.length ?? 0}`);
}
