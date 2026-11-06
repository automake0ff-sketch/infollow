"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { text, num } from "@/lib/form";
import { propertySchema, uuid } from "@/lib/schemas";

const err = (path: string, msg: string): never => redirect(`${path}?error=${encodeURIComponent(msg)}`);

function parseProperty(f: FormData) {
  return propertySchema.safeParse({
    reference: text(f, "reference") ?? "",
    property_type: text(f, "property_type"),
    operation: text(f, "operation") ?? "venta",
    price: num(f, "price"),
    address: text(f, "address"),
    zone: text(f, "zone"),
    bedrooms: num(f, "bedrooms"),
    bathrooms: num(f, "bathrooms"),
    area_m2: num(f, "area_m2"),
    description: text(f, "description"),
    features: (text(f, "features") ?? "").split(",").map((s) => s.trim()).filter(Boolean),
    status: text(f, "status") ?? "disponible",
  });
}

export async function createProperty(f: FormData) {
  const { supabase } = await requireUser();
  const p = parseProperty(f);
  if (!p.success) err("/propiedades/new", p.error.issues[0].message);
  const { data, error } = await supabase.from("properties").insert(p.data!).select("id").single();
  if (error?.code === "23505") err("/propiedades/new", "Ya existe una propiedad con esa referencia");
  if (error || !data) err("/propiedades/new", "No se pudo crear la propiedad");
  revalidatePath("/propiedades");
  redirect(`/propiedades/${data!.id}`);
}

export async function updateProperty(id: string, f: FormData) {
  const { supabase } = await requireUser();
  if (!uuid.safeParse(id).success) redirect("/propiedades");
  const path = `/propiedades/${id}`;
  const p = parseProperty(f);
  if (!p.success) err(path, p.error.issues[0].message);
  const { error } = await supabase.from("properties").update(p.data!).eq("id", id);
  if (error?.code === "23505") err(path, "Ya existe otra propiedad con esa referencia");
  if (error) err(path, "No se pudo guardar");
  revalidatePath(path);
  revalidatePath("/propiedades");
  redirect(`${path}?saved=1`);
}
