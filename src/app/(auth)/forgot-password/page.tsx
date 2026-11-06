"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const email = String(new FormData(e.currentTarget).get("email"));
    await createClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setLoading(false);
    setSent(true);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 p-6">
      <h1 className="text-2xl font-semibold">Recuperar contraseña</h1>
      {sent ? (
        <p>Si el email existe, recibirás un enlace para restablecer la contraseña.</p>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <input name="email" type="email" required placeholder="Email" className="rounded-lg border p-3" />
          <button disabled={loading} className="rounded-lg bg-black p-3 text-white disabled:opacity-50">Enviar enlace</button>
        </form>
      )}
      <Link href="/login" className="text-sm underline">Volver</Link>
    </main>
  );
}
