import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, RefreshCw, Loader2, Upload, X, ImagePlus } from "lucide-react";
import ClientLayout from "@/components/client/ClientLayout";

export default function ClientTradeIn() {
  const [form, setForm] = useState({
    owner_name: "", phone: "", email: "", contact_preference: "WhatsApp",
    car_make: "", car_model: "", car_year: "", mileage: "",
    color: "", condition: "Good", asking_price: "", description: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const handlePhotoChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploadingPhotos(true);
    const urls = [];
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      urls.push(file_url);
    }
    setPhotos(prev => [...prev, ...urls]);
    setUploadingPhotos(false);
  };

  const removePhoto = (idx) => setPhotos(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await base44.entities.TradeIn.create({
      ...form,
      car_year: form.car_year ? parseInt(form.car_year) : undefined,
      mileage: form.mileage ? parseInt(form.mileage) : undefined,
      asking_price: form.asking_price ? parseFloat(form.asking_price) : undefined,
      photos,
      status: "Pending Review",
    });
    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <ClientLayout>
        <div className="max-w-xl mx-auto px-4 py-20 text-center">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-white text-3xl font-bold mb-3">Trade-In Submitted!</h2>
          <p className="text-slate-300 mb-2">Thank you, <strong className="text-white">{form.owner_name}</strong>.</p>
          <p className="text-slate-400 mb-8">Our team will review your vehicle and contact you via {form.contact_preference} shortly.</p>
          <Button onClick={() => { setSubmitted(false); setForm({ owner_name: "", phone: "", email: "", contact_preference: "WhatsApp", car_make: "", car_model: "", car_year: "", mileage: "", color: "", condition: "Good", asking_price: "", description: "" }); }}
            className="text-black font-bold" style={{ background: "#C9A84C" }}>
            Submit Another
          </Button>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
            <RefreshCw className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h1 className="text-white text-3xl font-bold">Trade In Your Car</h1>
            <p className="text-slate-400 text-sm">Submit your vehicle details and we'll get back to you with an offer</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
          {/* Contact Info */}
          <div>
            <h3 className="text-white font-semibold mb-4 border-b border-white/10 pb-2">Your Contact Details</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <FormField label="Full Name *">
                <Input required value={form.owner_name} onChange={e => set("owner_name", e.target.value)}
                  placeholder="Your full name" className="bg-white/10 border-white/20 text-white placeholder:text-slate-400" />
              </FormField>
              <FormField label="Phone Number *">
                <Input required value={form.phone} onChange={e => set("phone", e.target.value)}
                  placeholder="082 000 0000" className="bg-white/10 border-white/20 text-white placeholder:text-slate-400" />
              </FormField>
              <FormField label="Email Address">
                <Input type="email" value={form.email} onChange={e => set("email", e.target.value)}
                  placeholder="your@email.com" className="bg-white/10 border-white/20 text-white placeholder:text-slate-400" />
              </FormField>
              <FormField label="Preferred Contact Method">
                <Select value={form.contact_preference} onValueChange={v => set("contact_preference", v)}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                    <SelectItem value="Call">Phone Call</SelectItem>
                    <SelectItem value="Email">Email</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            </div>
          </div>

          {/* Vehicle Info */}
          <div>
            <h3 className="text-white font-semibold mb-4 border-b border-white/10 pb-2">Vehicle Details</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <FormField label="Make *">
                <Input required value={form.car_make} onChange={e => set("car_make", e.target.value)}
                  placeholder="e.g. Toyota" className="bg-white/10 border-white/20 text-white placeholder:text-slate-400" />
              </FormField>
              <FormField label="Model *">
                <Input required value={form.car_model} onChange={e => set("car_model", e.target.value)}
                  placeholder="e.g. Hilux" className="bg-white/10 border-white/20 text-white placeholder:text-slate-400" />
              </FormField>
              <FormField label="Year *">
                <Input required type="number" value={form.car_year} onChange={e => set("car_year", e.target.value)}
                  placeholder="e.g. 2019" min="1990" max="2026" className="bg-white/10 border-white/20 text-white placeholder:text-slate-400" />
              </FormField>
              <FormField label="Mileage (km)">
                <Input type="number" value={form.mileage} onChange={e => set("mileage", e.target.value)}
                  placeholder="e.g. 120000" className="bg-white/10 border-white/20 text-white placeholder:text-slate-400" />
              </FormField>
              <FormField label="Colour">
                <Input value={form.color} onChange={e => set("color", e.target.value)}
                  placeholder="e.g. White" className="bg-white/10 border-white/20 text-white placeholder:text-slate-400" />
              </FormField>
              <FormField label="Condition">
                <Select value={form.condition} onValueChange={v => set("condition", v)}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Excellent", "Good", "Fair", "Needs Work"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Asking Price (R)">
                <Input type="number" value={form.asking_price} onChange={e => set("asking_price", e.target.value)}
                  placeholder="e.g. 250000" className="bg-white/10 border-white/20 text-white placeholder:text-slate-400" />
              </FormField>
            </div>
          </div>

          {/* Photos */}
          <div>
            <h3 className="text-white font-semibold mb-4 border-b border-white/10 pb-2">Photos of Your Car</h3>
            <div className="space-y-3">
              <label className="flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-[#C9A84C55] hover:bg-white/5 transition-all">
                <input type="file" accept="image/*" multiple onChange={handlePhotoChange} className="hidden" />
                {uploadingPhotos ? (
                  <><Loader2 className="w-5 h-5 animate-spin" style={{ color: "#C9A84C" }} /><span className="text-slate-300 text-sm">Uploading...</span></>
                ) : (
                  <><ImagePlus className="w-5 h-5" style={{ color: "#C9A84C" }} /><span className="text-slate-300 text-sm">Click to upload photos</span></>
                )}
              </label>
              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((url, idx) => (
                    <div key={idx} className="relative rounded-lg overflow-hidden aspect-square">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removePhoto(idx)}
                        className="absolute top-1 right-1 w-6 h-6 bg-black/70 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors">
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <FormField label="Additional Notes">
            <Textarea value={form.description} onChange={e => set("description", e.target.value)}
              placeholder="Service history, modifications, reason for selling..." rows={3}
              className="bg-white/10 border-white/20 text-white placeholder:text-slate-400" />
          </FormField>

          <Button type="submit" disabled={loading} className="w-full py-6 text-lg font-bold rounded-xl gap-2 text-black" style={{ background: "#C9A84C" }}>
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <><RefreshCw className="w-5 h-5" /> Submit Trade-In</>}
          </Button>
        </form>
      </div>
    </ClientLayout>
  );
}

function FormField({ label, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-slate-300 text-sm">{label}</Label>
      {children}
    </div>
  );
}