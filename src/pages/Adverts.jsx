import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, Eye, EyeOff, Upload, X, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const GOLD = "#C9A84C";

export default function Adverts() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm());
  const [uploading, setUploading] = useState(""); // "images" | "video" | ""

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
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading("images");
    const urls = [];
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      urls.push(file_url);
    }
    setForm(f => ({ ...f, images: [...(f.images || []), ...urls] }));
    setUploading("");
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading("video");
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, video_url: file_url }));
    setUploading("");
  };

  const removeImage = (idx) => setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));

  const handleSubmit = (e) => {
    e.preventDefault();
    createMut.mutate(form);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Vehicle Adverts</h1>
          <p className="text-white/40 text-sm mt-0.5">Manage adverts shown on the Client Portal</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2 text-black font-bold" style={{ background: GOLD }}>
          <Plus className="w-4 h-4" /> New Advert
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-2xl border p-6 mb-8 space-y-4" style={{ background: "#111", borderColor: "#C9A84C33" }}>
          <h2 className="text-white font-bold text-lg">Create Advert</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-white/40 block mb-1">Vehicle Title *</label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. 2019 VW Crafter 2.0 TDI LWB" required
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20" />
            </div>
            <div>
              <label className="text-xs text-white/40 block mb-1">Price (R)</label>
              <Input type="number" value={form.price || ""} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
                placeholder="749900" className="bg-white/5 border-white/10 text-white placeholder:text-white/20" />
            </div>
          </div>

          <div>
            <label className="text-xs text-white/40 block mb-1">Advert Description *</label>
            <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Full advert text with highlights, features, disclaimers..." required rows={8}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/20 resize-none" />
          </div>

          <div>
            <label className="text-xs text-white/40 block mb-1">WhatsApp Contact Number</label>
            <Input value={form.whatsapp_number || ""} onChange={e => setForm(f => ({ ...f, whatsapp_number: e.target.value }))}
              placeholder="27789657049" className="bg-white/5 border-white/10 text-white placeholder:text-white/20" />
          </div>

          {/* Media upload */}
          <div>
            <label className="text-xs text-white/40 block mb-2">Photos & Video</label>
            <div className="flex gap-3 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer w-fit px-4 py-2 rounded-lg border text-sm font-semibold transition-all hover:bg-white/5"
                style={{ borderColor: "#C9A84C44", color: GOLD }}>
                <Upload className="w-4 h-4" />
                {uploading === "images" ? "Uploading..." : "Upload Photos"}
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={!!uploading} />
              </label>
              <label className="flex items-center gap-2 cursor-pointer w-fit px-4 py-2 rounded-lg border text-sm font-semibold transition-all hover:bg-white/5"
                style={{ borderColor: "#3b82f644", color: "#3b82f6" }}>
                <Video className="w-4 h-4" />
                {uploading === "video" ? "Uploading..." : (form.video_url ? "Replace Video" : "Upload Video")}
                <input type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} disabled={!!uploading} />
              </label>
              {form.video_url && (
                <button type="button" onClick={() => setForm(f => ({ ...f, video_url: "" }))}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs text-red-400 border border-red-500/30 hover:bg-red-500/10">
                  <X className="w-3 h-3" /> Remove Video
                </button>
              )}
            </div>
            {form.video_url && (
              <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
                <Video className="w-3 h-3" /> Video uploaded ✓
              </p>
            )}
            {form.images?.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-3">
                {form.images.map((url, i) => (
                  <div key={i} className="relative w-24 h-20 rounded-lg overflow-hidden border" style={{ borderColor: "#C9A84C33" }}>
                    <img src={url} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center hover:bg-red-600">
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <input type="checkbox" id="finance" checked={form.finance_available}
              onChange={e => setForm(f => ({ ...f, finance_available: e.target.checked }))}
              className="w-4 h-4 accent-amber-500" />
            <label htmlFor="finance" className="text-sm text-white/60">Finance Available</label>

            <input type="checkbox" id="published" checked={form.is_published}
              onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))}
              className="w-4 h-4 accent-amber-500 ml-4" />
            <label htmlFor="published" className="text-sm text-white/60">Publish immediately</label>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => { setShowForm(false); setForm(defaultForm()); }}
              className="border-white/20 text-white/60 hover:bg-white/5">Cancel</Button>
            <Button type="submit" disabled={createMut.isPending} className="text-black font-bold" style={{ background: GOLD }}>
              {createMut.isPending ? "Saving..." : "Create Advert"}
            </Button>
          </div>
        </form>
      )}

      {/* Adverts list */}
      {adverts.length === 0 ? (
        <div className="text-center py-20 text-white/30">
          <Plus className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No adverts yet. Create your first one above.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {adverts.map(ad => (
            <div key={ad.id} className="rounded-xl border p-4 flex gap-4" style={{ background: "#ffffff06", borderColor: ad.is_published ? "#C9A84C33" : "#ffffff10" }}>
              {ad.images?.[0] && (
                <img src={ad.images[0]} className="w-32 h-24 object-cover rounded-lg flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <p className="text-white font-bold">{ad.title}</p>
                    {ad.price && <p className="font-bold text-sm" style={{ color: GOLD }}>R {ad.price.toLocaleString()}</p>}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {ad.video_url && <span className="px-2 py-0.5 rounded text-xs" style={{ background: "#3b82f620", color: "#3b82f6" }}><Video className="w-3 h-3 inline mr-1" />Video</span>}
                    <span className="px-2 py-0.5 rounded text-xs" style={{ background: ad.is_published ? "#22c55e20" : "#ffffff10", color: ad.is_published ? "#22c55e" : "#ffffff40" }}>
                      {ad.is_published ? "Published" : "Draft"}
                    </span>
                  </div>
                </div>
                <p className="text-white/40 text-xs mt-1 line-clamp-2">{ad.description}</p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" onClick={() => toggleMut.mutate({ id: ad.id, val: !ad.is_published })}
                    className="gap-1 border-white/20 text-white/60 hover:bg-white/5 text-xs">
                    {ad.is_published ? <><EyeOff className="w-3 h-3" /> Unpublish</> : <><Eye className="w-3 h-3" /> Publish</>}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { if (confirm("Delete this advert?")) deleteMut.mutate(ad.id); }}
                    className="gap-1 border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs">
                    <Trash2 className="w-3 h-3" /> Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function defaultForm() {
  return { title: "", description: "", price: "", images: [], video_url: "", whatsapp_number: "27789657049", finance_available: true, is_published: true };
}