import { serve, db, json } from "../_shared/supabase.ts";

const GRAPH = "https://graph.facebook.com/v21.0";
const SITE_URL = "https://koosandmike.co.za";

// Logged post platform -> integration that can publish it directly.
const PLATFORM_INTEGRATION = { "Facebook Page": "facebook", Instagram: "instagram" };

function buildCaption(post) {
  const lines = [];
  lines.push(
    post.vehicle_featured
      ? `${post.vehicle_featured} — available now at Koos & Mike Cars.`
      : "Fresh stock available now at Koos & Mike Cars."
  );
  if (post.includes_website_link) lines.push(SITE_URL);
  if (post.includes_cta) lines.push("📞 WhatsApp or call us to arrange a viewing.");
  return lines.join("\n\n");
}

async function graphPost(path, params) {
  const res = await fetch(`${GRAPH}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params).toString(),
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok || payload.error) {
    const err = payload.error || {};
    throw new Error(err.error_user_msg || err.message || `Graph API request failed (${res.status})`);
  }
  return payload;
}

serve(async (req) => {
  try {
    const { post_id } = await req.json().catch(() => ({}));
    if (!post_id) return json({ error: "post_id is required" }, 400);

    const client = db();
    const { data: post, error: postError } = await client
      .from("social_posts")
      .select("*")
      .eq("id", post_id)
      .maybeSingle();
    if (postError) throw postError;
    if (!post) return json({ error: "Post not found" }, 404);

    const platform = PLATFORM_INTEGRATION[post.platform];
    if (!platform) return json({ error: `Direct posting is not available for ${post.platform}` }, 400);

    const { data: integration } = await client
      .from("social_integrations")
      .select("*")
      .eq("platform", platform)
      .maybeSingle();
    if (!integration || integration.status !== "active") {
      return json({ error: `The ${platform} integration is not active` }, 400);
    }

    const creds = integration.credentials || {};
    const caption = buildCaption(post);

    if (platform === "facebook") {
      const pageId = String(creds.page_id || "").trim();
      const token = String(creds.page_access_token || "").trim();
      if (!pageId || !token) return json({ error: "Facebook Page ID or access token is missing" }, 400);
      const result = await graphPost(`${pageId}/feed`, { message: caption, access_token: token });
      return json({ ok: true, platform, published_id: result.id });
    }

    // Instagram publishes media, so it needs the featured vehicle's first photo.
    const igId = String(creds.ig_business_account_id || "").trim();
    const token = String(creds.access_token || "").trim();
    if (!igId || !token) return json({ error: "Instagram account ID or access token is missing" }, 400);

    let imageUrl = null;
    if (post.vehicle_featured) {
      const { data: vehicles } = await client
        .from("vehicles")
        .select("title, images")
        .ilike("title", `%${post.vehicle_featured}%`)
        .limit(1);
      imageUrl = vehicles?.[0]?.images?.[0] || null;
    }
    if (!imageUrl) {
      return json(
        { error: "Instagram needs a photo — feature a vehicle with photos so its first image can be published" },
        400
      );
    }

    const container = await graphPost(`${igId}/media`, {
      image_url: imageUrl,
      caption,
      access_token: token,
    });
    const published = await graphPost(`${igId}/media_publish`, {
      creation_id: container.id,
      access_token: token,
    });
    return json({ ok: true, platform, published_id: published.id });
  } catch (error) {
    return json({ error: error.message }, 400);
  }
});
