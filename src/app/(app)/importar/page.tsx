import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { fmtDateTime } from "@/lib/form";
import ImportClient from "./ImportClient";
import UndoForm from "./UndoForm";

export default async function ImportarPage({ searchParams }: { searchParams: Promise<{ tipo?: string; undone?: string }> }) {
  const sp = await searchParams;
  const kind = sp.tipo === "properties" ? "properties" : "leads";
  const { supabase } = await requireUser();
  const [{ data: stages }, { data: imports }] = await Promise.all([
    supabase.from("pipeline_stages").select("key,label").order("position"),
    supabase.from("imports").select("id, kind, filename, imported, skipped, failed, created_at").order("created_at", { ascending: false }).limit(10),
  ]);

  const tab = (active: boolean) => `rounded-lg px-3 py-1.5 text-sm ${active ? "bg-black text-white" : "border bg-white"}`;

  return (
    <main className="max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Importar desde CSV</h1>
        <p className="text-sm text-neutral-500">Trae tu cartera de otro programa o de una hoja de cálculo en pocos minutos.</p>
      </div>
      <div className="flex gap-2">
        <Link href="/importar" className={tab(kind === "leads")}>Contactos</Link>
        <Link href="/importar?tipo=properties" className={tab(kind === "properties")}>Propiedades</Link>
      </div>
      {sp.undone && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">Importación deshecha: {sp.undone} registros eliminados.</p>}
      <p className="text-sm">
        ¿Primera vez? Descarga la plantilla: {" "}
        <a href={kind === "leads" ? "/plantilla-contactos.csv" : "/plantilla-propiedades.csv"} download className="underline">
          plantilla de {kind === "leads" ? "contactos" : "propiedades"}
        </a>.
        Solo debes importar datos que tengas derecho a tratar (ver <Link href="/privacidad" className="underline">política de privacidad</Link>).
      </p>
      <ImportClient key={kind} kind={kind} stages={stages ?? []} />

      <section className="rounded-xl border bg-white p-4">
        <h2 className="mb-2 font-semibold">Importaciones recientes</h2>
        {(imports ?? []).length === 0 ? (
          <p className="text-sm text-neutral-600">Todavía no has importado nada.</p>
        ) : (
          <ul className="divide-y">
            {(imports ?? []).map((i) => (
              <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <div>
                  <p className="font-medium">{i.filename || "archivo"} · {i.kind === "leads" ? "contactos" : "propiedades"}</p>
                  <p className="text-xs text-neutral-500">{fmtDateTime(i.created_at)} · {i.imported} importados, {i.skipped} duplicados, {i.failed} errores</p>
                </div>
                {i.imported > 0 && <UndoForm id={i.id} kind={i.kind} imported={i.imported} />}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
