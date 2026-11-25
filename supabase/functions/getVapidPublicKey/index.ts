import { json, requireUser, serve } from "../_shared/supabase.ts";

serve(async (req) => {
  try {
    const user = await requireUser(req);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const publicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    if (!publicKey) return json({ error: "VAPID not configured" }, 500);

    return json({ publicKey });
  } catch (error) {
    return json({ error: (error as Error).message }, 500);
  }
});
