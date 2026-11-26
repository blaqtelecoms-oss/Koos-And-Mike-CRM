import { serve, db, json } from "../_shared/supabase.ts";

const GRAPH = "https://graph.facebook.com/v21.0";

const num = (value) => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

async function graphGet(path, params) {
  const url = `${GRAPH}/${path}?${new URLSearchParams(params).toString()}`;
  const res = await fetch(url);
  const payload = await res.json().catch(() => ({}));
  if (!res.ok || payload.error) {
    const err = payload.error || {};
    throw new Error(err.error_user_msg || err.message || `Graph API request failed (${res.status})`);
  }
  return payload;
}

function insightValue(payload, name) {
  const entry = (payload?.data || []).find((item) => item.name === name);
  const value = entry?.values?.[0]?.value;
  return typeof value === "number" ? value : null;
}

// Meta rejects a whole insights call when one metric is unavailable for that
// post type, so try the full set and fall back to the metrics every post has.
async function fetchInsights(id, token, attempts) {
  let lastError = null;
  for (const metrics of attempts) {
    try {
      return await graphGet(`${id}/insights`, { metric: metrics.join(","), access_token: token });
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error("Insights unavailable");
}

async function facebookMetrics(post, token) {
  const fields = await graphGet(post.published_id, {
    fields: "permalink_url,reactions.summary(total_count).limit(0),comments.summary(true).limit(0),shares",
    access_token: token,
  });

  let insights = null;
  let insightsError = null;
  try {
    insights = await fetchInsights(post.published_id, token, [
      ["post_impressions", "post_impressions_unique", "post_clicks"],
      ["post_impressions_unique"],
    ]);
  } catch (error) {
    insightsError = error.message;
  }

  const likes = num(fields.reactions?.summary?.total_count);
  const comments = num(fields.comments?.summary?.total_count);
  const shares = num(fields.shares?.count);

  return {
    metrics: {
      reach: insightValue(insights, "post_impressions_unique"),
      impressions: insightValue(insights, "post_impressions"),
      clicks: insightValue(insights, "post_clicks"),
      likes,
      comments,
      shares,
      saved: 0,
      engagement: likes + comments + shares,
      permalink: fields.permalink_url || null,
    },
    insightsError,
  };
}

async function instagramMetrics(post, token) {
  const fields = await graphGet(post.published_id, {
    fields: "permalink,like_count,comments_count",
    access_token: token,
  });

  let insights = null;
  let insightsError = null;
  try {
    insights = await fetchInsights(post.published_id, token, [
      ["reach", "impressions", "total_interactions", "saved", "shares"],
      ["reach", "total_interactions", "saved"],
      ["reach"],
    ]);
  } catch (error) {
    insightsError = error.message;
  }

  const likes = num(fields.like_count);
  const comments = num(fields.comments_count);
  const shares = insightValue(insights, "shares") || 0;
  const saved = insightValue(insights, "saved") || 0;
  const totalInteractions = insightValue(insights, "total_interactions");

  return {
    metrics: {
      reach: insightValue(insights, "reach"),
      impressions: insightValue(insights, "impressions"),
      clicks: null,
      likes,
      comments,
      shares,
      saved,
      engagement: totalInteractions != null ? totalInteractions : likes + comments + shares + saved,
      permalink: fields.permalink || null,
    },
    insightsError,
  };
}

serve(async (req) => {
  try {
    const client = db();
    const body = await req.json().catch(() => ({}));
    const limit = Math.min(Math.max(Number(body?.limit) || 25, 1), 100);

    let query = client
      .from("social_posts")
      .select("*")
      .not("published_id", "is", null)
      .order("published_at", { ascending: false })
      .limit(limit);
    if (body?.post_id) {
      query = client.from("social_posts").select("*").eq("id", body.post_id).limit(1);
    }
    const { data: posts, error: postsError } = await query;
    if (postsError) throw postsError;
    if (!posts || posts.length === 0) {
      return json({ message: "No published posts to measure", updated: 0, results: [] });
    }

    const { data: integrations } = await client
      .from("social_integrations")
      .select("*")
      .in("platform", ["facebook", "instagram"]);
    const byPlatform = Object.fromEntries((integrations || []).map((row) => [row.platform, row]));

    const results = [];
    for (const post of posts) {
      const platform = post.platform === "Facebook Page" ? "facebook" : post.platform === "Instagram" ? "instagram" : null;
      if (!platform) {
        results.push({ id: post.id, status: "skipped", reason: "Not a measured platform" });
        continue;
      }

      const integration = byPlatform[platform];
      const creds = integration?.credentials || {};
      const token = String(platform === "facebook" ? creds.page_access_token || "" : creds.access_token || "").trim();
      if (!token) {
        results.push({ id: post.id, status: "skipped", reason: `No ${platform} access token` });
        continue;
      }

      try {
        const { metrics, insightsError } = platform === "facebook"
          ? await facebookMetrics(post, token)
          : await instagramMetrics(post, token);

        const previous = post.insights || {};
        const insights = { ...metrics };
        // A metric Meta did not return keeps its last known value.
        for (const key of ["reach", "impressions", "clicks"]) {
          if (insights[key] == null && previous[key] != null) insights[key] = previous[key];
        }
        if (insightsError) insights.error = insightsError;

        await client
          .from("social_posts")
          .update({ insights, insights_updated_at: new Date().toISOString() })
          .eq("id", post.id);

        results.push({ id: post.id, status: "updated", reach: insights.reach, engagement: insights.engagement });
      } catch (error) {
        const previous = post.insights || {};
        await client
          .from("social_posts")
          .update({
            insights: { ...previous, error: error.message },
            insights_updated_at: new Date().toISOString(),
          })
          .eq("id", post.id);
        results.push({ id: post.id, status: "failed", reason: error.message });
      }
    }

    return json({ message: `Measured ${results.length} post(s)`, updated: results.filter((r) => r.status === "updated").length, results });
  } catch (error) {
    return json({ error: error.message }, 400);
  }
});
