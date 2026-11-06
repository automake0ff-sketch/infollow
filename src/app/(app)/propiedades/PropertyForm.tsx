import { OPERATIONS, PROPERTY_STATUS } from "@/lib/constants";

type Prop = Record<string, string | number | string[] | null> | null;
const input = "w-full rounded-lg border bg-white p-2.5 text-sm";

export default function PropertyForm({ action, property, label }: { action: (f: FormData) => Promise<void>; property?: Prop; label: string }) {
  const v = (k: string) => (property?.[k] ?? "") as string | number;
  const features = Array.isArray(property?.features) ? property.features.join(", ") : "";
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <label className="grid gap-1 text-sm">Referencia *
        <input name="reference" required maxLength={40} defaultValue={v("reference")} className={input} />
      </label>
      <label className="grid gap-1 text-sm">Tipo de inmueble
        <input name="property_type" maxLength={60} placeholder="Piso, casa, local…" defaultValue={v("property_type")} className={input} />
      </label>
      <label className="grid gap-1 text-sm">Operación
        <select name="operation" defaultValue={String(property?.operation ?? "venta")} className={input}>
          {Object.entries(OPERATIONS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-sm">Estado
        <select name="status" defaultValue={String(property?.status ?? "disponible")} className={input}>
          {Object.entries(PROPERTY_STATUS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-sm">Precio (€)
        <input name="price" inputMode="decimal" defaultValue={v("price")} className={input} />
      </label>
      <label className="grid gap-1 text-sm">Superficie (m²)
        <input name="area_m2" inputMode="decimal" defaultValue={v("area_m2")} className={input} />
      </label>
      <label className="grid gap-1 text-sm">Habitaciones
        <input name="bedrooms" inputMode="numeric" defaultValue={v("bedrooms")} className={input} />
      </label>
      <label className="grid gap-1 text-sm">Baños
        <input name="bathrooms" inputMode="numeric" defaultValue={v("bathrooms")} className={input} />
      </label>
      <label className="grid gap-1 text-sm">Dirección
        <input name="address" maxLength={200} defaultValue={v("address")} className={input} />
      </label>
      <label className="grid gap-1 text-sm">Zona
        <input name="zone" maxLength={120} defaultValue={v("zone")} className={input} />
      </label>
      <label className="grid gap-1 text-sm sm:col-span-2">Características (separadas por comas)
        <input name="features" placeholder="Terraza, garaje, ascensor" defaultValue={features} className={input} />
      </label>
      <label className="grid gap-1 text-sm sm:col-span-2">Descripción
        <textarea name="description" rows={4} maxLength={4000} defaultValue={v("description")} className={input} />
      </label>
      <div className="sm:col-span-2">
        <button className="rounded-lg bg-black px-4 py-2 text-sm text-white">{label}</button>
      </div>
    </form>
  );
}
