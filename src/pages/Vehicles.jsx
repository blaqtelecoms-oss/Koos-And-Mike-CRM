import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Search, Car, Filter, Edit, Trash2, Upload, ExternalLink } from "lucide-react";

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
  const [form, setForm] = useState({
    title: "", make: "", model: "", year: "", mileage: "", price: "",
    stand: "Stand 1", description: "", status: "Available",
    uploaded_to_website: false, finance_available: true, images: []
  });

  useEffect(() => { loadVehicles(); }, []);

  const loadVehicles = async () => {
    const data = await base44.entities.Vehicle.list("-created_date", 500);
    setVehicles(data);
    setLoading(false);
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    const newImages = [];
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      newImages.push(file_url);
    }
    setForm({ ...form, images: [...form.images, ...newImages] });
    setUploading(false);
  };

  const removeImage = (index) => setForm({ ...form, images: form.images.filter((_, i) => i !== index) });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, year: form.year ? Number(form.year) : null, mileage: form.mileage ? Number(form.mileage) : null, price: form.price ? Number(form.price) : null };
    if (editingVehicle) {
      await base44.entities.Vehicle.update(editingVehicle.id, payload);
    } else {
      await base44.entities.Vehicle.create(payload);
    }
    setShowForm(false); setEditingVehicle(null); resetForm(); loadVehicles();
  };

  const resetForm = () => setForm({ title: "", make: "", model: "", year: "", mileage: "", price: "", stand: "Stand 1", description: "", status: "Available", uploaded_to_website: false, finance_available: true, images: [] });

  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle);
    setForm({
      title: vehicle.title || "", make: vehicle.make || "", model: vehicle.model || "",
      year: vehicle.year?.toString() || "", mileage: vehicle.mileage?.toString() || "",
      price: vehicle.price?.toString() || "", stand: vehicle.stand || "Stand 1",
      description: vehicle.description || "", status: vehicle.status || "Available",
      uploaded_to_website: vehicle.uploaded_to_website || false,
      finance_available: vehicle.finance_available !== false, images: vehicle.images || []
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this vehicle?")) {
      await base44.entities.Vehicle.delete(id);
      loadVehicles();
    }
  };

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = vehicle.title?.toLowerCase().includes(search.toLowerCase()) || vehicle.make?.toLowerCase().includes(search.toLowerCase()) || vehicle.model?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "all" || vehicle.status === filterStatus;
    const matchesStand = filterStand === "all" || vehicle.stand === filterStand;
    return matchesSearch && matchesStatus && matchesStand;
  });

  const getStatusColor = (status) => {
    const colors = { "Available": "bg-green-100 text-green-700 border-green-200", "Reserved": "bg-yellow-100 text-yellow-700 border-yellow-200", "Sold": "bg-slate-100 text-slate-600 border-slate-200" };
    return colors[status] || "bg-slate-100 text-slate-600 border-slate-200";
  };

  const formatPrice = (price) => price ? `R ${price.toLocaleString()}` : "Price on Request";

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
          <h1 className="text-3xl font-bold text-white">Vehicle Inventory</h1>
          <p className="text-white/60 mt-1">{vehicles.filter(v => v.status === "Available").length} vehicles available</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="bg-amber-600 hover:bg-amber-700 text-black font-semibold">
          <Plus className="w-4 h-4 mr-2" /> Add Vehicle
        </Button>
      </div>

      <Card className="border border-white/10 bg-white/5 shadow-none">
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <Input placeholder="Search by make, model, or title..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40" />
            </div>
            <div className="flex gap-3">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white">
                  <Filter className="w-4 h-4 mr-2" /><SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterStand} onValueChange={setFilterStand}>
                <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Stand" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stands</SelectItem>
                  {STANDS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredVehicles.map((vehicle) => (
          <Card key={vehicle.id} className="border border-white/10 bg-white/5 overflow-hidden hover:border-amber-600/40 transition-all">
            <div className="aspect-[16/10] bg-black/30 relative">
              {vehicle.images && vehicle.images.length > 0 ? (
                vehicle.website_slug ? (
                  <a href={`https://www.koosandmike.co.za/vehicle/${vehicle.website_slug}`} target="_blank" rel="noreferrer" className="block w-full h-full group">
                    <img src={vehicle.images[0]} alt={vehicle.title} className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                      <ExternalLink className="w-8 h-8 text-white" />
                    </div>
                  </a>
                ) : (
                  <img src={vehicle.images[0]} alt={vehicle.title} className="w-full h-full object-cover" />
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Car className="w-16 h-16 text-white/20" />
                </div>
              )}
              <span className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(vehicle.status)}`}>
                {vehicle.status}
              </span>
              {vehicle.images && vehicle.images.length > 1 && (
                <span className="absolute bottom-3 right-3 px-2 py-1 bg-black/60 rounded text-white text-xs">
                  +{vehicle.images.length - 1} photos
                </span>
              )}
            </div>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-white line-clamp-1">{vehicle.title}</h3>
                  <p className="text-lg font-bold text-amber-400">{formatPrice(vehicle.price)}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(vehicle)}>
                    <Edit className="w-4 h-4 text-white/40" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(vehicle.id)}>
                    <Trash2 className="w-4 h-4 text-white/40" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1 text-sm text-white/60 mb-4">
                <p><span className="text-white/40">Stand:</span> {vehicle.stand || "—"}</p>
                {vehicle.mileage && <p><span className="text-white/40">Mileage:</span> {vehicle.mileage.toLocaleString()} km</p>}
              </div>
              <div className="flex items-center gap-2 pt-3 border-t border-white/10">
                <div className={`w-2 h-2 rounded-full ${vehicle.uploaded_to_website ? "bg-amber-400" : "bg-white/20"}`} />
                <span className="text-xs text-white/50">{vehicle.uploaded_to_website ? "On Website" : "Not Uploaded"}</span>
                {vehicle.finance_available && (
                  <>
                    <span className="text-white/20">•</span>
                    <span className="text-xs text-amber-400">Finance Available</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredVehicles.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <Car className="w-8 h-8 text-white/30" />
          </div>
          <h3 className="text-lg font-medium text-white">No vehicles found</h3>
          <p className="text-white/50">Try adjusting your search or filters</p>
        </div>
      )}

      <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) { setEditingVehicle(null); resetForm(); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingVehicle ? "Edit Vehicle" : "Add New Vehicle"}</DialogTitle>
          </DialogHeader>
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
                <label className="aspect-square border-2 border-dashed border-amber-600/40 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-amber-500 hover:bg-amber-50/5 transition-colors">
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={uploading} />
                  {uploading ? <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500" /> : <><Upload className="w-6 h-6 text-amber-500/60" /><span className="text-xs text-white/40 mt-1">Upload</span></>}
                </label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Title (Year | Make | Model | Mileage) *</Label>
                <Input required value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} placeholder="2020 | Toyota | Hilux | 45000km" />
              </div>
              <div>
                <Label>Make *</Label>
                <Input required value={form.make} onChange={(e) => setForm({...form, make: e.target.value})} placeholder="Toyota" />
              </div>
              <div>
                <Label>Model *</Label>
                <Input required value={form.model} onChange={(e) => setForm({...form, model: e.target.value})} placeholder="Hilux" />
              </div>
              <div>
                <Label>Year</Label>
                <Input type="number" value={form.year} onChange={(e) => setForm({...form, year: e.target.value})} placeholder="2020" />
              </div>
              <div>
                <Label>Mileage (km)</Label>
                <Input type="number" value={form.mileage} onChange={(e) => setForm({...form, mileage: e.target.value})} placeholder="45000" />
              </div>
              <div>
                <Label>Price (R)</Label>
                <Input type="number" value={form.price} onChange={(e) => setForm({...form, price: e.target.value})} placeholder="350000" />
              </div>
              <div>
                <Label>Stand *</Label>
                <Select value={form.stand} onValueChange={(v) => setForm({...form, stand: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STANDS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({...form, status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.uploaded_to_website} onCheckedChange={(v) => setForm({...form, uploaded_to_website: v})} />
                <Label>Uploaded to Website</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.finance_available} onCheckedChange={(v) => setForm({...form, finance_available: v})} />
                <Label>Finance Available</Label>
              </div>
              <div className="col-span-2">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} placeholder="Write a unique description for this vehicle..." rows={4} />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
              <Button type="submit" className="flex-1 bg-amber-600 hover:bg-amber-700 text-black font-semibold">
                {editingVehicle ? "Save Changes" : "Add Vehicle"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}