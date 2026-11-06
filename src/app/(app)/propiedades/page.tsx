import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { OPERATIONS, PROPERTY_STATUS } from "@/lib/constants";
import { fmtMoney, safeSearch } from "@/lib/form";

type SP = { q?: string; operation?: string; status?: string };

export default async function PropertiesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { supabase } = await requireUser();
  const q = safeSearch(sp.q ?? "");

  let query = supabase
    .from("properties")
    .select("id, reference, property_type, operation, price, address, zone, bedrooms, bathrooms, area_m2, status")
    .order("created_at", { ascending: false })
    .limit(100);
  if (q) query = query.or(`reference.ilike.%${q}%,address.ilike.%${q}%,zone.ilike.%${q}%`);
  if (sp.operation && sp.operation in OPERATIONS) query = query.eq("operation", sp.operation);
  if (sp.status && sp.status in PROPERTY_STATUS) query = query.eq("status", sp.status);
  const { data: props, error } = await query;
  const hasFilters = Boolean(q || sp.operation || sp.status);

  return (
    <main>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Propiedades</h1>
        <Link href="/propiedades/new" className="rounded-lg bg-black px-4 py-2 text-sm text-white">Nueva propiedad</Link>
      </div>
      <form className="mb-4 grid gap-2 sm:grid-cols-4">
        <input name="q" defaultValue={q} placeholder="Referencia, dirección, zona…" className="rounded-lg border bg-white p-2.5 text-sm sm:col-span-2" />
        <select name="operation" defaultValue={sp.operation ?? ""} className="rounded-lg border bg-white p-2.5 text-sm">
          <option value="">Venta y alquiler</option>
          {Object.entries(OPERATIONS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <div className="flex gap-2">
          <select name="status" defaultValue={sp.status ?? ""} className="min-w-0 flex-1 rounded-lg border bg-white p-2.5 text-sm">
            <option value="">Todos los estados</option>
            {Object.entries(PROPERTY_STATUS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          <button className="rounded-lg border px-3 text-sm">Filtrar</button>
        </div>
      </form>

      {error && <p role="alert" className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">No se pudieron cargar las propiedades.</p>}

      {!error && (props ?? []).length === 0 ? (
        <section className="rounded-xl border border-dashed bg-white p-8 text-center">
          <p className="font-medium">{hasFilters ? "Ninguna propiedad coincide con la búsqueda." : "Todavía no tienes propiedades."}</p>
          {!hasFilters && <p className="mt-1 text-sm text-neutral-600">Añádelas para poder asociarlas a tus leads.</p>}
        </section>
      ) : (
        <ul className="divide-y rounded-xl border bg-white">
          {(props ?? []).map((p) => (
            <li key={p.id}>
              <Link href={`/propiedades/${p.id}`} className="flex flex-wrap items-center justify-between gap-2 p-3 hover:bg-neutral-50">
                <div className="min-w-0">
                  <p className="truncate font-medium">{p.reference} · {p.property_type || "Inmueble"}</p>
                  <p className="truncate text-xs text-neutral-500">
                    {p.address || p.zone || "Sin ubicación"} · {p.bedrooms ?? "—"} hab · {p.bathrooms ?? "—"} baños · {p.area_m2 ? `${p.area_m2} m²` : "— m²"}
                  </p>
                </div>
                <div className="text-right text-xs text-neutral-500">
                  <p className="text-sm font-medium text-neutral-900">{fmtMoney(p.price)}</p>
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-neutral-700">
                    {OPERATIONS[p.operation as keyof typeof OPERATIONS]} · {PROPERTY_STATUS[p.status as keyof typeof PROPERTY_STATUS]}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
