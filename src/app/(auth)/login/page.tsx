"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const f = new FormData(e.currentTarget);
    const { error } = await createClient().auth.signInWithPassword({
      email: String(f.get("email")),
      password: String(f.get("password")),
    });
    setLoading(false);
    if (error) return setError("Email o contraseña incorrectos.");
    router.replace("/hoy");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 p-6">
      <h1 className="text-2xl font-semibold">Inicia sesión</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <input name="email" type="email" required autoComplete="email" placeholder="Email" className="rounded-lg border p-3" />
        <input name="password" type="password" required autoComplete="current-password" placeholder="Contraseña" className="rounded-lg border p-3" />
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <button disabled={loading} className="rounded-lg bg-black p-3 text-white disabled:opacity-50">
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
      <div className="flex justify-between text-sm">
        <Link href="/forgot-password" className="underline">¿Olvidaste tu contraseña?</Link>
        <Link href="/register" className="underline">Crear cuenta</Link>
      </div>
      <p className="text-xs text-neutral-500">
        <Link href="/privacidad" className="underline">Privacidad</Link> · <Link href="/terminos" className="underline">Términos</Link> · <Link href="/cookies" className="underline">Cookies</Link>
      </p>
    </main>
  );
}
