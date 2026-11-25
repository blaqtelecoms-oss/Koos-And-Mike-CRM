import { db } from "../_shared/supabase.ts";

// Inbound WhatsApp Cloud API webhook.
//   GET  — Meta verification handshake (WHATSAPP_VERIFY_TOKEN)
//   POST — incoming messages: logged against the lead, unknown numbers become a new lead,
//          and the chatbot sends an automatic reply.
// Optional: WHATSAPP_APP_SECRET enables X-Hub-Signature-256 verification.
const GRAPH = "https://graph.facebook.com/v21.0";

const normalizePhone = (raw: string | null | undefined) => {
  const digits = (raw ?? "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.startsWith("0")) return `27${digits.slice(1)}`;
  if (digits.length <= 9) return `27${digits}`;
  return digits;
};

const AUTO_REPLIES: Array<[RegExp, string]> = [
  [/\b(price|pricing|cost|how much)\b/i, "Thanks {name}! Send us the vehicle you are looking at and a consultant will confirm the price and availability."],
  [/\b(finance|financing|installment|instalment|deposit)\b/i, "A consultant can run a quick finance check for you. What is your monthly budget?"],
  [/\b(trade|trade-in|trade in)\b/i, "We do trade-ins. Send us your car's make, model, year and mileage and a consultant will come back with a value."],
  [/\b(test drive|viewing|view|visit|come in)\b/i, "Happy to arrange a viewing or test drive. Which day suits you?"],
  [/\b(hours|open|opening|closed)\b/i, "A consultant will confirm our trading hours for you shortly."],
  [/\b(hi|hello|hey|good (morning|afternoon|day))\b/i, "Hi {name}! Thanks for messaging Koos & Mike Cars. Which vehicle are you interested in?"],
];

const autoReply = (text: string, name: string) => {
  const rule = AUTO_REPLIES.find(([pattern]) => pattern.test(text));
  const template = rule ? rule[1] : "Thanks {name}! Your message has been received — a Koos & Mike consultant will reply shortly.";
  return template.replace("{name}", name || "there");
};

const signatureValid = async (raw: string, header: string | null) => {
  const secret = Deno.env.get("WHATSAPP_APP_SECRET");
  if (!secret) return true;
  if (!header?.startsWith("sha256=")) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(raw));
  const hex = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return hex === header.slice(7);
};

async function sendReply(to: string, text: string) {
  const token = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
  const phoneId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
  if (!token || !phoneId) return null;
  const res = await fetch(`${GRAPH}/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { preview_url: false, body: text } }),
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("WhatsApp reply failed:", data?.error?.message || res.status);
    return null;
  }
  return (data?.messages?.[0]?.id as string) ?? null;
}

async function handleMessage(value: any) {
  const sb = db();
  const contacts = value?.contacts ?? [];
  const contactName = contacts[0]?.profile?.name ?? "";

  for (const message of value?.messages ?? []) {
    const phone = normalizePhone(message.from);
    if (!phone) continue;
    const text: string =
      message.text?.body ??
      message.button?.text ??
      message.interactive?.button_reply?.title ??
      message.interactive?.list_reply?.title ??
      "";

    // Meta retries webhooks — the unique wa_message_id makes this idempotent.
    const { data: inserted } = await sb
      .from("whatsapp_messages")
      .upsert(
        { phone, direction: "in", body: text || `[${message.type}]`, status: "received", wa_message_id: message.id },
        { onConflict: "wa_message_id", ignoreDuplicates: true },
      )
      .select("id");
    if (!inserted?.length) continue;

    const last9 = phone.slice(-9);
    const { data: existing } = await sb
      .from("leads")
      .select("id, lead_name")
      .ilike("phone", `%${last9}%`)
      .limit(1);
    let lead = existing?.[0] ?? null;

    if (!lead) {
      const { data: created } = await sb
        .from("leads")
        .insert({
          lead_name: contactName || `+${phone}`,
          phone: `+${phone}`,
          status: "New",
          source: "WhatsApp",
          assigned_consultant: "Unassigned",
          notes: "Created automatically from an inbound WhatsApp message.",
        })
        .select("id, lead_name")
        .single();
      lead = created ?? null;
    }

    if (!lead) continue;
    await sb.from("whatsapp_messages").update({ lead_id: lead.id }).eq("wa_message_id", message.id);

    const reply = autoReply(text, lead.lead_name || contactName);
    const waId = await sendReply(phone, reply);
    await sb.from("whatsapp_messages").insert({
      lead_id: lead.id,
      phone,
      direction: "out",
      body: reply,
      status: waId ? "sent" : "failed",
      wa_message_id: waId,
      error: waId ? null : "Auto-reply could not be sent",
    });
  }

  // Delivery receipts for messages we sent.
  for (const status of value?.statuses ?? []) {
    await sb
      .from("whatsapp_messages")
      .update({ status: status.status })
      .eq("wa_message_id", status.id);
  }
}

Deno.serve(async (req) => {
  const url = new URL(req.url);

  if (req.method === "GET") {
    const verifyToken = Deno.env.get("WHATSAPP_VERIFY_TOKEN");
    if (url.searchParams.get("hub.mode") === "subscribe" && verifyToken && url.searchParams.get("hub.verify_token") === verifyToken) {
      return new Response(url.searchParams.get("hub.challenge") ?? "", { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }

  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const raw = await req.text();
  if (!(await signatureValid(raw, req.headers.get("x-hub-signature-256")))) {
    return new Response("Invalid signature", { status: 401 });
  }

  try {
    const payload = JSON.parse(raw || "{}");
    for (const entry of payload.entry ?? []) {
      for (const change of entry.changes ?? []) {
        if (change.field === "messages") await handleMessage(change.value);
      }
    }
  } catch (error) {
    console.error("WhatsApp webhook error:", error);
  }

  return new Response("ok", { status: 200 });
});
