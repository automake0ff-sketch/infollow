import Link from "next/link";
import { requireUser } from "@/lib/auth";
import PriorityList, { type PriorityItem } from "../tareas/PriorityList";

export default async function AtencionPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const { supabase } = await requireUser();
  const { data } = await supabase.from("v_lead_priority").select("lead_id, score, level, reasons").order("score", { ascending: false }).limit(100);
  const items = (data ?? []) as PriorityItem[];
  const ids = items.map((i) => i.lead_id);
  const [{ data: leads }, { data: stages }] = await Promise.all([
    ids.length ? supabase.from("leads").select("id, full_name, stage_key").in("id", ids) : Promise.resolve({ data: [] as { id: string; full_name: string; stage_key: string }[] }),
    supabase.from("pipeline_stages").select("key,label"),
  ]);
  const label = Object.fromEntries((stages ?? []).map((s) => [s.key, s.label]));
  const names = Object.fromEntries((leads ?? []).map((l) => [l.id, { full_name: l.full_name, stage: label[l.stage_key] ?? l.stage_key }]));

  return (
    <main>
      <h1 className="text-2xl font-semibold">Oportunidades que necesitan atención</h1>
      <p className="mb-4 text-sm text-neutral-500">
        Reglas claras sobre tus datos. Nunca cambian el estado de un lead ni lo dan por perdido. Puedes ajustar los plazos y pesos en <Link href="/ajustes" className="underline">Ajustes</Link>.
      </p>
      {error && <p role="alert" className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {items.length === 0 ? (
        <section className="rounded-xl border border-dashed bg-white p-8 text-center">
          <p className="font-medium">No hay oportunidades que necesiten atención.</p>
          <p className="mt-1 text-sm text-neutral-600">Cuando un lead se enfríe, se quede sin próximo paso o tenga un seguimiento vencido, aparecerá aquí con su motivo.</p>
        </section>
      ) : (
        <PriorityList items={items} names={names} back="/atencion" />
      )}
    </main>
  );
}
