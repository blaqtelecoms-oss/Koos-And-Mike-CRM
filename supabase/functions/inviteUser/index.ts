import { db, json, requireUser, serve } from "../_shared/supabase.ts";

serve(async (req) => {
  try {
    const user = await requireUser(req);
    if (user?.role !== "admin") return json({ error: "Admin access required" }, 403);

    const { email, role = "user", full_name } = await req.json().catch(() => ({}));
    if (!email) return json({ error: "email is required" }, 400);

    const client = db();
    const { data, error } = await client.auth.admin.inviteUserByEmail(email, {
      data: { full_name: full_name ?? null },
    });
    if (error) return json({ error: error.message }, 400);

    const { error: profileError } = await client
      .from("profiles")
      .upsert({ id: data.user.id, email, full_name: full_name ?? null, role }, { onConflict: "id" });
    if (profileError) throw profileError;

    return json({ success: true, user_id: data.user.id });
  } catch (error) {
    return json({ error: (error as Error).message }, 500);
  }
});
