"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { text, num } from "@/lib/form";
import { leadSchema, activitySchema, uuid } from "@/lib/schemas";

const err = (path: string, msg: string): never => redirect(`${path}${path.includes("?") ? "&" : "?"}error=${encodeURIComponent(msg)}`);

function parseLead(f: FormData) {
  return leadSchema.safeParse({
    full_name: text(f, "full_name") ?? "",
    phone: text(f, "phone"),
    email: text(f, "email"),
    lead_type: text(f, "lead_type") ?? "comprador",
    budget: num(f, "budget"),
    zone: text(f, "zone"),
    property_type: text(f, "property_type"),
    bedrooms: num(f, "bedrooms"),
    preferences: text(f, "preferences"),
    notes: text(f, "notes"),
    source: text(f, "source"),
  });
}

export async function createLead(f: FormData) {
  const { supabase } = await requireUser();
  const p = parseLead(f);
  if (!p.success) err("/leads/new", p.error.issues[0].message);
  const { data, error } = await supabase.from("leads").insert(p.data!).select("id").single();
  if (error || !data) err("/leads/new", "No se pudo crear el lead");
  revalidatePath("/leads");
  redirect(`/leads/${data!.id}`);
}

export async function updateLead(id: string, f: FormData) {
  const { supabase } = await requireUser();
  const path = `/leads/${id}`;
  if (!uuid.safeParse(id).success) redirect("/leads");
  const p = parseLead(f);
  if (!p.success) err(path, p.error.issues[0].message);
  const { error } = await supabase.from("leads").update(p.data!).eq("id", id);
  if (error) err(path, "No se pudo guardar");
  revalidatePath(path);
  revalidatePath("/leads");
  redirect(`${path}?saved=1`);
}

export async function changeStage(f: FormData) {
  const { supabase } = await requireUser();
  const id = String(f.get("lead_id") ?? "");
  const stage = String(f.get("stage") ?? "");
  const back = String(f.get("back") ?? "") === "pipeline" ? "/pipeline" : `/leads/${id}`;
  if (!uuid.safeParse(id).success || !stage) redirect("/leads");
  const { error } = await supabase.rpc("change_lead_stage", { p_lead: id, p_stage: stage });
  if (error) err(back, "No se pudo cambiar el estado");
  revalidatePath("/pipeline");
  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
  redirect(back);
}

export async function addActivity(f: FormData) {
  const { supabase } = await requireUser();
  const parsed = activitySchema.safeParse({
    lead_id: String(f.get("lead_id") ?? ""),
    type: text(f, "type") ?? "nota",
    content: text(f, "content") ?? "",
    property_id: text(f, "property_id"),
  });
  const id = String(f.get("lead_id") ?? "");
  if (!parsed.success) err(uuid.safeParse(id).success ? `/leads/${id}` : "/leads", parsed.error.issues[0].message);
  const { error } = await supabase.from("activities").insert(parsed.data!);
  if (error) err(`/leads/${id}`, "No se pudo registrar la actividad");
  revalidatePath(`/leads/${id}`);
  redirect(`/leads/${id}`);
}

export async function linkProperty(f: FormData) {
  const { supabase } = await requireUser();
  const leadId = String(f.get("lead_id") ?? "");
  const propertyId = String(f.get("property_id") ?? "");
  if (!uuid.safeParse(leadId).success) redirect("/leads");
  if (!uuid.safeParse(propertyId).success) err(`/leads/${leadId}`, "Elige una propiedad");
  const { error } = await supabase.from("lead_properties").insert({ lead_id: leadId, property_id: propertyId });
  if (error) err(`/leads/${leadId}`, "No se pudo asociar la propiedad");
  revalidatePath(`/leads/${leadId}`);
  redirect(`/leads/${leadId}`);
}

export async function unlinkProperty(f: FormData) {
  const { supabase } = await requireUser();
  const leadId = String(f.get("lead_id") ?? "");
  const propertyId = String(f.get("property_id") ?? "");
  const back = String(f.get("back") ?? "") === "property" ? `/propiedades/${propertyId}` : `/leads/${leadId}`;
  if (!uuid.safeParse(leadId).success || !uuid.safeParse(propertyId).success) redirect("/leads");
  await supabase.from("lead_properties").delete().eq("lead_id", leadId).eq("property_id", propertyId);
  revalidatePath(`/leads/${leadId}`);
  revalidatePath(`/propiedades/${propertyId}`);
  redirect(back);
}
