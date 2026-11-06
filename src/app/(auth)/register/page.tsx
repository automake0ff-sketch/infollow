"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { LEGAL } from "@/lib/legal";

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const f = new FormData(e.currentTarget);
    if (f.get("accept") !== "on") {
      setLoading(false);
      return setError("Debes aceptar los términos y la política de privacidad.");
    }
    const { error } = await createClient().auth.signUp({
      email: String(f.get("email")),
      password: String(f.get("password")),
      options: {
        data: { full_name: String(f.get("full_name")), agency_name: String(f.get("agency_name")), accepted_terms: "true", terms_version: LEGAL.version },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) return setError(error.message);
    setDone(true);
  }

  if (done)
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-3 p-6">
        <h1 className="text-2xl font-semibold">Revisa tu email</h1>
        <p>Te hemos enviado un enlace para confirmar tu cuenta.</p>
      </main>
    );

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 p-6">
      <h1 className="text-2xl font-semibold">Crea tu cuenta</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <input name="full_name" required maxLength={120} placeholder="Tu nombre" className="rounded-lg border p-3" />
        <input name="agency_name" required maxLength={120} placeholder="Nombre de tu agencia" className="rounded-lg border p-3" />
        <input name="email" type="email" required autoComplete="email" placeholder="Email" className="rounded-lg border p-3" />
        <input name="password" type="password" required minLength={8} autoComplete="new-password" placeholder="Contraseña (mín. 8)" className="rounded-lg border p-3" />
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="accept" required className="mt-1" />
          <span>
            He leído y acepto los <Link href="/terminos" target="_blank" className="underline">términos</Link>, la{" "}
            <Link href="/privacidad" target="_blank" className="underline">política de privacidad</Link> y el{" "}
            <Link href="/dpa" target="_blank" className="underline">contrato de encargo de tratamiento</Link>.
          </span>
        </label>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <button disabled={loading} className="rounded-lg bg-black p-3 text-white disabled:opacity-50">
          {loading ? "Creando…" : "Crear cuenta"}
        </button>
      </form>
      <Link href="/login" className="text-sm underline">Ya tengo cuenta</Link>
    </main>
  );
}
