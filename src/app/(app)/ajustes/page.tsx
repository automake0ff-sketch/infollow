import { requireUser } from "@/lib/auth";
import { WEIGHTS } from "@/lib/weights";
import { updateSettings } from "./actions";

const input = "w-24 rounded-lg border bg-white p-2 text-sm";

export default async function AjustesPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const sp = await searchParams;
  const { supabase } = await requireUser();
  const { data: s } = await supabase.from("agency_settings").select("*").maybeSingle();
  const w = (s?.priority_weights ?? {}) as Record<string, number>;

  return (
    <main className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold">Ajustes de seguimiento</h1>
      {sp.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{sp.error}</p>}
      {sp.saved && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">Ajustes guardados.</p>}
      <form action={updateSettings} className="space-y-6">
        <section className="rounded-xl border bg-white p-4">
          <h2 className="mb-3 font-semibold">Plazos de inactividad</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm">Contacto inactivo (días)
              <input name="inactivity_days" type="number" min={1} max={365} defaultValue={s?.inactivity_days ?? 7} className={input} />
            </label>
            <label className="grid gap-1 text-sm">Interesado sin actividad (días)
              <input name="stalled_interested_days" type="number" min={1} max={365} defaultValue={s?.stalled_interested_days ?? 10} className={input} />
            </label>
            <label className="grid gap-1 text-sm">Negociación sin actividad (días)
              <input name="stalled_negotiation_days" type="number" min={1} max={365} defaultValue={s?.stalled_negotiation_days ?? 5} className={input} />
            </label>
            <label className="grid gap-1 text-sm">Lead nuevo sin atender (horas)
              <input name="new_lead_hours" type="number" min={1} max={720} defaultValue={s?.new_lead_hours ?? 24} className={input} />
            </label>
          </div>
        </section>
        <section className="rounded-xl border bg-white p-4">
          <h2 className="mb-1 font-semibold">Peso de cada alerta</h2>
          <p className="mb-3 text-xs text-neutral-500">Suma de pesos ≥ 60: prioridad alta · ≥ 30: media. Es prioridad de atención, no probabilidad de cierre.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {Object.entries(WEIGHTS).map(([k, [label, def]]) => (
              <label key={k} className="grid gap-1 text-sm">{label}
                <input name={`w_${k}`} type="number" min={0} max={100} defaultValue={w[k] ?? def} className={input} />
              </label>
            ))}
          </div>
        </section>
        <button className="rounded-lg bg-black px-4 py-2 text-sm text-white">Guardar ajustes</button>
      </form>
    </main>
  );
}
