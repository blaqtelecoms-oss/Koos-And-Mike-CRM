import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Eye, EyeOff, Upload, X, Video, Megaphone } from "lucide-react";
import GlassCard from "@/components/premium/GlassCard";
import StatusPill from "@/components/premium/StatusPill";
import EmptyState from "@/components/premium/EmptyState";

const GOLD = "#ff9d00";

export default function Adverts() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm());
  const [uploading, setUploading] = useState("");

  const { data: adverts = [] } = useQuery({
    queryKey: ["adverts"],
    queryFn: () => base44.entities.Advert.list("-created_date", 100),
  });

  const createMut = useMutation({
    mutationFn: (data) => base44.entities.Advert.create(data),
    onSuccess: () => { qc.invalidateQueries(["adverts"]); setShowForm(false); setForm(defaultForm()); },
  });
  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.Advert.delete(id),
    onSuccess: () => qc.invalidateQueries(["adverts"]),
  });
  const toggleMut = useMutation({
    mutationFn: ({ id, val }) => base44.entities.Advert.update(id, { is_published: val }),
    onSuccess: () => qc.invalidateQueries(["adverts"]),
  });

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files); if (!files.length) return; setUploading("images");
    const urls = [];
    for (const file of files) { const { file_url } = await base44.integrations.Core.UploadFile({ file }); urls.push(file_url); }
    setForm(f => ({ ...f, images: [...(f.images || []), ...urls] })); setUploading("");
  };
  const handleVideoUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return; setUploading("video");
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, video_url: file_url })); setUploading("");
  };
  const removeImage = (idx) => setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));

  const handleSubmit = (e) => { e.preventDefault(); createMut.mutate(form); };

  return (
    <div>
      <div className="km-hero">
        <div>
          <h1 className="km-h1">Adverts</h1>
          <div className="km-sub">Manage adverts shown on the Client Portal</div>
        </div>
        <button className="km-btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus style={{ width: 16, height: 16 }} /> New Advert
        </button>
      </div>

      {showForm && (
        <GlassCard style={{ marginBottom: 14 }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ fontWeight: 500, color: "var(--ink)", fontSize: 16 }}>Create Advert</div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={{ fontSize: 12, color: "var(--mut)", display: "block", marginBottom: 4 }}>Vehicle Title *</label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. 2019 VW Crafter 2.0 TDI LWB" required />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "var(--mut)", display: "block", marginBottom: 4 }}>Price (R)</label>
                <Input type="number" value={form.price || ""} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} placeholder="749900" />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, color: "var(--mut)", display: "block", marginBottom: 4 }}>Advert Description *</label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Full advert text with highlights, features, disclaimers..." required rows={6} className="resize-none" />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "var(--mut)", display: "block", marginBottom: 4 }}>WhatsApp Contact Number</label>
              <Input value={form.whatsapp_number || ""} onChange={e => setForm(f => ({ ...f, whatsapp_number: e.target.value }))} placeholder="27789657049" />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "var(--mut)", display: "block", marginBottom: 8 }}>Photos & Video</label>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <label className="flex items-center gap-2 cursor-pointer w-fit px-4 py-2 rounded-lg border text-sm font-semibold transition-all hover:bg-white/5" style={{ borderColor: "rgba(255,157,0,.3)", color: GOLD }}>
                  <Upload className="w-4 h-4" />
                  {uploading === "images" ? "Uploading..." : "Upload Photos"}
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={!!uploading} />
                </label>
                <label className="flex items-center gap-2 cursor-pointer w-fit px-4 py-2 rounded-lg border text-sm font-semibold transition-all hover:bg-white/5" style={{ borderColor: "rgba(59,130,246,.3)", color: "#3b82f6" }}>
                  <Video className="w-4 h-4" />
                  {uploading === "video" ? "Uploading..." : (form.video_url ? "Replace Video" : "Upload Video")}
                  <input type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} disabled={!!uploading} />
                </label>
                {form.video_url && <button type="button" onClick={() => setForm(f => ({ ...f, video_url: "" }))} className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs text-red-400 border border-red-500/30 hover:bg-red-500/10"><X className="w-3 h-3" /> Remove Video</button>}
              </div>
              {form.images?.length > 0 && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                  {form.images.map((url, i) => (
                    <div key={i} className="relative w-24 h-20 rounded-lg overflow-hidden border" style={{ borderColor: "rgba(255,157,0,.2)" }}>
                      <img src={url} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white/10 flex items-center justify-center hover:bg-red-600"><X className="w-3 h-3 text-white" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "var(--mut)" }}>
                <input type="checkbox" checked={form.finance_available} onChange={e => setForm(f => ({ ...f, finance_available: e.target.checked }))} className="w-4 h-4 accent-amber-500" /> Finance Available
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "var(--mut)" }}>
                <input type="checkbox" checked={form.is_published} onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))} className="w-4 h-4 accent-amber-500" /> Publish immediately
              </label>
            </div>
            <div style={{ display: "flex", gap: 10, paddingTop: 8 }}>
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setForm(defaultForm()); }} className="hover:bg-white/5">Cancel</Button>
              <Button type="submit" disabled={createMut.isPending} className="text-black font-bold border-0" style={{ background: GOLD }}>{createMut.isPending ? "Saving..." : "Create Advert"}</Button>
            </div>
          </form>
        </GlassCard>
      )}

      {adverts.length === 0 ? (
        <EmptyState icon={<Megaphone style={{ width: 20, height: 20, strokeWidth: 1.6 }} />} message="No adverts yet. Create your first one." actionLabel="New Advert" onAction={() => setShowForm(true)} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {adverts.map(ad => (
            <GlassCard key={ad.id} tight>
              <div style={{ display: "flex", gap: 14 }}>
                {ad.images?.[0] && <img src={ad.images[0]} className="w-32 h-24 object-cover rounded-lg flex-shrink-0" />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontWeight: 600, color: "var(--ink)" }}>{ad.title}</div>
                      {ad.price && <div style={{ fontWeight: 600, fontSize: 14, color: "var(--gold-deep)" }}>R {ad.price.toLocaleString()}</div>}
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {ad.video_url && <span className="km-chip" style={{ fontSize: 10, padding: "3px 8px" }}><Video style={{ width: 12, height: 12, display: "inline" }} /> Video</span>}
                      <StatusPill status={ad.is_published ? "Published" : "Draft"} />
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--mut)", marginTop: 4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{ad.description}</div>
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <Button size="sm" variant="outline" onClick={() => toggleMut.mutate({ id: ad.id, val: !ad.is_published })} className="gap-1 text-xs" style={{ borderColor: "var(--glass-border)", color: "var(--ink)" }}>
                      {ad.is_published ? <><EyeOff style={{ width: 14, height: 14 }} /> Unpublish</> : <><Eye style={{ width: 14, height: 14 }} /> Publish</>}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { if (confirm("Delete this advert?")) deleteMut.mutate(ad.id); }} className="gap-1 border-red-500/30 text-red-500 hover:bg-red-500/10 text-xs">
                      <Trash2 style={{ width: 14, height: 14 }} /> Delete
                    </Button>
                  </div>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}

function defaultForm() {
  return { title: "", description: "", price: "", images: [], video_url: "", whatsapp_number: "27789657049", finance_available: true, is_published: true };
}
