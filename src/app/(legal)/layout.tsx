import Link from "next/link";
import { LEGAL } from "@/lib/legal";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 text-sm">
          <Link href="/login" className="font-semibold">{LEGAL.product}</Link>
          <nav className="flex gap-3 text-neutral-600">
            <Link href="/privacidad" className="underline">Privacidad</Link>
            <Link href="/terminos" className="underline">Términos</Link>
            <Link href="/cookies" className="underline">Cookies</Link>
            <Link href="/dpa" className="underline">Encargo de tratamiento</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">
        {!LEGAL.reviewed && (
          <p className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            Texto modelo pendiente de revisión por un profesional jurídico. Los campos marcados como [PENDIENTE] deben completarse antes de operar.
          </p>
        )}
        <article className="space-y-4 text-sm leading-6 text-neutral-800 [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
          {children}
        </article>
        <p className="mt-8 text-xs text-neutral-500">Versión {LEGAL.version} · Última actualización: {LEGAL.updated}</p>
      </main>
    </div>
  );
}
