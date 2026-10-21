import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Share2, Link, MessageSquare, Check, X, Calendar, Filter } from "lucide-react";
import moment from "moment";
import GlassCard from "@/components/premium/GlassCard";
import StatusPill from "@/components/premium/StatusPill";
import EmptyState from "@/components/premium/EmptyState";

const PLATFORMS = ["Facebook Page", "Facebook Groups", "Instagram", "TikTok", "WhatsApp Status"];
const POST_TYPES = ["Car Post", "Reel/Video", "Story"];

export default function SocialPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterPlatform, setFilterPlatform] = useState("all");
  const [filterDate, setFilterDate] = useState(moment().format("YYYY-MM-DD"));
  const [form, setForm] = useState({ post_date: moment().format("YYYY-MM-DD"), platform: "Facebook Page", post_type: "Car Post", vehicle_featured: "", includes_website_link: true, includes_cta: true, posted_by: "" });

  useEffect(() => { loadPosts(); }, [filterDate, filterPlatform]);

  const loadPosts = async () => {
    setLoading(true);
    const filter = filterPlatform === "all" ? { post_date: filterDate } : { post_date: filterDate, platform: filterPlatform };
    const data = await base44.entities.SocialPost.filter(filter, "-created_date", 100);
    setPosts(data); setLoading(false);
  };

  const handleSubmit = async (e) => { e.preventDefault(); await base44.entities.SocialPost.create(form); setShowForm(false); resetForm(); loadPosts(); };
  const resetForm = () => setForm({ post_date: filterDate, platform: "Facebook Page", post_type: "Car Post", vehicle_featured: "", includes_website_link: true, includes_cta: true, posted_by: "" });
  const deletePost = async (id) => { await base44.entities.SocialPost.delete(id); loadPosts(); };

  const dailyRequirements = {
    carPosts: posts.filter(p => p.post_type === "Car Post").length >= 1,
    reels: posts.filter(p => p.post_type === "Reel/Video").length >= 1,
    stories: posts.filter(p => p.post_type === "Story").length >= 1
  };
  const allRequirementsMet = dailyRequirements.carPosts && dailyRequirements.reels && dailyRequirements.stories;

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 400 }}><div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-400 rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="km-hero">
        <div>
          <h1 className="km-h1">Social Posts</h1>
          <div className="km-sub">Track daily content across platforms</div>
        </div>
        <button className="km-btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus style={{ width: 16, height: 16 }} /> Log Post
        </button>
      </div>

      {/* Daily requirements */}
      <GlassCard style={{ marginBottom: 14, borderColor: allRequirementsMet ? "rgba(22,131,58,.3)" : "rgba(224,168,0,.3)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontWeight: 500, color: allRequirementsMet ? "#16833a" : "var(--gold-deep)" }}>
              Daily Requirements for {moment(filterDate).format("MMMM D")}
            </div>
            <div style={{ fontSize: 12, color: "var(--mut)" }}>{allRequirementsMet ? "All requirements met!" : "Complete your daily posting targets"}</div>
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            {[["1 Car Post", dailyRequirements.carPosts], ["1 Reel/Video", dailyRequirements.reels], ["1 Story", dailyRequirements.stories]].map(([label, met]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {met ? <Check style={{ width: 18, height: 18, color: "#16833a" }} /> : <X style={{ width: 18, height: 18, color: "var(--gold-deep)" }} />}
                <span style={{ fontSize: 12, fontWeight: 500, color: "var(--ink)" }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Filters */}
      <GlassCard style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <Calendar style={{ width: 18, height: 18, color: "var(--mut)" }} />
          <Input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} style={{ width: 160, background: "var(--glass)", border: "1px solid var(--glass-border)", borderRadius: 30, height: 40 }} />
          <span className="km-chip" style={{ marginLeft: "auto" }}>
            <Filter style={{ width: 14, height: 14 }} />
          </span>
          <Select value={filterPlatform} onValueChange={setFilterPlatform}>
            <SelectTrigger style={{ width: 180, background: "var(--glass)", border: "1px solid var(--glass-border)", borderRadius: 30, height: 40 }}><SelectValue placeholder="Platform" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Platforms</SelectItem>{PLATFORMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </GlassCard>

      {/* Posts grid */}
      {posts.length === 0 ? (
        <EmptyState icon={<Share2 style={{ width: 20, height: 20, strokeWidth: 1.6 }} />} message="No posts logged for this date." actionLabel="Log Post" onAction={() => { resetForm(); setShowForm(true); }} />
      ) : (
        <div className="km-vehicle-grid">
          {posts.map(post => (
            <GlassCard key={post.id} tight>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <StatusPill status={post.platform} />
                  <span className="km-chip" style={{ fontSize: 11, padding: "3px 8px" }}>{post.post_type}</span>
                </div>
                <button onClick={() => deletePost(post.id)} style={{ background: "none", border: 0, cursor: "pointer", color: "var(--mut)", fontSize: 16, padding: 0, lineHeight: 1 }}>×</button>
              </div>
              {post.vehicle_featured && <div style={{ fontSize: 12, color: "var(--mut)", marginBottom: 10 }}>Vehicle: {post.vehicle_featured}</div>}
              <div style={{ display: "flex", gap: 16, fontSize: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {post.includes_website_link ? <Check style={{ width: 16, height: 16, color: "#16833a" }} /> : <X style={{ width: 16, height: 16, color: "#e5484d" }} />}
                  <span style={{ color: "var(--mut)" }}>Website Link</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {post.includes_cta ? <Check style={{ width: 16, height: 16, color: "#16833a" }} /> : <X style={{ width: 16, height: 16, color: "#e5484d" }} />}
                  <span style={{ color: "var(--mut)" }}>Contact CTA</span>
                </div>
              </div>
              {post.posted_by && <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--line)", fontSize: 11, color: "var(--mut)" }}>Posted by: {post.posted_by}</div>}
            </GlassCard>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Log Social Media Post</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Date</Label><Input type="date" value={form.post_date} onChange={(e) => setForm({...form, post_date: e.target.value})} /></div>
              <div><Label>Platform</Label><Select value={form.platform} onValueChange={(v) => setForm({...form, platform: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PLATFORMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Post Type</Label><Select value={form.post_type} onValueChange={(v) => setForm({...form, post_type: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{POST_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Posted By</Label><Input value={form.posted_by} onChange={(e) => setForm({...form, posted_by: e.target.value})} placeholder="Your name" /></div>
              <div className="col-span-2"><Label>Vehicle Featured (if applicable)</Label><Input value={form.vehicle_featured} onChange={(e) => setForm({...form, vehicle_featured: e.target.value})} placeholder="2020 Toyota Hilux" /></div>
            </div>
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--glass)" }}>
                <div className="flex items-center gap-2"><Link className="w-4 h-4" style={{ color: "var(--mut)" }} /><Label className="font-normal">Includes website link</Label></div>
                <Switch checked={form.includes_website_link} onCheckedChange={(v) => setForm({...form, includes_website_link: v})} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--glass)" }}>
                <div className="flex items-center gap-2"><MessageSquare className="w-4 h-4" style={{ color: "var(--mut)" }} /><Label className="font-normal">Includes contact CTA</Label></div>
                <Switch checked={form.includes_cta} onCheckedChange={(v) => setForm({...form, includes_cta: v})} />
              </div>
            </div>
            <div className="flex gap-3 pt-4"><Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button><Button type="submit" className="flex-1 bg-amber-600 hover:bg-amber-700 text-black font-semibold">Log Post</Button></div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
