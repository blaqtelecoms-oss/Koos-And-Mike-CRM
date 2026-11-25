import { json, requireUser, serve } from "../_shared/supabase.ts";

serve(async (req) => {
  try {
    const user = await requireUser(req);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { to, subject, html } = await req.json().catch(() => ({}));
    if (!to || !subject || !html) {
      return json({ error: "to, subject and html are required" }, 400);
    }

    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) {
      return json({ error: "Email is not configured (RESEND_API_KEY missing)" }, 500);
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Koos and Mike Cars <leads@koosandmike.co.za>",
        to: [to],
        subject,
        html,
      }),
    });

    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      return json({ error: payload.message || JSON.stringify(payload) }, 500);
    }
    return json({ success: true, id: payload.id });
  } catch (error) {
    return json({ error: (error as Error).message }, 500);
  }
});
