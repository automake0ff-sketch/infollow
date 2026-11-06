import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { LEAD_TYPES } from "@/lib/constants";
import { fmtDate, fmtMoney, safeSearch } from "@/lib/form";

type SP = { q?: string; stage?: string; type?: string };

export default async function LeadsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { supabase } = await requireUser();
  const q = safeSearch(sp.q ?? "");

  const { data: stages } = await supabase.from("pipeline_stages").select("key,label").order("position");
  const labels = Object.fromEntries((stages ?? []).map((s) => [s.key, s.label]));

  let query = supabase
    .from("leads")
    .select("id, full_name, phone, email, lead_type, stage_key, budget, zone, last_interaction_at, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (q) query = query.or(`full_name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%,zone.ilike.%${q}%`);
  if (sp.stage) query = query.eq("stage_key", sp.stage);
  if (sp.type && sp.type in LEAD_TYPES) query = query.eq("lead_type", sp.type);
  const { data: leads, error } = await query;

  const hasFilters = Boolean(q || sp.stage || sp.type);

  return (
    <main>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Leads</h1>
        <Link href="/leads/new" className="rounded-lg bg-black px-4 py-2 text-sm text-white">Nuevo lead</Link>
      </div>

      <form className="mb-4 grid gap-2 sm:grid-cols-4">
        <input name="q" defaultValue={q} placeholder="Buscar nombre, teléfono, email, zona…" className="rounded-lg border bg-white p-2.5 text-sm sm:col-span-2" />
        <select name="stage" defaultValue={sp.stage ?? ""} className="rounded-lg border bg-white p-2.5 text-sm">
          <option value="">Todos los estados</option>
          {(stages ?? []).map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
        <div className="flex gap-2">
          <select name="type" defaultValue={sp.type ?? ""} className="min-w-0 flex-1 rounded-lg border bg-white p-2.5 text-sm">
            <option value="">Todos los tipos</option>
            {Object.entries(LEAD_TYPES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          <button className="rounded-lg border px-3 text-sm">Filtrar</button>
        </div>
      </form>

      {error && <p role="alert" className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">No se pudieron cargar los leads.</p>}

      {!error && (leads ?? []).length === 0 ? (
        <section className="rounded-xl border border-dashed bg-white p-8 text-center">
          <p className="font-medium">{hasFilters ? "Ningún lead coincide con la búsqueda." : "Todavía no tienes leads."}</p>
          {!hasFilters && <p className="mt-1 text-sm text-neutral-600">Crea el primero para empezar a hacer seguimiento de tus oportunidades.</p>}
        </section>
      ) : (
        <ul className="divide-y rounded-xl border bg-white">
          {(leads ?? []).map((l) => (
            <li key={l.id}>
              <Link href={`/leads/${l.id}`} className="flex flex-wrap items-center justify-between gap-2 p-3 hover:bg-neutral-50">
                <div className="min-w-0">
                  <p className="truncate font-medium">{l.full_name}</p>
                  <p className="truncate text-xs text-neutral-500">
                    {LEAD_TYPES[l.lead_type as keyof typeof LEAD_TYPES]} · {l.zone || "Sin zona"} · {fmtMoney(l.budget)}
                  </p>
                </div>
                <div className="text-right text-xs text-neutral-500">
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-neutral-700">{labels[l.stage_key] ?? l.stage_key}</span>
                  <p className="mt-1">Última interacción: {fmtDate(l.last_interaction_at)}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {(leads ?? []).length === 100 && <p className="mt-2 text-xs text-neutral-500">Mostrando los 100 más recientes. Afina la búsqueda para ver otros.</p>}
    </main>
  );
}
