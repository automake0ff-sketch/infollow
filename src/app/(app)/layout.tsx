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

const NAV = [
  { href: "/hoy", label: "Hoy" },
  { href: "/atencion", label: "Atención" },
  { href: "/leads", label: "Leads" },
  { href: "/pipeline", label: "Pipeline" },
  { href: "/propiedades", label: "Propiedades" },
  { href: "/ajustes", label: "Ajustes" },
];

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
    </div>
  );
}
