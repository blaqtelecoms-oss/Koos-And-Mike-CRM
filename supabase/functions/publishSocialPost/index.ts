import { serve, db, json } from "../_shared/supabase.ts";

const GRAPH = "https://graph.facebook.com/v21.0";
const SITE_URL = "https://koosandmike.co.za";

// Logged post platform -> integration that can publish it directly.
const PLATFORM_INTEGRATION = { "Facebook Page": "facebook", Instagram: "instagram" };

function mediaUrls(post) {
  const media = Array.isArray(post.media) ? post.media : [];
  return media
    .map((item) => (typeof item === "string" ? item : item?.url))
    .filter((url) => typeof url === "string" && url.length > 0);
}

function firstImageUrl(post) {
  return mediaUrls(post).find((url) => !/\.(mp4|mov|webm|m4v)(\?|$)/i.test(url)) || null;
}

function buildCaption(post) {
  const title = (post.title || "").trim();
  const body = (post.body || "").trim();
  const lines = [];

  if (title) lines.push(title);
  if (body) lines.push(body);
  if (!title && !body) {
    lines.push(
      post.vehicle_featured
        ? `${post.vehicle_featured} — available now at Koos & Mike Cars.`
        : "Fresh stock available now at Koos & Mike Cars."
    );
  }

  if (post.includes_website_link && (post.link_url || SITE_URL)) {
    lines.push((post.link_url || SITE_URL).trim());
  }
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
  const client = db();
  let postId = null;

  try {
    const body = await req.json().catch(() => ({}));
    postId = body?.post_id;
    if (!postId) return json({ error: "post_id is required" }, 400);

    const { data: post, error: postError } = await client
      .from("social_posts")
      .select("*")
      .eq("id", postId)
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
    let publishedId = null;

    if (platform === "facebook") {
      const pageId = String(creds.page_id || "").trim();
      const token = String(creds.page_access_token || "").trim();
      if (!pageId || !token) return json({ error: "Facebook Page ID or access token is missing" }, 400);

      const image = firstImageUrl(post);
      // A photo post gets the image on the card; without media it is a text post.
      const result = image
        ? await graphPost(`${pageId}/photos`, { url: image, message: caption, access_token: token })
        : await graphPost(`${pageId}/feed`, { message: caption, access_token: token });
      publishedId = result.post_id || result.id;
    } else {
      // Instagram publishes media, so it needs an image: the post's own media
      // first, otherwise the featured vehicle's first photo.
      const igId = String(creds.ig_business_account_id || "").trim();
      const token = String(creds.access_token || "").trim();
      if (!igId || !token) return json({ error: "Instagram account ID or access token is missing" }, 400);

      let imageUrl = firstImageUrl(post);
      if (!imageUrl && post.vehicle_featured) {
        const { data: vehicles } = await client
          .from("vehicles")
          .select("title, images")
          .ilike("title", `%${post.vehicle_featured}%`)
          .limit(1);
        imageUrl = vehicles?.[0]?.images?.[0] || null;
      }
      if (!imageUrl) {
        return json(
          { error: "Instagram needs a photo — add media to the post or feature a vehicle with photos" },
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
      publishedId = published.id;
    }

    await client
      .from("social_posts")
      .update({
        status: "published",
        published_id: publishedId,
        published_at: new Date().toISOString(),
        publish_error: null,
      })
      .eq("id", postId);

    return json({ ok: true, platform, published_id: publishedId });
  } catch (error) {
    if (postId) {
      await client
        .from("social_posts")
        .update({ status: "failed", publish_error: error.message })
        .eq("id", postId);
    }
    return json({ error: error.message }, 400);
  }
});
