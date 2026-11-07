import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

async function logout() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// Modo demo sencillo (por defecto): solo lo esencial. Pon NEXT_PUBLIC_SIMPLE_DEMO=false para ver todo el menú.
const SIMPLE = process.env.NEXT_PUBLIC_SIMPLE_DEMO !== "false";
const ALL_NAV = [
  { href: "/hoy", label: "Hoy", simple: true },
  { href: "/atencion", label: "Atención", simple: false },
  { href: "/leads", label: "Leads", simple: true },
  { href: "/pipeline", label: "Pipeline", simple: false },
  { href: "/propiedades", label: "Propiedades", simple: false },
  { href: "/importar", label: "Importar", simple: true },
  { href: "/analizador", label: "Analizador", simple: false },
  { href: "/ajustes", label: "Ajustes", simple: true },
];
const NAV = ALL_NAV.filter((n) => !SIMPLE || n.simple);

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, agencies(name)")
    .eq("id", user.id)
    .single();
  const agency = Array.isArray(profile?.agencies) ? profile?.agencies[0] : profile?.agencies;

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="sticky top-0 z-10 border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{agency?.name ?? "Mi agencia"}</p>
            <p className="truncate text-xs text-neutral-500">{profile?.full_name || user.email}</p>
          </div>
          <form action={logout}>
            <button className="rounded-lg border px-3 py-1.5 text-sm">Salir</button>
          </form>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-2">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm hover:bg-neutral-100">
              {n.label}
            </Link>
          ))}
        </nav>
      </header>
      <div className="mx-auto max-w-6xl p-4">{children}</div>
      <footer className="mx-auto max-w-6xl px-4 pb-6 text-xs text-neutral-500">
        <Link href="/privacidad" className="underline">Privacidad</Link> · <Link href="/terminos" className="underline">Términos</Link> · <Link href="/cookies" className="underline">Cookies</Link> · <Link href="/dpa" className="underline">Encargo de tratamiento</Link>
      </footer>
    </div>
  );
}
