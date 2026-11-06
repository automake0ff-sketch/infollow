import LeadForm from "../LeadForm";
import { createLead } from "../actions";

export default async function NewLeadPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="max-w-3xl">
      <h1 className="mb-4 text-2xl font-semibold">Nuevo lead</h1>
      {error && <p role="alert" className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <LeadForm action={createLead} label="Crear lead" />
    </main>
  );
}
