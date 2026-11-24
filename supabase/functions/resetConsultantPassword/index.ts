import { db, json, requireUser, serve } from "../_shared/supabase.ts";

serve(async (req) => {
  try {
    const user = await requireUser(req);
    if (!user || user.role !== "admin") {
      return json({ error: "Admin access required" }, 403);
    }

    const { consultant_id } = await req.json().catch(() => ({}));
    if (!consultant_id) return json({ error: "Consultant ID required" }, 400);

    const { error } = await db()
      .from("consultants")
      .update({ password_setup_required: true, password_hash: "" })
      .eq("id", consultant_id);
    if (error) throw error;

    return json({
      success: true,
      message: "Password reset. Consultant must set a new password on next login.",
    });
  } catch (error) {
    return json({ error: (error as Error).message }, 500);
  }
});
