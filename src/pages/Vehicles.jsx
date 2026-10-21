import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Search, Car, Edit, Trash2, Upload, ExternalLink, Filter } from "lucide-react";
import GlassCard from "@/components/premium/GlassCard";
import StatusPill from "@/components/premium/StatusPill";
import EmptyState from "@/components/premium/EmptyState";

const STANDS = ["Stand 1", "Stand 2", "Stand 3", "Detailing Workshop", "Dekra"];
const STATUSES = ["Available", "Reserved", "Sold"];

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterStand, setFilterStand] = useState("all");
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ title: "", make: "", model: "", year: "", mileage: "", price: "", stand: "Stand 1", description: "", status: "Available", uploaded_to_website: false, finance_available: true, images: [] });

  useEffect(() => { loadVehicles(); }, []);

  const loadVehicles = async () => { const data = await base44.entities.Vehicle.list("-created_date", 500); setVehicles(data); setLoading(false); };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files); if (!files.length) return; setUploading(true);
    const newImages = [];
    for (const file of files) { const { file_url } = await base44.integrations.Core.UploadFile({ file }); newImages.push(file_url); }
    setForm({ ...form, images: [...form.images, ...newImages] }); setUploading(false);
  };
  const removeImage = (index) => setForm({ ...form, images: form.images.filter((_, i) => i !== index) });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, year: form.year ? Number(form.year) : null, mileage: form.mileage ? Number(form.mileage) : null, price: form.price ? Number(form.price) : null };
    if (editingVehicle) await base44.entities.Vehicle.update(editingVehicle.id, payload);
    else await base44.entities.Vehicle.create(payload);
    setShowForm(false); setEditingVehicle(null); resetForm(); loadVehicles();
  };
  const resetForm = () => setForm({ title: "", make: "", model: "", year: "", mileage: "", price: "", stand: "Stand 1", description: "", status: "Available", uploaded_to_website: false, finance_available: true, images: [] });
  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle);
    setForm({ title: vehicle.title || "", make: vehicle.make || "", model: vehicle.model || "", year: vehicle.year?.toString() || "", mileage: vehicle.mileage?.toString() || "", price: vehicle.price?.toString() || "", stand: vehicle.stand || "Stand 1", description: vehicle.description || "", status: vehicle.status || "Available", uploaded_to_website: vehicle.uploaded_to_website || false, finance_available: vehicle.finance_available !== false, images: vehicle.images || [] });
    setShowForm(true);
  };
  const handleDelete = async (id) => { if (confirm("Are you sure you want to delete this vehicle?")) { await base44.entities.Vehicle.delete(id); loadVehicles(); } };

  const filteredVehicles = vehicles.filter(v => {
    const ms = v.title?.toLowerCase().includes(search.toLowerCase()) || v.make?.toLowerCase().includes(search.toLowerCase()) || v.model?.toLowerCase().includes(search.toLowerCase());
    const mst = filterStatus === "all" || v.status === filterStatus;
    const msp = filterStand === "all" || v.stand === filterStand;
    return ms && mst && msp;
  });

  const formatPrice = (price) => price ? `R ${price.toLocaleString()}` : "Price on Request";

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 400 }}><div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-400 rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="km-hero">
        <div>
          <h1 className="km-h1">Vehicles</h1>
          <div className="km-sub">{vehicles.filter(v => v.status === "Available").length} vehicles available</div>
        </div>
        <button className="km-btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus style={{ width: 16, height: 16 }} /> Add Vehicle
        </button>
      </div>

      {/* Filters */}
      <GlassCard style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span className={`km-chip ${filterStatus === "all" ? "active" : ""}`} onClick={() => setFilterStatus("all")}>All · {vehicles.length}</span>
          {STATUSES.map(s => <span key={s} className={`km-chip ${filterStatus === s ? "active" : ""}`} onClick={() => setFilterStatus(s)}>{s}</span>)}
          <div style={{ position: "relative", flex: 1, minWidth: 180, marginLeft: "auto" }}>
            <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "var(--mut)" }} />
            <Input placeholder="Search by make, model, or title…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 36, background: "var(--glass)", border: "1px solid var(--glass-border)", borderRadius: 30, height: 40 }} />
          </div>
          <Select value={filterStand} onValueChange={setFilterStand}>
            <SelectTrigger style={{ width: 140, background: "var(--glass)", border: "1px solid var(--glass-border)", borderRadius: 30, height: 40 }}><SelectValue placeholder="Stand" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Stands</SelectItem>{STANDS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </GlassCard>

      {/* Vehicle grid */}
      <div className="km-vehicle-grid">
        {filteredVehicles.map(vehicle => (
          <GlassCard key={vehicle.id} tight>
            <div style={{ aspectRatio: "16/10", borderRadius: 16, overflow: "hidden", position: "relative", background: "rgba(0,0,0,.05)" }}>
              {vehicle.images?.length > 0 ? (
                vehicle.website_slug ? (
                  <a href={`https://www.koosandmike.co.za/vehicle/${vehicle.website_slug}`} target="_blank" rel="noreferrer" className="block w-full h-full group">
                    <img src={vehicle.images[0]} alt={vehicle.title} className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><ExternalLink style={{ width: 32, height: 32, color: "#fff" }} /></div>
                  </a>
                ) : <img src={vehicle.images[0]} alt={vehicle.title} className="w-full h-full object-cover" />
              ) : <div className="w-full h-full flex items-center justify-center"><Car style={{ width: 48, height: 48, color: "var(--mut)", opacity: 0.3 }} /></div>}
              <div style={{ position: "absolute", top: 8, right: 8 }}><StatusPill status={vehicle.status} /></div>
            </div>
            <div style={{ paddingTop: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontWeight: 600, color: "var(--ink)", fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{vehicle.title}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "var(--gold-deep)" }}>{formatPrice(vehicle.price)}</div>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button onClick={() => handleEdit(vehicle)} style={{ background: "none", border: 0, cursor: "pointer", color: "var(--mut)", padding: 4 }}><Edit style={{ width: 16, height: 16 }} /></button>
                  <button onClick={() => handleDelete(vehicle.id)} style={{ background: "none", border: 0, cursor: "pointer", color: "var(--mut)", padding: 4 }}><Trash2 style={{ width: 16, height: 16 }} /></button>
                </div>
              </div>
              <div style={{ fontSize: 12, color: "var(--mut)", marginTop: 8 }}>
                {vehicle.stand && <span>Stand: {vehicle.stand}</span>}
                {vehicle.mileage && <span> · {vehicle.mileage.toLocaleString()} km</span>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--line)" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: vehicle.uploaded_to_website ? "var(--gold)" : "var(--mut)", opacity: vehicle.uploaded_to_website ? 1 : 0.3 }} />
                <span style={{ fontSize: 11, color: "var(--mut)" }}>{vehicle.uploaded_to_website ? "On Website" : "Not Uploaded"}</span>
                {vehicle.finance_available && <span style={{ fontSize: 11, color: "var(--gold-deep)" }}>· Finance Available</span>}
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {filteredVehicles.length === 0 && (
        <EmptyState icon={<Car style={{ width: 20, height: 20, strokeWidth: 1.6 }} />} message="No vehicles found. Try adjusting your search or filters." actionLabel="Add Vehicle" onAction={() => { resetForm(); setShowForm(true); }} />
      )}

      <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) { setEditingVehicle(null); resetForm(); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingVehicle ? "Edit Vehicle" : "Add New Vehicle"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Photos (8-15 recommended)</Label>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {form.images.map((img, idx) => (
                  <div key={idx} className="relative aspect-square bg-slate-100 rounded-lg overflow-hidden">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600">×</button>
                  </div>
                ))}
                <label className="aspect-square border-2 border-dashed border-amber-600/40 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-amber-500 transition-colors">
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={uploading} />
                  {uploading ? <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500" /> : <><Upload className="w-6 h-6 text-amber-500/60" /><span className="text-xs text-white/40 mt-1">Upload</span></>}
                </label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><Label>Title (Year | Make | Model | Mileage) *</Label><Input required value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} placeholder="2020 | Toyota | Hilux | 45000km" /></div>
              <div><Label>Make *</Label><Input required value={form.make} onChange={(e) => setForm({...form, make: e.target.value})} placeholder="Toyota" /></div>
              <div><Label>Model *</Label><Input required value={form.model} onChange={(e) => setForm({...form, model: e.target.value})} placeholder="Hilux" /></div>
              <div><Label>Year</Label><Input type="number" value={form.year} onChange={(e) => setForm({...form, year: e.target.value})} placeholder="2020" /></div>
              <div><Label>Mileage (km)</Label><Input type="number" value={form.mileage} onChange={(e) => setForm({...form, mileage: e.target.value})} placeholder="45000" /></div>
              <div><Label>Price (R)</Label><Input type="number" value={form.price} onChange={(e) => setForm({...form, price: e.target.value})} placeholder="350000" /></div>
              <div><Label>Stand *</Label><Select value={form.stand} onValueChange={(v) => setForm({...form, stand: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STANDS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Status</Label><Select value={form.status} onValueChange={(v) => setForm({...form, status: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
              <div className="flex items-center gap-2"><Switch checked={form.uploaded_to_website} onCheckedChange={(v) => setForm({...form, uploaded_to_website: v})} /><Label>Uploaded to Website</Label></div>
              <div className="flex items-center gap-2"><Switch checked={form.finance_available} onCheckedChange={(v) => setForm({...form, finance_available: v})} /><Label>Finance Available</Label></div>
              <div className="col-span-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} placeholder="Write a unique description for this vehicle..." rows={4} /></div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
              <Button type="submit" className="flex-1 bg-amber-600 hover:bg-amber-700 text-black font-semibold">{editingVehicle ? "Save Changes" : "Add Vehicle"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
