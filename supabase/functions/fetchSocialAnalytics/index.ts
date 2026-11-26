import { serve, db, json } from "../_shared/supabase.ts";

const GRAPH = "https://graph.facebook.com/v21.0";
const DEFAULT_DAYS = 30;
const MAX_DAYS = 90;

type DailyMap = Record<string, number>;
type Row = {
  platform: "facebook" | "instagram";
  metric_date: string;
  followers: number | null;
  reach: number | null;
  impressions: number | null;
  engagements: number | null;
  profile_visits: number | null;
  updated_date: string;
};

async function graphGet(path: string, params: Record<string, string>) {
  const url = new URL(`${GRAPH}/${path}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  const res = await fetch(url);
  const payload = await res.json().catch(() => ({}));
  if (!res.ok || payload.error) {
    throw new Error(payload.error?.message || `Graph API request failed (${res.status})`);
  }
  return payload;
}

/** Turns an insights response into { "YYYY-MM-DD": value } for one metric. */
function dailyValues(payload: any, name: string): DailyMap {
  const series = (payload?.data || []).find((entry: any) => entry.name === name);
  const out: DailyMap = {};
  for (const point of series?.values || []) {
    const value = typeof point.value === "number" ? point.value : point.value?.total;
    if (typeof value !== "number") continue;
    const date = String(point.end_time || "").slice(0, 10);
    if (date) out[date] = value;
  }
  return out;
}

/** Insights that only support metric_type=total_value return one number for the range. */
function totalValue(payload: any, name: string): number | null {
  const series = (payload?.data || []).find((entry: any) => entry.name === name);
  const value = series?.total_value?.value;
  return typeof value === "number" ? value : null;
}

/** Each metric is fetched on its own so one unsupported metric can't block the rest. */
async function fetchInsights(
  nodeId: string,
  token: string,
  metrics: string[],
  since: number,
  until: number
) {
  const out: Record<string, DailyMap> = {};
  for (const metric of metrics) {
    try {
      const payload = await graphGet(`${nodeId}/insights`, {
        metric,
        period: "day",
        since: String(since),
        until: String(until),
        access_token: token,
      });
      out[metric] = dailyValues(payload, metric);
    } catch {
      out[metric] = {};
    }
  }
  return out;
}

async function fetchTotals(
  nodeId: string,
  token: string,
  metrics: string[],
  since: number,
  until: number
) {
  const out: Record<string, number | null> = {};
  for (const metric of metrics) {
    try {
      const payload = await graphGet(`${nodeId}/insights`, {
        metric,
        period: "day",
        metric_type: "total_value",
        since: String(since),
        until: String(until),
        access_token: token,
      });
      out[metric] = totalValue(payload, metric);
    } catch {
      out[metric] = null;
    }
  }
  return out;
}

function dateRange(days: number) {
  const dates: string[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(today);
    day.setUTCDate(day.getUTCDate() - i);
    dates.push(day.toISOString().slice(0, 10));
  }
  return dates;
}

function buildRows(
  platform: Row["platform"],
  dates: string[],
  followers: number | null,
  metrics: { reach?: DailyMap; impressions?: DailyMap; engagements?: DailyMap; profile_visits?: DailyMap }
): Row[] {
  const updated_date = new Date().toISOString();
  return dates.map((metric_date) => ({
    platform,
    metric_date,
    followers,
    reach: metrics.reach?.[metric_date] ?? null,
    impressions: metrics.impressions?.[metric_date] ?? null,
    engagements: metrics.engagements?.[metric_date] ?? null,
    profile_visits: metrics.profile_visits?.[metric_date] ?? null,
    updated_date,
  }));
}

serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const requested = Number(body?.days);
    const days = Math.min(MAX_DAYS, Math.max(7, Number.isFinite(requested) && requested > 0 ? requested : DEFAULT_DAYS));

    const client = db();
    const { data: integrations, error } = await client
      .from("social_integrations")
      .select("platform, status, credentials")
      .in("platform", ["facebook", "instagram"]);
    if (error) throw error;

    const until = Math.floor(Date.now() / 1000);
    const since = until - days * 86400;
    const dates = dateRange(days);
    const rows: Row[] = [];
    const errors: string[] = [];

    const facebook = integrations?.find((row) => row.platform === "facebook");
    if (facebook?.status === "active") {
      const creds = facebook.credentials || {};
      const pageId = String(creds.page_id || "").trim();
      const token = String(creds.page_access_token || "").trim();
      if (pageId && token) {
        try {
          const page = await graphGet(pageId, { fields: "followers_count", access_token: token });
          // Meta no longer serves page impression/reach insights, so Facebook
          // contributes followers, engagements and page views only.
          const insights = await fetchInsights(
            pageId,
            token,
            ["page_post_engagements", "page_views_total"],
            since,
            until
          );
          rows.push(
            ...buildRows("facebook", dates, page.followers_count ?? null, {
              engagements: insights.page_post_engagements,
              profile_visits: insights.page_views_total,
            })
          );
        } catch (err) {
          errors.push(`facebook: ${err.message}`);
        }
      } else {
        errors.push("facebook: Page ID or access token is missing");
      }
    }

    const instagram = integrations?.find((row) => row.platform === "instagram");
    if (instagram?.status === "active") {
      const creds = instagram.credentials || {};
      const igId = String(creds.ig_business_account_id || "").trim();
      const token = String(creds.access_token || "").trim();
      if (igId && token) {
        try {
          const account = await graphGet(igId, { fields: "followers_count", access_token: token });
          const insights = await fetchInsights(igId, token, ["reach"], since, until);
          // These only come back as one total for the whole range — store it on
          // the latest day so the dashboard window still adds up.
          const totals = await fetchTotals(igId, token, ["views", "total_interactions", "profile_views"], since, until);
          const lastDate = dates[dates.length - 1];
          const onLastDay = (value: number | null): DailyMap => (value == null ? {} : { [lastDate]: value });
          rows.push(
            ...buildRows("instagram", dates, account.followers_count ?? null, {
              reach: insights.reach,
              impressions: onLastDay(totals.views),
              engagements: onLastDay(totals.total_interactions),
              profile_visits: onLastDay(totals.profile_views),
            })
          );
          // Those totals already cover the whole range, so drop the copies kept
          // on earlier days — otherwise every sync would count them again.
          await client
            .from("social_analytics")
            .update({ impressions: null, engagements: null, profile_visits: null })
            .eq("platform", "instagram")
            .lt("metric_date", lastDate);
        } catch (err) {
          errors.push(`instagram: ${err.message}`);
        }
      } else {
        errors.push("instagram: account ID or access token is missing");
      }
    }

    if (rows.length) {
      const { error: upsertError } = await client
        .from("social_analytics")
        .upsert(rows, { onConflict: "platform,metric_date" });
      if (upsertError) throw upsertError;
    }

    return json({ ok: true, days, saved: rows.length, errors });
  } catch (error) {
    return json({ error: error.message }, 400);
  }
});
