import { createTaskInDays } from "./actions";

export default function QuickTask({ leadId, back }: { leadId: string; back: string }) {
  return (
    <form action={createTaskInDays} className="flex flex-wrap items-center gap-1">
      <input type="hidden" name="lead_id" value={leadId} />
      <input type="hidden" name="back" value={back} />
      <input name="title" defaultValue="Hacer seguimiento" maxLength={200} className="w-40 rounded-lg border p-1.5 text-xs" aria-label="Título del seguimiento" />
      <select name="days" defaultValue="1" className="rounded-lg border p-1.5 text-xs" aria-label="Cuándo">
        <option value="0">Hoy</option>
        <option value="1">Mañana</option>
        <option value="3">En 3 días</option>
        <option value="7">En 1 semana</option>
      </select>
      <button className="rounded-lg bg-black px-2.5 py-1.5 text-xs text-white">Crear seguimiento</button>
    </form>
  );
}
