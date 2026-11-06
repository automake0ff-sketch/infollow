"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const password = String(new FormData(e.currentTarget).get("password"));
    const { error } = await createClient().auth.updateUser({ password });
    if (error) return setError(error.message);
    router.replace("/hoy");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 p-6">
      <h1 className="text-2xl font-semibold">Nueva contraseña</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <input name="password" type="password" required minLength={8} autoComplete="new-password" placeholder="Nueva contraseña" className="rounded-lg border p-3" />
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <button className="rounded-lg bg-black p-3 text-white">Guardar</button>
      </form>
    </main>
  );
}
