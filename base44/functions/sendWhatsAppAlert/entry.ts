import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Uses CallMeBot free WhatsApp API
// One-time setup: Send "I allow callmebot to send me messages" to +34 644 38 38 45 on WhatsApp
// Then visit: https://www.callmebot.com/blog/free-api-whatsapp-messages/
// You'll receive your personal apikey via WhatsApp

const ALERT_PHONE = "27695498731"; // 0695498731 in international format
const CALLMEBOT_APIKEY = Deno.env.get("CALLMEBOT_APIKEY") || "";

export async function sendWhatsAppAlert(message) {
  if (!CALLMEBOT_APIKEY) {
    console.error("CALLMEBOT_APIKEY not set — cannot send WhatsApp alert");
    return false;
  }
  const encoded = encodeURIComponent(message);
  const url = `https://api.callmebot.com/whatsapp.php?phone=${ALERT_PHONE}&text=${encoded}&apikey=${CALLMEBOT_APIKEY}`;
  const resp = await fetch(url);
  const text = await resp.text();
  console.log("WhatsApp alert response:", text);
  return resp.ok;
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }
  const body = await req.json();
  const ok = await sendWhatsAppAlert(body.message || "Test alert from Koos & Mike CRM");
  return Response.json({ sent: ok });
});