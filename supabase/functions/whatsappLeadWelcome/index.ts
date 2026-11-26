import { db, json, serve } from "../_shared/supabase.ts";

// Business-initiated WhatsApp welcome message for a newly created lead.
// Called by the `lead_created_automation` trigger on public.leads through
// internal.invoke_edge(), which authenticates with the service-role key.
//
// Secrets (Supabase -> Edge Functions -> Secrets):
//   WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID — Cloud API credentials
//   WHATSAPP_WELCOME_TEMPLATE, WHATSAPP_WELCOME_TEMPLATE_LANG — optional overrides
// The template must be approved in WhatsApp Manager first: business-initiated
// messages cannot be free text.
const GRAPH = "https://graph.facebook.com/v21.0";
const TEMPLATE = Deno.env.get("WHATSAPP_WELCOME_TEMPLATE") || "lead_welcome";
const TEMPLATE_LANG = Deno.env.get("WHATSAPP_WELCOME_TEMPLATE_LANG") || "en_US";
// Meta reports #132001 when the template exists only under another English variant
// (e.g. created as "English" instead of "English (US)"), so both are attempted.
const TEMPLATE_LANGS = [...new Set([TEMPLATE_LANG, "en"])];

const normalizePhone = (raw: string | null | undefined) => {
  const digits = (raw ?? "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.startsWith("0")) return `27${digits.slice(1)}`;
  if (digits.length <= 9) return `27${digits}`;
  return digits;
};

// Template parameters cannot be empty or contain line breaks.
const clean = (value: unknown, fallback: string) => {
  const text = String(value ?? "").replace(/\s+/g, " ").trim().slice(0, 200);
  return text || fallback;
};

// The template carries an image header, so every message needs a public image link.
const FALLBACK_IMAGE = `${Deno.env.get("SUPABASE_URL") ?? ""}/storage/v1/object/public/app-assets/km-logo.png`;

// Same matching rule as the leads screen: the enquiry text contains the make and model.
const findVehicleImage = async (sb: any, carInterested: unknown) => {
  const text = String(carInterested ?? "").toLowerCase();
  if (!text) return "";
  const { data } = await sb.from("vehicles").select("make, model, images").limit(2000);
  const match = (data ?? []).find(
    (v: any) => v.make && v.model && text.includes(String(v.make).toLowerCase()) && text.includes(String(v.model).toLowerCase()),
  );
  const image = Array.isArray(match?.images) ? match.images[0] : match?.images;
  return typeof image === "string" && image.startsWith("https://") ? image : "";
};

serve(async (req) => {
  // Only internal.invoke_edge() (the lead_created_automation trigger) may call this.
  const internalSecret = Deno.env.get("INTERNAL_EDGE_SECRET") ?? "";
  if (!internalSecret || req.headers.get("x-internal-secret") !== internalSecret) {
    return json({ error: "Unauthorized" }, 401);
  }

  const token = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
  const phoneId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
  if (!token || !phoneId) return json({ error: "WhatsApp is not configured" }, 400);

  const payload = await req.json().catch(() => ({}));
  const lead = payload.lead ?? payload.data ?? payload;
  const phone = normalizePhone(lead?.phone);
  if (!phone) return json({ message: "Lead has no phone number, skipping." });

  const sb = db();
  const { data: already } = await sb
    .from("whatsapp_messages")
    .select("id")
    .eq("lead_id", lead.id)
    .eq("direction", "out")
    .eq("template_name", TEMPLATE)
    .limit(1);
  if (already?.length) return json({ message: "Welcome message already sent for this lead." });

  const name = clean(String(lead.lead_name ?? "").trim().split(" ")[0], "there");
  const vehicle = clean(lead.car_interested, "the vehicle you enquired about");
  const image = (await findVehicleImage(sb, lead.car_interested)) || FALLBACK_IMAGE;

  let waId: string | null = null;
  let error: string | null = null;
  let language = TEMPLATE_LANGS[0];

  for (const lang of TEMPLATE_LANGS) {
    const res = await fetch(`${GRAPH}/${phoneId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phone,
        type: "template",
        template: {
          name: TEMPLATE,
          language: { code: lang },
          components: [
            { type: "header", parameters: [{ type: "image", image: { link: image } }] },
            { type: "body", parameters: [{ type: "text", text: name }, { type: "text", text: vehicle }] },
          ],
        },
      }),
    });
    const data: any = await res.json().catch(() => ({}));
    language = lang;
    if (res.ok) {
      waId = (data?.messages?.[0]?.id as string) ?? null;
      error = null;
      break;
    }
    error = data?.error?.message || `WhatsApp API error (${res.status})`;
    if (data?.error?.code !== 132001) break;
  }
  if (error) console.error("WhatsApp welcome failed:", error);

  await sb.from("whatsapp_messages").insert({
    lead_id: lead.id ?? null,
    phone,
    direction: "out",
    body: `Welcome message (${TEMPLATE}/${language}) — ${vehicle}`,
    template_name: TEMPLATE,
    status: waId ? "sent" : "failed",
    wa_message_id: waId,
    error,
  });

  return json({ sent: !!waId, wa_message_id: waId, language, image, error });
});
