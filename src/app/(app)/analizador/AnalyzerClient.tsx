"use client";
import { useActionState, useState } from "react";
import { analyzeConversation, saveAnalysis, type AnalyzeState } from "./actions";

const input = "w-full rounded-lg border bg-white p-2 text-sm";
const INTEREST: Record<string, string> = { alto: "Alto", medio: "Medio", bajo: "Bajo", no_especificado: "No especificado" };

export default function AnalyzerClient({ leads }: { leads: { id: string; full_name: string }[] }) {
  const [state, formAction, pending] = useActionState<AnalyzeState, FormData>(analyzeConversation, null);
  const [copied, setCopied] = useState(false);
  const a = state?.ok ? state.analysis : null;

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-3 rounded-xl border bg-white p-4">
        <label className="grid gap-1 text-sm">Lead al que pertenece
          <select name="lead_id" required defaultValue="" className={input}>
            <option value="" disabled>Elige un lead…</option>
            {leads.map((l) => <option key={l.id} value={l.id}>{l.full_name}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm">Conversación de WhatsApp, email o notas de llamada
          <textarea name="conversation" required rows={8} maxLength={8000} placeholder="Pega aquí el texto…" className={input} />
        </label>
        <p className="text-xs text-neutral-500">
          El texto se envía al proveedor de IA para analizarlo y <strong>no se guarda</strong> en la aplicación. Evita pegar datos de contacto o información innecesaria.
        </p>
        <button disabled={pending} className="rounded-lg bg-black px-4 py-2 text-sm text-white disabled:opacity-50">{pending ? "Analizando…" : "Analizar con IA"}</button>
      </form>

      {state && !state.ok && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}

      {a && state?.ok && (
        <form action={saveAnalysis} className="space-y-4 rounded-xl border bg-white p-4">
          <input type="hidden" name="lead_id" value={state.leadId} />
          <h2 className="font-semibold">Resultado del análisis</h2>
          <p className="text-xs text-neutral-500">Revísalo: la IA puede equivocarse. Nada se guarda hasta que marques lo que quieras y pulses Guardar.</p>

          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div><dt className="text-xs text-neutral-500">Necesidades</dt><dd>{a.necesidades}</dd></div>
            <div><dt className="text-xs text-neutral-500">Presupuesto mencionado</dt><dd>{a.presupuesto_mencionado}</dd></div>
            <div><dt className="text-xs text-neutral-500">Zona</dt><dd>{a.zona}</dd></div>
            <div><dt className="text-xs text-neutral-500">Tipo de inmueble</dt><dd>{a.tipo_inmueble}</dd></div>
            <div><dt className="text-xs text-neutral-500">Nivel de interés (estimado)</dt><dd>{INTEREST[a.nivel_interes]}</dd></div>
            <div><dt className="text-xs text-neutral-500">Próxima acción</dt><dd>{a.proxima_accion}</dd></div>
            <div><dt className="text-xs text-neutral-500">Objeciones</dt><dd>{a.objeciones.length ? a.objeciones.join(" · ") : "No especificado"}</dd></div>
            <div><dt className="text-xs text-neutral-500">Información pendiente</dt><dd>{a.informacion_pendiente.length ? a.informacion_pendiente.join(" · ") : "No especificado"}</dd></div>
          </dl>

          <div className="space-y-3 rounded-lg bg-neutral-50 p-3">
            <p className="text-sm font-medium">¿Qué quieres guardar en el CRM?</p>
            <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="save_note" defaultChecked className="mt-1" />
              <span className="grid flex-1 gap-1">Guardar el resumen como nota en el historial
                <textarea name="note" defaultValue={a.resumen} rows={3} maxLength={3500} className={input} /></span></label>
            {a.presupuesto_numero !== null && (
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="save_budget" />
                Actualizar presupuesto a <input name="budget" defaultValue={a.presupuesto_numero} inputMode="decimal" className="w-32 rounded-lg border p-1.5 text-sm" /> €</label>
            )}
            {a.zona !== "No especificado" && (
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="save_zone" />
                Actualizar zona a <input name="zone" defaultValue={a.zona} maxLength={120} className="w-48 rounded-lg border p-1.5 text-sm" /></label>
            )}
            <label className="flex flex-wrap items-center gap-2 text-sm"><input type="checkbox" name="save_task" defaultChecked={a.dias_hasta_proximo_contacto !== null} />
              Crear seguimiento
              <input name="task_title" defaultValue={a.proxima_accion === "No especificado" ? "Hacer seguimiento" : a.proxima_accion.slice(0, 200)} maxLength={200} className="min-w-48 flex-1 rounded-lg border p-1.5 text-sm" />
              en <input name="task_days" type="number" min={0} max={90} defaultValue={a.dias_hasta_proximo_contacto ?? 2} className="w-16 rounded-lg border p-1.5 text-sm" /> días</label>
            <button className="rounded-lg bg-black px-4 py-2 text-sm text-white">Guardar lo marcado</button>
          </div>

          <div>
            <p className="mb-1 text-sm font-medium">Borrador de respuesta</p>
            <textarea readOnly value={a.borrador_respuesta} rows={4} className={input} />
            <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(a.borrador_respuesta); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {} }} className="mt-1 rounded-lg border px-2.5 py-1 text-xs">{copied ? "¡Copiado!" : "Copiar"}</button>
          </div>
        </form>
      )}
    </div>
  );
}
