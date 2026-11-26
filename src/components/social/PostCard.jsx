import { useState } from "react";
import moment from "moment";
import GlassCard from "@/components/premium/GlassCard";
import StatusPill from "@/components/premium/StatusPill";
import MediaGrid from "./MediaGrid";
import { PLATFORM_META, audienceIcon, audienceLabel, isVideoUrl } from "./meta";
import {
  BarChart3, Bookmark, Eye, ExternalLink, Heart, ImagePlus, Loader2, MessageSquare, MousePointerClick,
  Pencil, RefreshCcw, Send, Share2, Trash2,
} from "lucide-react";

const STATUS_LABEL = { draft: "Draft", published: "Published", failed: "Failed" };

const fmt = (value) => {
  if (value == null) return "—";
  if (value >= 1000000) return `${(value / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(value);
};

function metricsFor(post) {
  const saved = post.platform === "Instagram";
  return [
    { key: "reach", label: "Reach", icon: Eye },
    { key: "impressions", label: "Impressions", icon: BarChart3 },
    { key: "likes", label: "Likes", icon: Heart },
    { key: "comments", label: "Comments", icon: MessageSquare },
    { key: "shares", label: "Shares", icon: Share2 },
    saved ? { key: "saved", label: "Saved", icon: Bookmark } : { key: "clicks", label: "Clicks", icon: MousePointerClick },
  ];
}

export default function PostCard({ post, refreshing, publishing, onDelete, onPublish, onRefresh, onThumbnail, onEdit }) {
  const [thumbBusy, setThumbBusy] = useState(false);

  const handleThumbnail = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !onThumbnail) return;
    setThumbBusy(true);
    try {
      await onThumbnail(post, file);
    } finally {
      setThumbBusy(false);
    }
  };

  const meta = PLATFORM_META[post.platform] || PLATFORM_META["Facebook Page"];
  const PlatformIcon = meta.icon;
  const AudienceIcon = audienceIcon(post.audience);
  const insights = post.insights || {};
  const media = Array.isArray(post.media) ? post.media : [];
  const status = post.status || "published";
  const title = post.title || post.vehicle_featured || "";
  const body = post.body || "";
  const engagement = Number(insights.engagement) || 0;
  const reach = Number(insights.reach) || 0;
  const engagementRate = reach > 0 ? ((engagement / reach) * 100).toFixed(1) : null;
  const when = post.published_at || post.created_date;

  return (
    <GlassCard className="sp-post">
      <div className="sp-post-head">
        <div className="sp-avatar">KM</div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="sp-composer-name">Koos & Mike Cars</div>
          <div className="sp-post-meta">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <PlatformIcon style={{ width: 12, height: 12, color: meta.color }} />
              {meta.label}
            </span>
            <span>·</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <AudienceIcon style={{ width: 12, height: 12 }} />
              {audienceLabel(post.audience)}
            </span>
            <span>·</span>
            <span title={moment(when).format("D MMM YYYY HH:mm")}>{moment(when).fromNow()}</span>
            {post.post_type && <span className="km-chip" style={{ fontSize: 10, padding: "2px 7px" }}>{post.post_type}</span>}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <StatusPill status={STATUS_LABEL[status]} />
          <button type="button" className="sp-icon-x" onClick={() => onDelete(post.id)} aria-label="Delete post">
            <Trash2 style={{ width: 14, height: 14 }} />
          </button>
        </div>
      </div>

      {title && <div className="sp-post-title">{title}</div>}
      {body && <div className="sp-post-body">{body}</div>}

      <div className="sp-thumb-row">
        {post.thumbnail_url && <img src={post.thumbnail_url} alt="Post thumbnail" className="sp-thumb" />}
        {onThumbnail && (
          <label className="sp-tool sp-thumb-upload">
            {thumbBusy ? <Loader2 style={{ width: 13, height: 13 }} className="animate-spin" /> : <ImagePlus style={{ width: 13, height: 13 }} />}
            {post.thumbnail_url ? "Change thumbnail" : "Add thumbnail"}
            <input type="file" accept="image/*" hidden onChange={handleThumbnail} disabled={thumbBusy} />
          </label>
        )}
      </div>

      <MediaGrid media={media} />

      {post.includes_website_link && post.link_url && (
        <a className="sp-post-link" href={post.link_url} target="_blank" rel="noreferrer">
          <ExternalLink style={{ width: 12, height: 12 }} />
          {post.link_url.replace(/^https?:\/\//, "")}
        </a>
      )}

      {post.audience === "custom" && post.audience_note && (
        <div className="sp-note" style={{ marginTop: 8 }}>Audience: {post.audience_note}</div>
      )}

      {status === "published" ? (
        <div className="sp-perf">
          <div className="sp-perf-head">
            <BarChart3 style={{ width: 14, height: 14, color: "var(--gold)" }} />
            Post performance
            <span className="sp-perf-updated">
              {post.insights_updated_at ? `Updated ${moment(post.insights_updated_at).fromNow()}` : "Not synced yet"}
            </span>
            <button
              type="button"
              className="sp-tool sp-refresh"
              onClick={() => onRefresh(post.id)}
              disabled={refreshing}
              title="Refresh insights from Meta"
            >
              {refreshing ? <Loader2 style={{ width: 13, height: 13 }} className="animate-spin" /> : <RefreshCcw style={{ width: 13, height: 13 }} />}
              Refresh
            </button>
          </div>

          <div className="sp-metrics">
            {metricsFor(post).map(({ key, label, icon: Icon }) => (
              <div key={key} className="sp-metric">
                <div className="sp-metric-label">
                  <Icon style={{ width: 11, height: 11 }} />
                  {label}
                </div>
                <div className="sp-metric-value">{fmt(insights[key])}</div>
              </div>
            ))}
          </div>

          <div className="sp-perf-foot">
            <span>
              Engagement rate <b>{engagementRate != null ? `${engagementRate}%` : "—"}</b>
              <span style={{ marginLeft: 8 }}>{fmt(engagement)} interactions</span>
            </span>
            {insights.permalink && (
              <a href={insights.permalink} target="_blank" rel="noreferrer" className="sp-post-link" style={{ marginTop: 0 }}>
                View on {meta.label} <ExternalLink style={{ width: 11, height: 11 }} />
              </a>
            )}
          </div>

          {insights.error && <div className="sp-note-warn" style={{ marginTop: 6 }}>{insights.error}</div>}
        </div>
      ) : (
        <div className="sp-post-actions">
          {post.publish_error && <span className="sp-note-warn">{post.publish_error}</span>}
          {status === "draft" && onEdit && (
            <button type="button" className="sp-tool" onClick={() => onEdit(post)}>
              <Pencil style={{ width: 13, height: 13 }} /> Edit
            </button>
          )}
          {post.audience === "private" ? (
            <span className="sp-note">Private — only you can see this post; it is never published.</span>
          ) : meta.publishable ? (
            <button type="button" className="km-btn-primary" onClick={() => onPublish(post)} disabled={publishing}>
              {publishing ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> : <Send style={{ width: 14, height: 14 }} />}
              Publish now
            </button>
          ) : (
            <span className="sp-note">{meta.label} is logged only — post it by hand.</span>
          )}
        </div>
      )}

      {media.some(isVideoUrl) && <div className="sp-note" style={{ marginTop: 8 }}>Videos publish to Instagram as Reels — Facebook posts the caption without the video.</div>}
    </GlassCard>
  );
}
