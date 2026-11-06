"use client";
import { useState } from "react";
import { markSent, refineMessage, saveMessageEdit } from "./ai-actions";

export type AiItem = {
  id: string; kind: string; scenario: string | null; status: string; content: string; model: string | null; created_at: string;
};

const STATUS: Record<string, string> = {
  generado: "Generado por IA",
  editado: "Editado por el agente",
  enviado: "Marcado como enviado por el agente",
};

export default function AiMessageCard({ item, title, when }: { item: AiItem; title: string; when: string }) {
  const [copied, setCopied] = useState(false);
  const isMsg = item.kind === "mensaje";
  const sent = item.status === "enviado";

  async function copy(t: string) {
    try { await navigator.clipboard.writeText(t); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* sin permiso de portapapeles */ }
  }

  return (
    <li className="rounded-lg border p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-500">
        <span className="font-medium text-neutral-800">{title}</span>
        <span>{when}{isMsg && ` · ${STATUS[item.status] ?? item.status}`}</span>
      </div>

      {isMsg ? (
        <form action={saveMessageEdit} className="space-y-2">
          <input type="hidden" name="message_id" value={item.id} />
          <textarea name="content" defaultValue={item.content} rows={4} maxLength={6000} readOnly={sent} className="w-full rounded-lg border bg-white p-2 text-sm" />
          <div className="flex flex-wrap gap-1.5">
            <button type="button" onClick={() => copy(item.content)} className="rounded-lg border px-2.5 py-1 text-xs">{copied ? "¡Copiado!" : "Copiar"}</button>
            {!sent && <button className="rounded-lg border px-2.5 py-1 text-xs">Guardar edición</button>}
          </div>
        </form>
      ) : (
        <>
          <p className="whitespace-pre-wrap text-sm">{item.content}</p>
          <button type="button" onClick={() => copy(item.content)} className="mt-2 rounded-lg border px-2.5 py-1 text-xs">{copied ? "¡Copiado!" : "Copiar"}</button>
        </>
      )}

      {isMsg && !sent && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t pt-2">
          {(["acortar", "mejorar"] as const).map((m) => (
            <form key={m} action={refineMessage}>
              <input type="hidden" name="message_id" value={item.id} />
              <input type="hidden" name="mode" value={m} />
              <button className="rounded-lg border px-2.5 py-1 text-xs capitalize">{m}</button>
            </form>
          ))}
          <form action={refineMessage} className="flex gap-1">
            <input type="hidden" name="message_id" value={item.id} />
            <input type="hidden" name="mode" value="cambiar_tono" />
            <select name="tone" defaultValue="cercano" className="rounded-lg border p-1 text-xs" aria-label="Tono">
              <option value="cercano">Cercano</option>
              <option value="profesional">Profesional</option>
              <option value="directo">Directo</option>
            </select>
            <button className="rounded-lg border px-2.5 py-1 text-xs">Cambiar tono</button>
          </form>
          <form action={markSent} className="ml-auto">
            <input type="hidden" name="message_id" value={item.id} />
            <button className="rounded-lg bg-black px-2.5 py-1 text-xs text-white" title="La aplicación no envía mensajes: solo deja constancia de que tú lo has enviado">Registrar como enviado</button>
          </form>
        </div>
      )}
      <p className="mt-2 text-[11px] text-neutral-400">Generado con IA: revisa siempre el contenido antes de usarlo.{item.model ? ` Modelo: ${item.model}.` : ""}</p>
    </li>
  );
}
