"use client";
import { useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FIELDS, guessMapping, mapRow, type ImportKind } from "@/lib/import/fields";
import { validateLeadRow, validatePropertyRow } from "@/lib/import/validate";
import { finishImport, importBatch, startImport } from "./actions";

const MAX_BYTES = 2 * 1024 * 1024;
const MAX_ROWS = 3000;
const BATCH = 150;

type Stage = { key: string; label: string };
type Err = { row: number; message: string };

function decode(buf: ArrayBuffer): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buf).replace(/^\uFEFF/, "");
  } catch {
    return new TextDecoder("windows-1252").decode(buf); // CSV de Excel en español
  }
}

export default function ImportClient({ kind, stages }: { kind: ImportKind; stages: Stage[] }) {
  const router = useRouter();
  const fields = FIELDS[kind];
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [records, setRecords] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState<{ inserted: number; skipped: number; failed: number; errors: Err[] } | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setError(null); setDone(null); setRecords([]); setHeaders([]);
    if (!file) return;
    if (file.size > MAX_BYTES) return setError("El archivo supera los 2 MB. Divídelo en varios.");
    if (!/\.(csv|txt)$/i.test(file.name)) return setError("Sube un archivo .csv (en Excel: Guardar como → CSV).");
    const text = decode(await file.arrayBuffer());
    const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: "greedy", transformHeader: (h) => h.trim() });
    const hs = (parsed.meta.fields ?? []).filter(Boolean);
    if (!hs.length || !parsed.data.length) return setError("No se encontraron filas. Comprueba que la primera fila contiene los nombres de las columnas.");
    if (parsed.data.length > MAX_ROWS) return setError(`Máximo ${MAX_ROWS} filas por archivo (este tiene ${parsed.data.length}).`);
    setFileName(file.name);
    setHeaders(hs);
    setRecords(parsed.data);
    setMapping(guessMapping(hs, fields));
  }

  const required = fields.filter((f) => f.required);
  const missing = required.filter((f) => !mapping[f.key]);

  const check = useMemo(() => {
    if (!records.length || missing.length) return { valid: 0, invalid: 0, errors: [] as Err[], sample: [] as Record<string, string>[] };
    let valid = 0, invalid = 0;
    const errors: Err[] = [];
    const sample: Record<string, string>[] = [];
    records.forEach((rec, i) => {
      const raw = mapRow(rec, mapping);
      const v = kind === "leads" ? validateLeadRow(raw, stages) : validatePropertyRow(raw);
      if (v.ok) { valid++; if (sample.length < 5) sample.push(raw); }
      else { invalid++; if (errors.length < 8) errors.push({ row: i + 2, message: v.error }); }
    });
    return { valid, invalid, errors, sample };
  }, [records, mapping, kind, stages, missing.length]);

  async function run() {
    setBusy(true); setError(null); setProgress(0);
    const start = await startImport(kind, fileName);
    if (!start.id) { setBusy(false); return setError(start.error ?? "No se pudo iniciar la importación"); }
    const total = { inserted: 0, skipped: 0, failed: 0, errors: [] as Err[] };
    for (let i = 0; i < records.length; i += BATCH) {
      const chunk = records.slice(i, i + BATCH).map((r) => mapRow(r, mapping));
      const res = await importBatch(kind, start.id, chunk, i);
      if (res.fatal) { setError(res.fatal); break; }
      total.inserted += res.inserted; total.skipped += res.skipped; total.failed += res.failed;
      total.errors.push(...res.errors);
      setProgress(Math.min(100, Math.round(((i + BATCH) / records.length) * 100)));
    }
    await finishImport(start.id, { imported: total.inserted, skipped: total.skipped, failed: total.failed });
    setDone({ ...total, errors: total.errors.slice(0, 50) });
    setBusy(false);
    router.refresh();
  }

  const noun = kind === "leads" ? "contactos" : "propiedades";

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-white p-4">
        <label className="grid gap-2 text-sm">
          <span className="font-medium">1. Elige tu archivo CSV</span>
          <input ref={fileRef} type="file" accept=".csv,.txt,text/csv" onChange={onFile} disabled={busy} className="text-sm" />
        </label>
        <p className="mt-2 text-xs text-neutral-500">
          Máximo 2 MB y {MAX_ROWS} filas. Los duplicados (mismo teléfono o email, o misma referencia) se omiten y puedes deshacer la importación después.
        </p>
      </div>

      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {headers.length > 0 && !done && (
        <>
          <div className="rounded-xl border bg-white p-4">
            <h3 className="mb-1 font-medium">2. Comprueba las columnas</h3>
            <p className="mb-3 text-xs text-neutral-500">{fileName} · {records.length} filas. Hemos propuesto la correspondencia; corrígela si hace falta.</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {fields.map((f) => (
                <label key={f.key} className="grid gap-1 text-sm">
                  {f.label}{f.required && " *"}
                  <select value={mapping[f.key] ?? ""} disabled={busy} onChange={(e) => setMapping({ ...mapping, [f.key]: e.target.value })} className="rounded-lg border bg-white p-2 text-sm">
                    <option value="">— no importar —</option>
                    {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </label>
              ))}
            </div>
            {missing.length > 0 && <p className="mt-3 text-sm text-red-700">Falta indicar la columna de: {missing.map((m) => m.label).join(", ")}.</p>}
          </div>

          {missing.length === 0 && (
            <div className="rounded-xl border bg-white p-4">
              <h3 className="mb-2 font-medium">3. Revisa y confirma</h3>
              <p className="text-sm">
                <strong>{check.valid}</strong> {noun} listos para importar
                {check.invalid > 0 && <> · <span className="text-red-700"><strong>{check.invalid}</strong> con errores (se omitirán)</span></>}.
              </p>
              {check.errors.length > 0 && (
                <ul className="mt-2 list-disc pl-5 text-xs text-red-700">
                  {check.errors.map((e) => <li key={e.row}>Fila {e.row}: {e.message}</li>)}
                </ul>
              )}
              {check.sample.length > 0 && (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead><tr>{fields.filter((f) => mapping[f.key]).map((f) => <th key={f.key} className="whitespace-nowrap p-1.5 font-medium">{f.label}</th>)}</tr></thead>
                    <tbody>
                      {check.sample.map((r, i) => (
                        <tr key={i} className="border-t">{fields.filter((f) => mapping[f.key]).map((f) => <td key={f.key} className="max-w-48 truncate p-1.5">{r[f.key]}</td>)}</tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="mt-4 flex items-center gap-3">
                <button onClick={run} disabled={busy || check.valid === 0} className="rounded-lg bg-black px-4 py-2 text-sm text-white disabled:opacity-50">
                  {busy ? `Importando… ${progress}%` : `Importar ${check.valid} ${noun}`}
                </button>
                {busy && <span className="text-xs text-neutral-500">No cierres esta página.</span>}
              </div>
            </div>
          )}
        </>
      )}

      {done && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm">
          <p className="font-medium text-green-800">Importación terminada</p>
          <p className="mt-1">{done.inserted} importados · {done.skipped} duplicados omitidos · {done.failed} con error.</p>
          {done.errors.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-xs text-red-700">
              {done.errors.slice(0, 10).map((e, i) => <li key={i}>Fila {e.row}: {e.message}</li>)}
            </ul>
          )}
          <div className="mt-3 flex gap-2">
            <Link href={kind === "leads" ? "/leads" : "/propiedades"} className="rounded-lg bg-black px-3 py-1.5 text-xs text-white">Ver {noun}</Link>
            {kind === "leads" && <Link href="/hoy" className="rounded-lg border bg-white px-3 py-1.5 text-xs">Ir a Tu día comercial</Link>}
            <button onClick={() => { setDone(null); setHeaders([]); setRecords([]); if (fileRef.current) fileRef.current.value = ""; }} className="rounded-lg border bg-white px-3 py-1.5 text-xs">Importar otro archivo</button>
          </div>
        </div>
      )}
    </div>
  );
}
