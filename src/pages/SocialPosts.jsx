import { useEffect, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import moment from "moment";
import { api } from "@/api/supabaseClient";
import { isAdminUser } from "@/lib/admin";
import GlassCard from "@/components/premium/GlassCard";
import EmptyState from "@/components/premium/EmptyState";
import PostComposer from "@/components/social/PostComposer";
import PostCard from "@/components/social/PostCard";
import { INTEGRATION_DOT, PLATFORMS, PLATFORM_META } from "@/components/social/meta";
import { useToast } from "@/components/ui/use-toast";
import {
  BarChart3, Check, Eye, Heart, Loader2, Plug, RefreshCcw, Send, Share2, Users, X,
} from "lucide-react";

const RANGES = [
  { value: "1", label: "Today" },
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "all", label: "All time" },
];

const fmt = (value) => {
  if (!value) return "0";
  if (value >= 1000000) return `${(value / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(value);
};

export default function SocialPosts() {
  const [posts, setPosts] = useState([]);
  const [integrations, setIntegrations] = useState({});
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [platformFilter, setPlatformFilter] = useState("all");
  const [range, setRange] = useState("30");
  const [refreshingId, setRefreshingId] = useState(null);
  const [publishingId, setPublishingId] = useState(null);
  const [editing, setEditing] = useState(null);
  const { toast } = useToast();

  const loadPosts = async () => {
    const data = await api.entities.SocialPost.list("-created_date", 300);
    setPosts(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadPosts();
    api.entities.SocialIntegration.list("platform", 10)
      .then((rows) => setIntegrations(Object.fromEntries((rows || []).map((row) => [row.platform, row]))))
      .catch(() => {});
    api.auth.me().then(setUser).catch(() => {});
  }, []);

  // Private posts stay visible to the person who wrote them only.
  const myPosts = useMemo(() => {
    const name = user?.full_name || user?.email;
    return posts.filter(
      (post) => post.audience !== "private" || post.created_by === user?.id || (name && post.posted_by === name)
    );
  }, [posts, user]);

  const visible = useMemo(() => {
    const since = range === "all" ? null : moment().subtract(Number(range) - 1, "days").startOf("day");
    return myPosts.filter((post) => {
      if (platformFilter !== "all" && post.platform !== platformFilter) return false;
      if (!since) return true;
      return moment(post.post_date || post.created_date).isSameOrAfter(since);
    });
  }, [myPosts, platformFilter, range]);

  const published = visible.filter((post) => post.status === "published");
  const totalReach = published.reduce((total, post) => total + (Number(post.insights?.reach) || 0), 0);
  const totalEngagement = published.reduce((total, post) => total + (Number(post.insights?.engagement) || 0), 0);
  const engagementRate = totalReach > 0 ? ((totalEngagement / totalReach) * 100).toFixed(1) : null;

  const today = moment().format("YYYY-MM-DD");
  const todaysPosts = myPosts.filter((post) => post.post_date === today);
  const requirements = [
    { label: "1 Car Post", met: todaysPosts.some((post) => post.post_type === "Car Post") },
    { label: "1 Reel/Video", met: todaysPosts.some((post) => post.post_type === "Reel/Video") },
    { label: "1 Story", met: todaysPosts.some((post) => post.post_type === "Story") },
  ];
  const allRequirementsMet = requirements.every((item) => item.met);

  const publish = async (post) => {
    setPublishingId(post.id);
    try {
      await api.functions.invoke("publishSocialPost", { post_id: post.id });
      toast({ title: `Published to ${PLATFORM_META[post.platform]?.label || post.platform}` });
    } catch (err) {
      toast({ title: "Publishing failed", description: err.message, variant: "destructive" });
    } finally {
      setPublishingId(null);
      loadPosts();
    }
  };

  const refreshInsights = async (postId) => {
    setRefreshingId(postId || "all");
    try {
      await api.functions.invoke("fetchPostInsights", postId ? { post_id: postId } : { limit: 50 });
      await loadPosts();
      if (!postId) toast({ title: "Insights synced from Meta" });
    } catch (err) {
      toast({ title: "Could not refresh insights", description: err.message, variant: "destructive" });
    } finally {
      setRefreshingId(null);
    }
  };

  const deletePost = async (id) => {
    await api.entities.SocialPost.delete(id);
    loadPosts();
  };

  const startEdit = (post) => {
    setEditing(post);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const updateThumbnail = async (post, file) => {
    try {
      const { file_url } = await api.integrations.Core.UploadFile({ file, bucket: "social-media" });
      await api.entities.SocialPost.update(post.id, { thumbnail_url: file_url });
      await loadPosts();
      toast({ title: post.thumbnail_url ? "Thumbnail updated" : "Thumbnail added" });
    } catch (err) {
      toast({ title: "Could not save the thumbnail", description: err.message, variant: "destructive" });
    }
  };

  const kpis = [
    { label: "Published", value: fmt(published.length), sub: "posts in range", icon: Send },
    { label: "Reach", value: fmt(totalReach), sub: "people reached", icon: Eye },
    { label: "Engagements", value: fmt(totalEngagement), sub: "likes, comments, shares", icon: Heart },
    { label: "Engagement rate", value: engagementRate != null ? `${engagementRate}%` : "—", sub: "of reach", icon: BarChart3 },
  ];

  return (
    <div>
      <div className="km-hero">
        <div>
          <h1 className="km-h1">Social Studio</h1>
          <div className="km-sub">Compose like Facebook, publish to your channels and watch every post perform.</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" className="km-chip" onClick={() => refreshInsights()} disabled={!!refreshingId}>
            {refreshingId === "all" ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> : <RefreshCcw style={{ width: 14, height: 14 }} />}
            Sync insights
          </button>
          {isAdminUser(user) && (
            <RouterLink to="/Integrations" className="km-chip">
              <Plug style={{ width: 14, height: 14 }} /> Integrations
            </RouterLink>
          )}
        </div>
      </div>

      <div className="sp-kpis">
        {kpis.map(({ label, value, sub, icon: Icon }) => (
          <GlassCard key={label} tight className="sp-kpi">
            <div className="sp-kpi-label">
              <Icon style={{ width: 12, height: 12 }} />
              {label}
            </div>
            <div className="sp-kpi-value">{value}</div>
            <div className="sp-kpi-sub">{sub}</div>
          </GlassCard>
        ))}
      </div>

      <div className="sp-grid">
        <div className="sp-stack">
          <PostComposer
            user={user}
            integrations={integrations}
            editingPost={editing}
            onCancelEdit={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              loadPosts();
            }}
          />

          <GlassCard tight>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              <button
                type="button"
                className={`sp-platform-chip ${platformFilter === "all" ? "active" : ""}`}
                onClick={() => setPlatformFilter("all")}
              >
                All platforms
              </button>
              {PLATFORMS.map((platform) => {
                const meta = PLATFORM_META[platform];
                const Icon = meta.icon;
                return (
                  <button
                    key={platform}
                    type="button"
                    className={`sp-platform-chip ${platformFilter === platform ? "active" : ""}`}
                    onClick={() => setPlatformFilter(platform)}
                  >
                    <Icon style={{ width: 13, height: 13, color: meta.color }} />
                    {meta.label}
                  </button>
                );
              })}
              <div className="sp-range">
                {RANGES.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`sp-range-btn ${range === option.value ? "active" : ""}`}
                    onClick={() => setRange(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </GlassCard>

          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 240 }}>
              <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-400 rounded-full animate-spin" />
            </div>
          ) : visible.length === 0 ? (
            <EmptyState icon={<Share2 style={{ width: 20, height: 20, strokeWidth: 1.6 }} />} message="No posts in this view yet — compose one above." />
          ) : (
            visible.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                refreshing={refreshingId === post.id}
                publishing={publishingId === post.id}
                onDelete={deletePost}
                onPublish={publish}
                onRefresh={refreshInsights}
                onThumbnail={updateThumbnail}
                onEdit={startEdit}
              />
            ))
          )}
        </div>

        <div className="sp-stack">
          <GlassCard>
            <div className="km-card-header">
              Channels
              {isAdminUser(user) && (
                <RouterLink to="/Integrations" className="km-chip" style={{ fontSize: 11, padding: "4px 9px" }}>
                  Manage
                </RouterLink>
              )}
            </div>
            <div className="sp-channels">
              {["facebook", "instagram", "tiktok"].map((key) => {
                const row = integrations[key];
                const status = row?.status || "inactive";
                const meta = Object.values(PLATFORM_META).find((item) => item.integration === key);
                const Icon = meta?.icon || Share2;
                return (
                  <div key={key} className="sp-channel">
                    <Icon style={{ width: 18, height: 18, color: meta?.color || "var(--ink)" }} />
                    <div>
                      <div className="sp-channel-name">{meta?.label || key}</div>
                      <div className="sp-channel-sub">
                        {status === "active" ? row?.account_name || "Connected" : status === "disabled" ? "Blocked" : "Not connected"}
                      </div>
                    </div>
                    <span className="sp-dot" style={{ background: INTEGRATION_DOT[status] }} />
                  </div>
                );
              })}
            </div>
            <div className="sp-note" style={{ marginTop: 10 }}>
              Facebook and Instagram publish straight from here. TikTok and WhatsApp are logged only.
            </div>
          </GlassCard>

          <GlassCard style={{ borderColor: allRequirementsMet ? "rgba(22,131,58,.3)" : "rgba(224,168,0,.3)" }}>
            <div className="km-card-header" style={{ color: allRequirementsMet ? "#16833a" : "var(--gold-deep)" }}>
              Daily targets
              <span className="sp-note">{moment().format("D MMM")}</span>
            </div>
            <div className="sp-channels">
              {requirements.map((item) => (
                <div key={item.label} className="sp-channel" style={{ padding: "9px 10px" }}>
                  {item.met
                    ? <Check style={{ width: 16, height: 16, color: "#22c55e" }} />
                    : <X style={{ width: 16, height: 16, color: "var(--gold-deep)" }} />}
                  <div className="sp-channel-name">{item.label}</div>
                </div>
              ))}
            </div>
            <div className="sp-note" style={{ marginTop: 8 }}>
              {allRequirementsMet ? "All targets met for today." : "Finish today's posting targets to keep the feed active."}
            </div>
          </GlassCard>

          <GlassCard>
            <div className="km-card-header" style={{ fontSize: 13 }}>Posting tips</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                "Lead with the vehicle and price in the headline.",
                "Add a photo — Instagram needs one to publish.",
                "Keep the CTA on so buyers know how to reach you.",
              ].map((tip) => (
                <div key={tip} style={{ display: "flex", gap: 8, fontSize: 11.5, color: "var(--mut)", lineHeight: 1.5 }}>
                  <Users style={{ width: 13, height: 13, flexShrink: 0, marginTop: 1, color: "var(--gold)" }} />
                  {tip}
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
