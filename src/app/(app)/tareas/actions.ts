"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { text } from "@/lib/form";
import { uuid } from "@/lib/schemas";

/** Solo se permite volver a /hoy o a una ficha de lead (evita open redirect). */
function safeBack(f: FormData) {
  const b = String(f.get("back") ?? "");
  return b === "/hoy" || b === "/atencion" || /^\/leads\/[0-9a-f-]{36}$/.test(b) ? b : "/hoy";
}

function done(back: string, error?: string): never {
  revalidatePath("/hoy");
  revalidatePath(back);
  redirect(error ? `${back}?error=${encodeURIComponent(error)}` : back);
}

export async function createTask(f: FormData) {
  const { supabase } = await requireUser();
  const back = safeBack(f);
  const lead = String(f.get("lead_id") ?? "");
  const title = text(f, "title");
  const due = text(f, "due");
  if (!uuid.safeParse(lead).success || !title || title.length > 200) done(back, "Escribe un título para el seguimiento");
  if (!due || !/^\d{4}-\d{2}-\d{2}$/.test(due)) done(back, "Elige una fecha");
  const { error } = await supabase.rpc("create_task", { p_lead: lead, p_title: title, p_due: due });
  done(back, error ? "No se pudo crear el seguimiento" : undefined);
}

export async function createTaskInDays(f: FormData) {
  const { supabase } = await requireUser();
  const back = safeBack(f);
  const lead = String(f.get("lead_id") ?? "");
  const title = text(f, "title") ?? "Hacer seguimiento";
  const days = Number(f.get("days"));
  if (!uuid.safeParse(lead).success || !Number.isInteger(days) || days < 0 || days > 365 || title.length > 200)
    done(back, "Datos no válidos");
  const { error } = await supabase.rpc("create_task_in_days", { p_lead: lead, p_title: title, p_days: days });
  done(back, error ? "No se pudo crear el seguimiento" : undefined);
}

export async function completeTask(f: FormData) {
  const { supabase } = await requireUser();
  const back = safeBack(f);
  const id = String(f.get("task_id") ?? "");
  if (!uuid.safeParse(id).success) done(back, "Seguimiento no válido");
  const { error } = await supabase.rpc("complete_task", { p_task: id });
  done(back, error ? "No se pudo completar el seguimiento" : undefined);
}

export async function snoozeTask(f: FormData) {
  const { supabase } = await requireUser();
  const back = safeBack(f);
  const id = String(f.get("task_id") ?? "");
  const days = Number(f.get("days"));
  if (!uuid.safeParse(id).success || !Number.isInteger(days) || days < 1 || days > 30) done(back, "Datos no válidos");
  const { error } = await supabase.rpc("snooze_task", { p_task: id, p_days: days });
  done(back, error ? "No se pudo posponer el seguimiento" : undefined);
}
