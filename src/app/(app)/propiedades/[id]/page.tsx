import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { uuid } from "@/lib/schemas";
import PropertyForm from "../PropertyForm";
import { updateProperty } from "../actions";
import { unlinkProperty } from "../../leads/actions";

export default async function PropertyPage({
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

  const { data: property } = await supabase.from("properties").select("*").eq("id", id).maybeSingle();
  if (!property) notFound();

  const { data: links } = await supabase.from("lead_properties").select("lead_id").eq("property_id", id);
  const leadIds = (links ?? []).map((l) => l.lead_id);
  const { data: leads } = leadIds.length
    ? await supabase.from("leads").select("id, full_name, stage_key").in("id", leadIds)
    : { data: [] as { id: string; full_name: string; stage_key: string }[] };

  return (
    <main className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <div>
          <Link href="/propiedades" className="text-sm text-neutral-500 underline">← Propiedades</Link>
          <h1 className="mt-1 text-2xl font-semibold">{property.reference}</h1>
        </div>
        {sp.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{sp.error}</p>}
        {sp.saved && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">Cambios guardados.</p>}
        <section className="rounded-xl border bg-white p-4">
          <PropertyForm action={updateProperty.bind(null, id)} property={property} label="Guardar cambios" />
        </section>
      </div>
      <aside>
        <section className="rounded-xl border bg-white p-4">
          <h2 className="mb-3 font-semibold">Leads interesados</h2>
          {(leads ?? []).length === 0 ? (
            <p className="text-sm text-neutral-600">Ningún lead asociado. Asócialos desde la ficha del lead.</p>
          ) : (
            <ul className="space-y-2">
              {(leads ?? []).map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-2 text-sm">
                  <Link href={`/leads/${l.id}`} className="underline">{l.full_name}</Link>
                  <form action={unlinkProperty}>
                    <input type="hidden" name="lead_id" value={l.id} />
                    <input type="hidden" name="property_id" value={id} />
                    <input type="hidden" name="back" value="property" />
                    <button className="text-xs text-neutral-500 underline">Quitar</button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>
      </aside>
    </main>
  );
}
