"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { WEIGHTS } from "@/lib/weights";

const int = (min: number, max: number) => z.coerce.number().int().min(min).max(max);
const schema = z.object({
  inactivity_days: int(1, 365),
  stalled_interested_days: int(1, 365),
  stalled_negotiation_days: int(1, 365),
  new_lead_hours: int(1, 720),
  weights: z.object(Object.fromEntries(Object.keys(WEIGHTS).map((k) => [k, int(0, 100)]))),
});

export async function updateSettings(f: FormData) {
  const { supabase } = await requireUser();
  const parsed = schema.safeParse({
    inactivity_days: f.get("inactivity_days"),
    stalled_interested_days: f.get("stalled_interested_days"),
    stalled_negotiation_days: f.get("stalled_negotiation_days"),
    new_lead_hours: f.get("new_lead_hours"),
    weights: Object.fromEntries(Object.keys(WEIGHTS).map((k) => [k, f.get(`w_${k}`)])),
  });
  if (!parsed.success) redirect(`/ajustes?error=${encodeURIComponent("Revisa los valores: deben ser números enteros dentro de rango")}`);
  const { weights, ...rest } = parsed.data!;
  const { data, error } = await supabase
    .from("agency_settings")
    .update({ ...rest, priority_weights: weights })
    .not("agency_id", "is", null)
    .select("agency_id");
  if (error || !data?.length) redirect(`/ajustes?error=${encodeURIComponent("No se pudo guardar. Solo el propietario de la agencia puede cambiar los ajustes.")}`);
  revalidatePath("/hoy");
  revalidatePath("/atencion");
  redirect("/ajustes?saved=1");
}

export async function deleteAgency(f: FormData) {
  const { supabase } = await requireUser();
  const confirm = String(f.get("confirm") ?? "");
  const { error } = await supabase.rpc("delete_my_agency", { p_confirm: confirm });
  if (error) {
    const msg = error.message.includes("confirmación") ? "El nombre escrito no coincide con el de la agencia."
      : error.message.includes("propietario") ? "Solo el propietario puede eliminar la agencia." : "No se pudo eliminar la agencia.";
    redirect(`/ajustes?error=${encodeURIComponent(msg)}`);
  }
  try { await supabase.auth.signOut(); } catch { /* la cuenta ya no existe */ }
  redirect("/login");
}
