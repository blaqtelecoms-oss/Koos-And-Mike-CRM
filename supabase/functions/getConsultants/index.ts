import { db, json, serve } from "../_shared/supabase.ts";

serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const roleFilter = body.role || "Sales";

    const { data: consultants, error } = await db()
      .from("consultants")
      .select("id, name, role, available, active")
      .order("name", { ascending: false })
      .limit(100);
    if (error) throw error;

    const active = (consultants ?? [])
      .filter((c) => c.active !== false && c.role === roleFilter)
      .map((c) => ({ id: c.id, name: c.name, role: c.role, available: c.available }));

    return json({ consultants: active });
  } catch (error) {
    return json({ error: (error as Error).message }, 500);
  }
});
