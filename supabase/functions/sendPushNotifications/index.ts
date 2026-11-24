import webpush from "npm:web-push@3.6.7";
import { db, json, serve } from "../_shared/supabase.ts";

serve(async (req) => {
  try {
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    const vapidEmail = Deno.env.get("VAPID_EMAIL");

    if (!vapidPublicKey || !vapidPrivateKey || !vapidEmail) {
      return json({ error: "VAPID keys not configured" }, 500);
    }
    webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);

    const { title, message } = await req.json().catch(() => ({}));
    const client = db();

    const { data: subscriptions, error } = await client.from("push_subscriptions").select("*");
    if (error) throw error;
    if (!subscriptions || subscriptions.length === 0) {
      return json({ message: "No subscribers", sent: 0 });
    }

    let sent = 0;
    let failed = 0;
    const expired: string[] = [];

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({
            title: title || "🚗 New Lead!",
            body: message || "A new lead has just come in. Open the app to respond.",
            url: "/Leads",
          })
        );
        sent++;
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) expired.push(sub.id);
        failed++;
      }
    }

    if (expired.length > 0) {
      await client.from("push_subscriptions").delete().in("id", expired);
    }

    return json({ sent, failed, cleaned: expired.length });
  } catch (error) {
    return json({ error: (error as Error).message }, 500);
  }
});
