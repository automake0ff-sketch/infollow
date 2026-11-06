import Link from "next/link";

export default function HoyPage() {
  return (
    <main>
      <h1 className="text-2xl font-semibold">Tu día comercial</h1>
      <section className="mt-6 rounded-xl border border-dashed bg-white p-8 text-center">
        <p className="font-medium">Aquí verás a quién atender cada mañana.</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-neutral-600">
          Los seguimientos llegan en la Etapa 3. Mientras tanto, empieza creando tus primeros contactos y propiedades.
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <Link href="/leads/new" className="rounded-lg bg-black px-4 py-2 text-sm text-white">Nuevo lead</Link>
          <Link href="/propiedades/new" className="rounded-lg border px-4 py-2 text-sm">Nueva propiedad</Link>
        </div>
      </section>
    </main>
  );
}
