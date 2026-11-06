"use client";
import { undoImport } from "./actions";

export default function UndoForm({ id, kind, imported }: { id: string; kind: string; imported: number }) {
  return (
    <form
      action={undoImport}
      onSubmit={(e) => {
        if (!confirm(`Se eliminarán los ${imported} registros de esta importación, con su historial y seguimientos. ¿Continuar?`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="import_id" value={id} />
      <input type="hidden" name="kind" value={kind} />
      <button className="text-xs text-red-700 underline">Deshacer</button>
    </form>
  );
}
