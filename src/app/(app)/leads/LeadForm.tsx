import { LEAD_TYPES } from "@/lib/constants";

type Lead = Record<string, string | number | null> | null;
const input = "w-full rounded-lg border bg-white p-2.5 text-sm";

export default function LeadForm({ action, lead, label }: { action: (f: FormData) => Promise<void>; lead?: Lead; label: string }) {
  const v = (k: string) => (lead?.[k] ?? "") as string | number;
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <label className="grid gap-1 text-sm sm:col-span-2">Nombre *
        <input name="full_name" required maxLength={120} defaultValue={v("full_name")} className={input} />
      </label>
      <label className="grid gap-1 text-sm">Teléfono
        <input name="phone" type="tel" maxLength={30} defaultValue={v("phone")} className={input} />
      </label>
      <label className="grid gap-1 text-sm">Email
        <input name="email" type="email" maxLength={160} defaultValue={v("email")} className={input} />
      </label>
      <label className="grid gap-1 text-sm">Tipo de contacto
        <select name="lead_type" defaultValue={String(lead?.lead_type ?? "comprador")} className={input}>
          {Object.entries(LEAD_TYPES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-sm">Presupuesto (€)
        <input name="budget" inputMode="decimal" defaultValue={v("budget")} className={input} />
      </label>
      <label className="grid gap-1 text-sm">Zona de interés
        <input name="zone" maxLength={120} defaultValue={v("zone")} className={input} />
      </label>
      <label className="grid gap-1 text-sm">Tipo de inmueble
        <input name="property_type" maxLength={60} placeholder="Piso, casa, local…" defaultValue={v("property_type")} className={input} />
      </label>
      <label className="grid gap-1 text-sm">Habitaciones
        <input name="bedrooms" inputMode="numeric" defaultValue={v("bedrooms")} className={input} />
      </label>
      <label className="grid gap-1 text-sm">Fuente
        <input name="source" maxLength={80} placeholder="Idealista, web, recomendación…" defaultValue={v("source")} className={input} />
      </label>
      <label className="grid gap-1 text-sm sm:col-span-2">Preferencias
        <textarea name="preferences" rows={2} maxLength={2000} defaultValue={v("preferences")} className={input} />
      </label>
      <label className="grid gap-1 text-sm sm:col-span-2">Notas
        <textarea name="notes" rows={3} maxLength={4000} defaultValue={v("notes")} className={input} />
      </label>
      <div className="sm:col-span-2">
        <button className="rounded-lg bg-black px-4 py-2 text-sm text-white">{label}</button>
      </div>
    </form>
  );
}
