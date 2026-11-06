import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { fmtDate } from "@/lib/form";
import TaskRow, { type TaskItem } from "../tareas/TaskRow";
import QuickTask from "../tareas/QuickTask";
import PriorityList, { type PriorityItem } from "../tareas/PriorityList";

const box = "divide-y rounded-xl border bg-white";

function Section({ title, hint, count, children }: { title: string; hint?: string; count: number; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-1 flex items-baseline gap-2 font-semibold">{title} <span className="text-sm font-normal text-neutral-500">{count}</span></h2>
      {hint && <p className="mb-2 text-xs text-neutral-500">{hint}</p>}
      {children}
    </section>
  );
}

export default async function HoyPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const { supabase } = await requireUser();

  const { data: b } = await supabase.rpc("agency_day_bounds");
  const bounds = (Array.isArray(b) ? b[0] : b) as { day_start: string; day_end: string } | null;
  if (!bounds) {
    return <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">No se pudo cargar tu día. Recarga la página.</p>;
  }

  const pending = () => supabase.from("tasks").select("id, lead_id, title, due_at").eq("status", "pendiente");
  const [overdue, today, upcoming, noNext, inactive, settings, prio] = await Promise.all([
    pending().lt("due_at", bounds.day_start).order("due_at").limit(50),
    pending().gte("due_at", bounds.day_start).lt("due_at", bounds.day_end).order("due_at").limit(50),
    pending().gte("due_at", bounds.day_end).order("due_at").limit(10),
    supabase.from("v_leads_without_next_step").select("id, full_name, stage_key, created_at").order("created_at", { ascending: false }).limit(20),
    supabase.from("v_inactive_leads").select("id, full_name, stage_key, days_inactive, last_interaction_at").order("days_inactive", { ascending: false }).limit(20),
    supabase.from("agency_settings").select("inactivity_days").maybeSingle(),
    supabase.from("v_lead_priority").select("lead_id, score, level, reasons").order("score", { ascending: false }).limit(8),
  ]);

  const tasks: TaskItem[] = [...(overdue.data ?? []), ...(today.data ?? []), ...(upcoming.data ?? [])];
  const prioItems = (prio.data ?? []) as PriorityItem[];
  const leadIds = [...new Set([...tasks.map((t) => t.lead_id), ...prioItems.map((p) => p.lead_id)])];
  const { data: leadRows } = leadIds.length ? await supabase.from("leads").select("id, full_name, stage_key").in("id", leadIds) : { data: [] as { id: string; full_name: string; stage_key: string }[] };
  const names = Object.fromEntries((leadRows ?? []).map((l) => [l.id, l.full_name]));
  const { data: stages } = await supabase.from("pipeline_stages").select("key,label");
  const stageLabel = Object.fromEntries((stages ?? []).map((s) => [s.key, s.label]));
  const prioNames = Object.fromEntries((leadRows ?? []).map((l) => [l.id, { full_name: l.full_name, stage: stageLabel[l.stage_key] ?? l.stage_key }]));

  const o = overdue.data ?? [], t = today.data ?? [], u = upcoming.data ?? [], n = noNext.data ?? [], i = inactive.data ?? [];
  const nothingAtAll = o.length + t.length + u.length + n.length + i.length + prioItems.length === 0;
  const days = settings.data?.inactivity_days ?? 7;

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Tu día comercial</h1>
        <p className="text-sm text-neutral-500">{fmtDate(bounds.day_start)} · lo que necesita tu atención ahora</p>
      </div>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {nothingAtAll && (
        <section className="rounded-xl border border-dashed bg-white p-8 text-center">
          <p className="font-medium">Todavía no hay nada que atender.</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-neutral-600">
            Crea tus primeros leads y programa un seguimiento para cada uno: aquí aparecerá lo vencido, lo de hoy y los contactos que se enfrían.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Link href="/leads/new" className="rounded-lg bg-black px-4 py-2 text-sm text-white">Nuevo lead</Link>
            <Link href="/propiedades/new" className="rounded-lg border px-4 py-2 text-sm">Nueva propiedad</Link>
          </div>
        </section>
      )}

      {prioItems.length > 0 && (
        <Section title="A quién atender primero" hint="Ordenado por prioridad de atención según reglas claras; no es una probabilidad de cierre. Cada alerta explica su motivo." count={prioItems.length}>
          <PriorityList items={prioItems} names={prioNames} back="/hoy" />
          <Link href="/atencion" className="mt-2 inline-block text-sm underline">Ver todas las oportunidades que necesitan atención</Link>
        </Section>
      )}

      {o.length > 0 && (
        <Section title="Seguimientos vencidos" hint="Tenían fecha anterior a hoy y siguen pendientes." count={o.length}>
          <ul className={box}>{o.map((x) => <TaskRow key={x.id} task={x} leadName={names[x.lead_id]} back="/hoy" />)}</ul>
        </Section>
      )}

      {t.length > 0 && (
        <Section title="Seguimientos de hoy" count={t.length}>
          <ul className={box}>{t.map((x) => <TaskRow key={x.id} task={x} leadName={names[x.lead_id]} back="/hoy" />)}</ul>
        </Section>
      )}

      {n.length > 0 && (
        <Section title="Oportunidades sin próximo paso" hint="Leads abiertos sin ningún seguimiento programado." count={n.length}>
          <ul className={box}>
            {n.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 p-3">
                <div className="min-w-0">
                  <Link href={`/leads/${l.id}`} className="truncate text-sm font-medium underline">{l.full_name}</Link>
                  <p className="text-xs text-neutral-500">{stageLabel[l.stage_key] ?? l.stage_key} · creado {fmtDate(l.created_at)}</p>
                </div>
                <QuickTask leadId={l.id} back="/hoy" />
              </li>
            ))}
          </ul>
        </Section>
      )}

      {i.length > 0 && (
        <Section title="Contactos inactivos" hint={`Leads abiertos sin interacción registrada en más de ${days} días (configurable).`} count={i.length}>
          <ul className={box}>
            {i.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 p-3">
                <div className="min-w-0">
                  <Link href={`/leads/${l.id}#actividad`} className="truncate text-sm font-medium underline">{l.full_name}</Link>
                  <p className="text-xs text-neutral-500">
                    {stageLabel[l.stage_key] ?? l.stage_key} · {l.days_inactive} días sin interacción
                    {l.last_interaction_at ? ` (última ${fmtDate(l.last_interaction_at)})` : " (aún sin ninguna)"}
                  </p>
                </div>
                <Link href={`/leads/${l.id}#actividad`} className="rounded-lg border px-2.5 py-1 text-xs">Registrar llamada o mensaje</Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {u.length > 0 && (
        <Section title="Próximas acciones" count={u.length}>
          <ul className={box}>{u.map((x) => <TaskRow key={x.id} task={x} leadName={names[x.lead_id]} back="/hoy" />)}</ul>
        </Section>
      )}

      <p className="text-xs text-neutral-500">Las visitas pendientes de seguimiento llegan con la Etapa 6.</p>
    </main>
  );
}
