import { json, requireUser, serve } from "../_shared/supabase.ts";

// CallMeBot free WhatsApp API
const ALERT_PHONE = "27695498731";

async function sendWhatsAppAlert(message: string) {
  const apiKey = Deno.env.get("CALLMEBOT_APIKEY") || "";
  if (!apiKey) {
    console.error("CALLMEBOT_APIKEY not set — cannot send WhatsApp alert");
    return false;
  }
  const url = `https://api.callmebot.com/whatsapp.php?phone=${ALERT_PHONE}&text=${encodeURIComponent(message)}&apikey=${apiKey}`;
  const resp = await fetch(url);
  console.log("WhatsApp alert response:", await resp.text());
  return resp.ok;
}

serve(async (req) => {
  const user = await requireUser(req);
  if (user?.role !== "admin") return json({ error: "Forbidden" }, 403);

  const body = await req.json().catch(() => ({}));
  const sent = await sendWhatsAppAlert(body.message || "Test alert from Koos & Mike CRM");
  return json({ sent });
});
