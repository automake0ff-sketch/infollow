import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { ACTIVITY_LABELS, MANUAL_ACTIVITY_TYPES } from "@/lib/constants";
import { fmtDate, fmtDateTime, fmtMoney } from "@/lib/form";
import { uuid } from "@/lib/schemas";
import LeadForm from "../LeadForm";
import TaskRow from "../../tareas/TaskRow";
import { createTask } from "../../tareas/actions";
import { addActivity, changeStage, linkProperty, unlinkProperty, updateLead } from "../actions";

const input = "w-full rounded-lg border bg-white p-2.5 text-sm";

export default async function LeadPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  if (!uuid.safeParse(id).success) notFound();
  const { supabase } = await requireUser();

  const { data: lead } = await supabase.from("leads").select("*").eq("id", id).maybeSingle();
  if (!lead) notFound();

  const [{ data: stages }, { data: activities }, { data: links }, { data: props }, { data: tasks }] = await Promise.all([
    supabase.from("pipeline_stages").select("key,label").order("position"),
    supabase.from("activities").select("id, type, content, metadata, property_id, occurred_at").eq("lead_id", id).order("occurred_at", { ascending: false }).limit(100),
    supabase.from("lead_properties").select("property_id").eq("lead_id", id),
    supabase.from("properties").select("id, reference, address, zone, price, status").order("reference").limit(500),
    supabase.from("tasks").select("id, lead_id, title, due_at").eq("lead_id", id).eq("status", "pendiente").order("due_at"),
  ]);

  const { data: prio } = await supabase.from("v_lead_priority").select("score, level, reasons").eq("lead_id", id).maybeSingle();
  const prioReasons = (prio?.reasons ?? []) as { rule: string; reason: string }[];
  const stageLabel = Object.fromEntries((stages ?? []).map((s) => [s.key, s.label]));
  const propMap = new Map((props ?? []).map((p) => [p.id, p]));
  const linkedIds = new Set((links ?? []).map((l) => l.property_id));
  const linked = (props ?? []).filter((p) => linkedIds.has(p.id));
  const available = (props ?? []).filter((p) => !linkedIds.has(p.id));

  return (
    <main className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <div>
          <Link href="/leads" className="text-sm text-neutral-500 underline">← Leads</Link>
          <h1 className="mt-1 text-2xl font-semibold">{lead.full_name}</h1>
          <p className="text-sm text-neutral-500">
            Creado {fmtDate(lead.created_at)} · Última interacción {fmtDate(lead.last_interaction_at)}
            {lead.budget ? ` · Presupuesto ${fmtMoney(lead.budget)}` : ""}
          </p>
        </div>

        {sp.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{sp.error}</p>}
        {sp.saved && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">Cambios guardados.</p>}

        <section className="rounded-xl border bg-white p-4">
          <h2 className="mb-3 font-semibold">Estado comercial</h2>
          <form action={changeStage} className="flex gap-2">
            <input type="hidden" name="lead_id" value={id} />
            <select name="stage" defaultValue={lead.stage_key} className={input}>
              {(stages ?? []).map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
            <button className="rounded-lg border px-3 text-sm">Cambiar</button>
          </form>
          <p className="mt-2 text-xs text-neutral-500">El estado solo cambia cuando tú lo decides.</p>
        </section>

        <section className="rounded-xl border bg-white p-4">
          <h2 className="mb-3 font-semibold">Seguimientos</h2>
          {(tasks ?? []).length === 0 ? (
            <p className="mb-3 text-sm text-neutral-600">Sin seguimientos pendientes: este lead no tiene próximo paso.</p>
          ) : (
            <ul className="mb-3 divide-y rounded-lg border">
              {(tasks ?? []).map((t) => <TaskRow key={t.id} task={t} back={`/leads/${id}`} showLead={false} />)}
            </ul>
          )}
          <form action={createTask} className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
            <input type="hidden" name="lead_id" value={id} />
            <input type="hidden" name="back" value={`/leads/${id}`} />
            <input name="title" required maxLength={200} placeholder="Ej. Llamar para proponer visita" className={input} />
            <input name="due" type="date" required className={input} />
            <button className="rounded-lg bg-black px-4 py-2 text-sm text-white">Programar</button>
          </form>
        </section>

        <section id="actividad" className="rounded-xl border bg-white p-4">
          <h2 className="mb-3 font-semibold">Registrar actividad</h2>
          <form action={addActivity} className="grid gap-2">
            <input type="hidden" name="lead_id" value={id} />
            <div className="grid gap-2 sm:grid-cols-2">
              <select name="type" className={input} defaultValue="llamada">
                {MANUAL_ACTIVITY_TYPES.map((t) => <option key={t} value={t}>{ACTIVITY_LABELS[t]}</option>)}
              </select>
              <select name="property_id" className={input} defaultValue="">
                <option value="">Sin propiedad asociada</option>
                {linked.map((p) => <option key={p.id} value={p.id}>{p.reference}</option>)}
              </select>
            </div>
            <textarea name="content" required rows={2} maxLength={4000} placeholder="¿Qué ha pasado? Resumen de la llamada, mensaje o nota." className={input} />
            <div><button className="rounded-lg bg-black px-4 py-2 text-sm text-white">Guardar en el historial</button></div>
          </form>
        </section>

        <section className="rounded-xl border bg-white p-4">
          <h2 className="mb-3 font-semibold">Historial</h2>
          {(activities ?? []).length === 0 ? (
            <p className="text-sm text-neutral-600">Aún no hay actividad. Registra la primera llamada o nota arriba.</p>
          ) : (
            <ol className="space-y-3">
              {(activities ?? []).map((a) => {
                const meta = (a.metadata ?? {}) as { from?: string; to?: string };
                const prop = a.property_id ? propMap.get(a.property_id) : null;
                return (
                  <li key={a.id} className="border-l-2 pl-3">
                    <p className="text-xs text-neutral-500">
                      {fmtDateTime(a.occurred_at)} · {ACTIVITY_LABELS[a.type as keyof typeof ACTIVITY_LABELS]}
                      {prop ? ` · ${prop.reference}` : ""}
                    </p>
                    {a.type === "cambio_estado" ? (
                      <p className="text-sm">
                        Estado: {stageLabel[meta.from ?? ""] ?? meta.from} → <strong>{stageLabel[meta.to ?? ""] ?? meta.to}</strong>
                      </p>
                    ) : (
                      <p className="whitespace-pre-wrap text-sm">{a.content}</p>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        <section className="rounded-xl border bg-white p-4">
          <h2 className="mb-3 font-semibold">Datos del lead</h2>
          <LeadForm action={updateLead.bind(null, id)} lead={lead} label="Guardar cambios" />
        </section>
      </div>

      <aside className="space-y-6">
        {prioReasons.length > 0 && (
          <section className="rounded-xl border bg-white p-4">
            <h2 className="mb-2 font-semibold">Por qué necesita atención</h2>
            <p className="mb-2 text-xs text-neutral-500">Prioridad {prio?.level} ({prio?.score} puntos). Es una prioridad de atención, no una probabilidad de cierre.</p>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {prioReasons.map((r) => <li key={r.rule}>{r.reason}</li>)}
            </ul>
          </section>
        )}
        <section className="rounded-xl border bg-white p-4">
          <h2 className="mb-3 font-semibold">Propiedades relacionadas</h2>
          {linked.length === 0 ? (
            <p className="text-sm text-neutral-600">Ninguna todavía.</p>
          ) : (
            <ul className="space-y-2">
              {linked.map((p) => (
                <li key={p.id} className="flex items-start justify-between gap-2 text-sm">
                  <Link href={`/propiedades/${p.id}`} className="min-w-0 underline">
                    <span className="font-medium">{p.reference}</span>
                    <span className="block truncate text-xs text-neutral-500">{p.address || p.zone || "—"} · {fmtMoney(p.price)}</span>
                  </Link>
                  <form action={unlinkProperty}>
                    <input type="hidden" name="lead_id" value={id} />
                    <input type="hidden" name="property_id" value={p.id} />
                    <button className="text-xs text-neutral-500 underline">Quitar</button>
                  </form>
                </li>
              ))}
            </ul>
          )}
          <form action={linkProperty} className="mt-3 flex gap-2">
            <input type="hidden" name="lead_id" value={id} />
            <select name="property_id" className={input} defaultValue="" disabled={available.length === 0}>
              <option value="">{available.length === 0 ? "No hay más propiedades" : "Asociar propiedad…"}</option>
              {available.map((p) => <option key={p.id} value={p.id}>{p.reference}</option>)}
            </select>
            <button disabled={available.length === 0} className="rounded-lg border px-3 text-sm disabled:opacity-50">Añadir</button>
          </form>
          {(props ?? []).length === 0 && (
            <p className="mt-2 text-xs text-neutral-500">Primero <Link href="/propiedades/new" className="underline">crea una propiedad</Link>.</p>
          )}
        </section>
      </aside>
    </main>
  );
}
