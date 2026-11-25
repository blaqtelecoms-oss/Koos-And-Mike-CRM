import { db, json, requireUser, serve } from "../_shared/supabase.ts";

serve(async (req) => {
  try {
    const user = await requireUser(req);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { endpoint, p256dh, auth } = await req.json().catch(() => ({}));
    if (!endpoint || !p256dh || !auth) {
      return json({ error: "Missing subscription fields" }, 400);
    }

    const client = db();
    const { data: existing, error: findError } = await client
      .from("push_subscriptions")
      .select("id")
      .eq("endpoint", endpoint)
      .limit(1);
    if (findError) throw findError;

    if (existing && existing.length > 0) {
      const { error } = await client
        .from("push_subscriptions")
        .update({ user_email: user.email, p256dh, auth })
        .eq("id", existing[0].id);
      if (error) throw error;
    } else {
      const { error } = await client
        .from("push_subscriptions")
        .insert({ user_email: user.email, endpoint, p256dh, auth });
      if (error) throw error;
    }

    return json({ success: true });
  } catch (error) {
    return json({ error: (error as Error).message }, 500);
  }
});
