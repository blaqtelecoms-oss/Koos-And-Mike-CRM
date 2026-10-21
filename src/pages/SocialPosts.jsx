import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Share2, Link, MessageSquare, Check, X, Calendar, Filter } from "lucide-react";
import moment from "moment";

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
    setPosts(data);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await base44.entities.SocialPost.create(form);
    setShowForm(false);
    resetForm();
    loadPosts();
  };

  const resetForm = () => setForm({ post_date: filterDate, platform: "Facebook Page", post_type: "Car Post", vehicle_featured: "", includes_website_link: true, includes_cta: true, posted_by: "" });

  const deletePost = async (id) => {
    await base44.entities.SocialPost.delete(id);
    loadPosts();
  };

  const getPlatformIcon = (p) => ({ "Facebook Page": "📘", "Facebook Groups": "👥", "Instagram": "📸", "TikTok": "🎵", "WhatsApp Status": "💬" }[p] || "📱");

  const getPlatformColor = (p) => ({
    "Facebook Page": "bg-blue-100 text-blue-700 border-blue-200",
    "Facebook Groups": "bg-indigo-100 text-indigo-700 border-indigo-200",
    "Instagram": "bg-pink-100 text-pink-700 border-pink-200",
    "TikTok": "bg-slate-900 text-white border-slate-800",
    "WhatsApp Status": "bg-green-100 text-green-700 border-green-200"
  }[p] || "bg-slate-100 text-slate-700 border-slate-200");

  const getPostTypeColor = (t) => ({ "Car Post": "bg-amber-100 text-amber-800", "Reel/Video": "bg-purple-100 text-purple-700", "Story": "bg-cyan-100 text-cyan-700" }[t] || "bg-slate-100 text-slate-700");

  const dailyRequirements = {
    carPosts: posts.filter(p => p.post_type === "Car Post").length >= 1,
    reels: posts.filter(p => p.post_type === "Reel/Video").length >= 1,
    stories: posts.filter(p => p.post_type === "Story").length >= 1
  };
  const allRequirementsMet = dailyRequirements.carPosts && dailyRequirements.reels && dailyRequirements.stories;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Social Media Posts</h1>
          <p className="text-white/60 mt-1">Track daily content across platforms</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="bg-amber-600 hover:bg-amber-700 text-black font-semibold">
          <Plus className="w-4 h-4 mr-2" /> Log Post
        </Button>
      </div>

      <Card className={`border shadow-none ${allRequirementsMet ? 'bg-emerald-900/20 border-emerald-600/30' : 'bg-amber-900/20 border-amber-600/30'}`}>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className={`font-semibold ${allRequirementsMet ? 'text-emerald-400' : 'text-amber-400'}`}>
                Daily Requirements for {moment(filterDate).format("MMMM D")}
              </h3>
              <p className={`text-sm ${allRequirementsMet ? 'text-emerald-300/70' : 'text-amber-300/70'}`}>
                {allRequirementsMet ? "All requirements met! Great job! 🎉" : "Complete your daily posting targets"}
              </p>
            </div>
            <div className="flex gap-4">
              {[["1 Car Post", dailyRequirements.carPosts], ["1 Reel/Video", dailyRequirements.reels], ["1 Story", dailyRequirements.stories]].map(([label, met]) => (
                <div key={label} className="flex items-center gap-2">
                  {met ? <Check className="w-5 h-5 text-emerald-400" /> : <X className="w-5 h-5 text-amber-400" />}
                  <span className="text-sm font-medium text-white">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-white/10 bg-white/5 shadow-none">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-white/40" />
              <Input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="w-40 bg-white/5 border-white/10 text-white" />
            </div>
            <Select value={filterPlatform} onValueChange={setFilterPlatform}>
              <SelectTrigger className="w-48 bg-white/5 border-white/10 text-white">
                <Filter className="w-4 h-4 mr-2" /><SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                {PLATFORMS.map(p => <SelectItem key={p} value={p}>{getPlatformIcon(p)} {p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {posts.map((post) => (
          <Card key={post.id} className="border border-white/10 bg-white/5 shadow-none">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getPlatformIcon(post.platform)}</span>
                  <div>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${getPlatformColor(post.platform)}`}>{post.platform}</span>
                    <span className={`ml-2 inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getPostTypeColor(post.post_type)}`}>{post.post_type}</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-white/30 hover:text-red-400 h-8 w-8 p-0" onClick={() => deletePost(post.id)}>×</Button>
              </div>
              {post.vehicle_featured && (
                <p className="text-sm text-white/70 mb-3"><span className="text-white/40">Vehicle:</span> {post.vehicle_featured}</p>
              )}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  {post.includes_website_link ? <Check className="w-4 h-4 text-green-400" /> : <X className="w-4 h-4 text-red-400" />}
                  <span className="text-white/60">Website Link</span>
                </div>
                <div className="flex items-center gap-1">
                  {post.includes_cta ? <Check className="w-4 h-4 text-green-400" /> : <X className="w-4 h-4 text-red-400" />}
                  <span className="text-white/60">Contact CTA</span>
                </div>
              </div>
              {post.posted_by && (
                <p className="mt-3 pt-3 border-t border-white/10 text-xs text-white/40">Posted by: {post.posted_by}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {posts.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <Share2 className="w-8 h-8 text-white/30" />
          </div>
          <h3 className="text-lg font-medium text-white">No posts logged for this date</h3>
          <p className="text-white/50">Log your social media posts to track your progress</p>
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Log Social Media Post</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date</Label>
                <Input type="date" value={form.post_date} onChange={(e) => setForm({...form, post_date: e.target.value})} />
              </div>
              <div>
                <Label>Platform</Label>
                <Select value={form.platform} onValueChange={(v) => setForm({...form, platform: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PLATFORMS.map(p => <SelectItem key={p} value={p}>{getPlatformIcon(p)} {p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Post Type</Label>
                <Select value={form.post_type} onValueChange={(v) => setForm({...form, post_type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{POST_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Posted By</Label>
                <Input value={form.posted_by} onChange={(e) => setForm({...form, posted_by: e.target.value})} placeholder="Your name" />
              </div>
              <div className="col-span-2">
                <Label>Vehicle Featured (if applicable)</Label>
                <Input value={form.vehicle_featured} onChange={(e) => setForm({...form, vehicle_featured: e.target.value})} placeholder="2020 Toyota Hilux" />
              </div>
            </div>
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center gap-2">
                  <Link className="w-4 h-4 text-white/40" />
                  <Label className="font-normal text-white/70">Includes website link</Label>
                </div>
                <Switch checked={form.includes_website_link} onCheckedChange={(v) => setForm({...form, includes_website_link: v})} />
              </div>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-white/40" />
                  <Label className="font-normal text-white/70">Includes contact CTA</Label>
                </div>
                <Switch checked={form.includes_cta} onCheckedChange={(v) => setForm({...form, includes_cta: v})} />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
              <Button type="submit" className="flex-1 bg-amber-600 hover:bg-amber-700 text-black font-semibold">Log Post</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}