import { db, json, requireUser, serve } from "../_shared/supabase.ts";

// WhatsApp Business Cloud API (Meta). Credentials live in the function secrets:
//   WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID
// Optional: WHATSAPP_TEMPLATE_NAME / WHATSAPP_TEMPLATE_LANG for business-initiated
// messages outside the 24-hour customer service window.
const GRAPH = "https://graph.facebook.com/v21.0";
const DEFAULT_TEMPLATE = Deno.env.get("WHATSAPP_TEMPLATE_NAME") || "lead_outreach";
const DEFAULT_LANG = Deno.env.get("WHATSAPP_TEMPLATE_LANG") || "en_US";
const WINDOW_MS = 24 * 60 * 60 * 1000;

type Recipient = { lead_id: string | null; phone: string; name?: string | null };

export const normalizePhone = (raw: string | null | undefined) => {
  const digits = (raw ?? "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.startsWith("0")) return `27${digits.slice(1)}`;
  if (digits.length <= 9) return `27${digits}`;
  return digits;
};

const credentials = () => {
  const token = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
  const phoneId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
  if (!token || !phoneId) return null;
  return { token, phoneId };
};

async function postMessage(payload: Record<string, unknown>) {
  const creds = credentials();
  if (!creds) throw new Error("WhatsApp is not configured");
  const res = await fetch(`${GRAPH}/${creds.phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${creds.token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", ...payload }),
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || `WhatsApp API error (${res.status})`);
  return (data?.messages?.[0]?.id as string) ?? null;
}

const sendText = (to: string, text: string) =>
  postMessage({ to, type: "text", text: { preview_url: false, body: text } });

const sendTemplate = (to: string, text: string, name: string, lang: string) =>
  postMessage({
    to,
    type: "template",
    template: {
      name,
      language: { code: lang },
      components: [{ type: "body", parameters: [{ type: "text", text }] }],
    },
  });

const hasOpenWindow = async (sb: ReturnType<typeof db>, phone: string) => {
  const since = new Date(Date.now() - WINDOW_MS).toISOString();
  const { data } = await sb
    .from("whatsapp_messages")
    .select("id")
    .eq("phone", phone)
    .eq("direction", "in")
    .gte("created_at", since)
    .limit(1);
  return !!data?.length;
};

serve(async (req) => {
  const user = await requireUser(req);
  if (!user) return json({ error: "Authentication required" }, 401);

  if (!credentials()) {
    return json(
      { error: "WhatsApp is not connected yet. Add WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID in the app secrets." },
      400,
    );
  }

  const body = await req.json().catch(() => ({}));
  const text = String(body.text ?? "").trim();
  if (!text) return json({ error: "Message text is required" }, 400);

  const sb = db();
  const recipients: Recipient[] = [];

  const leadIds: string[] = Array.isArray(body.lead_ids) ? body.lead_ids.slice(0, 50) : [];
  if (leadIds.length) {
    const { data: leads } = await sb.from("leads").select("id, lead_name, phone").in("id", leadIds);
    for (const lead of leads ?? []) {
      if (lead.phone) recipients.push({ lead_id: lead.id, phone: lead.phone, name: lead.lead_name });
    }
  }
  if (body.to) {
    recipients.push({ lead_id: body.lead_id ?? null, phone: String(body.to), name: body.name ?? null });
  }

  if (!recipients.length) return json({ error: "No recipients with a phone number" }, 400);

  const templateName = String(body.template_name || DEFAULT_TEMPLATE);
  const templateLang = String(body.template_lang || DEFAULT_LANG);
  const results: Array<{ phone: string; lead_id: string | null; ok: boolean; mode?: string; error?: string }> = [];

  for (const recipient of recipients) {
    const phone = normalizePhone(recipient.phone);
    if (!phone) {
      results.push({ phone: recipient.phone, lead_id: recipient.lead_id, ok: false, error: "Invalid phone number" });
      continue;
    }
    try {
      const open = await hasOpenWindow(sb, phone);
      const useTemplate = body.mode === "template" || (body.mode !== "text" && !open);
      const waId = useTemplate
        ? await sendTemplate(phone, text, templateName, templateLang)
        : await sendText(phone, text);
      await sb.from("whatsapp_messages").insert({
        lead_id: recipient.lead_id,
        phone,
        direction: "out",
        body: text,
        template_name: useTemplate ? templateName : null,
        status: "sent",
        wa_message_id: waId,
      });
      results.push({ phone, lead_id: recipient.lead_id, ok: true, mode: useTemplate ? "template" : "text" });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await sb.from("whatsapp_messages").insert({
        lead_id: recipient.lead_id,
        phone,
        direction: "out",
        body: text,
        status: "failed",
        error: message,
      });
      results.push({ phone, lead_id: recipient.lead_id, ok: false, error: message });
    }
  }

  const sent = results.filter((r) => r.ok).length;
  return json({ total: results.length, sent, failed: results.length - sent, results });
});
