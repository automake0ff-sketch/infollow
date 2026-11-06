import { requireUser } from "@/lib/auth";
import AnalyzerClient from "./AnalyzerClient";

export default async function AnalizadorPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const { supabase } = await requireUser();
  const [{ data: leads }, { data: q }] = await Promise.all([
    supabase.from("leads").select("id, full_name").order("full_name").limit(500),
    supabase.rpc("ai_quota"),
  ]);
  const quota = (Array.isArray(q) ? q[0] : q) as { used: number; daily_limit: number } | null;
  return (
    <main className="max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Analizador de conversaciones</h1>
        <p className="text-sm text-neutral-500">
          Convierte una conversación en un resumen estructurado y una próxima acción.
          {quota && <> Usos de IA hoy: {quota.used}/{quota.daily_limit}.</>}
        </p>
      </div>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {(leads ?? []).length === 0 ? (
        <section className="rounded-xl border border-dashed bg-white p-8 text-center text-sm text-neutral-600">
          Primero crea o importa algún lead: el análisis se guarda en su ficha.
        </section>
      ) : (
        <AnalyzerClient leads={leads ?? []} />
      )}
    </main>
  );
}
