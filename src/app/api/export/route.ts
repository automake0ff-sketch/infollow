import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const TABLES: [string, string[]][] = [
  ["agencies", ["id"]], ["profiles", ["id"]], ["agency_settings", ["agency_id"]], ["pipeline_stages", ["position"]],
  ["leads", ["created_at", "id"]], ["properties", ["created_at", "id"]], ["lead_properties", ["lead_id", "property_id"]],
  ["activities", ["created_at", "id"]], ["tasks", ["created_at", "id"]], ["ai_messages", ["created_at", "id"]],
  ["imports", ["created_at", "id"]],
];
const PAGE = 1000;

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (me?.role !== "owner") return NextResponse.json({ error: "Solo el propietario puede exportar los datos" }, { status: 403 });

  const out: Record<string, unknown[]> = {};
  for (const [table, order] of TABLES) {
    const rows: unknown[] = [];
    for (let from = 0; from < PAGE * 100; from += PAGE) {
      let q = supabase.from(table).select("*");
      for (const o of order) q = q.order(o);
      const { data, error } = await q.range(from, from + PAGE - 1);
      if (error) return NextResponse.json({ error: `No se pudo exportar ${table}` }, { status: 500 });
      rows.push(...(data ?? []));
      if (!data || data.length < PAGE) break;
    }
    out[table] = rows;
  }
  const body = JSON.stringify({ exported_at: new Date().toISOString(), format_version: 1, data: out }, null, 2);
  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="inmo-follow-export-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
