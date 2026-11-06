import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { fmtDate, fmtMoney } from "@/lib/form";
import { changeStage } from "../leads/actions";

export default async function PipelinePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const { supabase } = await requireUser();
  const [{ data: stages }, { data: leads }] = await Promise.all([
    supabase.from("pipeline_stages").select("key,label,is_open").order("position"),
    supabase.from("leads").select("id, full_name, stage_key, zone, budget, last_interaction_at").order("created_at", { ascending: false }).limit(500),
  ]);
  const all = leads ?? [];

  return (
    <main>
      <h1 className="mb-4 text-2xl font-semibold">Pipeline</h1>
      {error && <p role="alert" className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {all.length === 0 ? (
        <section className="rounded-xl border border-dashed bg-white p-8 text-center">
          <p className="font-medium">Tu pipeline está vacío.</p>
          <p className="mt-1 text-sm text-neutral-600">Cuando crees leads, aparecerán aquí organizados por estado.</p>
          <Link href="/leads/new" className="mt-4 inline-block rounded-lg bg-black px-4 py-2 text-sm text-white">Crear el primer lead</Link>
        </section>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {(stages ?? []).map((s) => {
            const col = all.filter((l) => l.stage_key === s.key);
            return (
              <section key={s.key} className="w-64 shrink-0 rounded-xl border bg-neutral-100 p-2">
                <h2 className="mb-2 flex justify-between px-1 text-sm font-semibold">
                  {s.label} <span className="text-neutral-500">{col.length}</span>
                </h2>
                <ul className="space-y-2">
                  {col.map((l) => (
                    <li key={l.id} className="rounded-lg border bg-white p-2.5 text-sm">
                      <Link href={`/leads/${l.id}`} className="block font-medium underline-offset-2 hover:underline">{l.full_name}</Link>
                      <p className="text-xs text-neutral-500">{l.zone || "Sin zona"} · {fmtMoney(l.budget)}</p>
                      <p className="text-xs text-neutral-500">Últ. interacción: {fmtDate(l.last_interaction_at)}</p>
                      <form action={changeStage} className="mt-2 flex gap-1">
                        <input type="hidden" name="lead_id" value={l.id} />
                        <input type="hidden" name="back" value="pipeline" />
                        <select name="stage" defaultValue={l.stage_key} className="min-w-0 flex-1 rounded border p-1 text-xs">
                          {(stages ?? []).map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
                        </select>
                        <button className="rounded border px-2 text-xs">Mover</button>
                      </form>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}
