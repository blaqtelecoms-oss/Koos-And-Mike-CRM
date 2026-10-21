import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, UserPlus, Loader2 } from "lucide-react";
import ClientLayout from "@/components/client/ClientLayout";

export default function ClientRegister() {
  const [form, setForm] = useState({
    lead_name: "", phone: "", email: "",
    car_interested: "", source: "Website", notes: "",
    contact_preference: "WhatsApp",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await base44.entities.Lead.create({
      ...form,
      status: "New",
      dealer_assigned: "Unassigned",
      date_sent: new Date().toISOString().split("T")[0],
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
          <h2 className="text-gray-900 text-3xl font-bold mb-3">You're Registered!</h2>
          <p className="text-slate-300 mb-2">Thank you, <strong className="text-gray-900">{form.lead_name}</strong>.</p>
          <p className="text-slate-400 mb-8">Deon will contact you within 5–10 minutes via {form.contact_preference}.</p>
          <Button onClick={() => { setSubmitted(false); setForm({ lead_name: "", phone: "", email: "", car_interested: "", source: "Website", notes: "", contact_preference: "WhatsApp" }); }}
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
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "#C9A84C20" }}>
            <UserPlus className="w-6 h-6" style={{ color: "#C9A84C" }} />
          </div>
          <div>
            <h1 className="text-gray-900 text-3xl font-bold">Register My Interest</h1>
            <p className="text-slate-400 text-sm">We'll match you with the perfect vehicle from our dealers</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/70 border border-amber-200/60 rounded-2xl p-6 space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <FormField label="Full Name *">
              <Input required value={form.lead_name} onChange={e => set("lead_name", e.target.value)}
                placeholder="Your full name" className="bg-white/70 border-amber-200/60 text-gray-900 placeholder:text-slate-400" />
            </FormField>
            <FormField label="Phone Number *">
              <Input required value={form.phone} onChange={e => set("phone", e.target.value)}
                placeholder="e.g. 082 000 0000" className="bg-white/70 border-amber-200/60 text-gray-900 placeholder:text-slate-400" />
            </FormField>
            <FormField label="Email Address">
              <Input type="email" value={form.email} onChange={e => set("email", e.target.value)}
                placeholder="your@email.com" className="bg-white/70 border-amber-200/60 text-gray-900 placeholder:text-slate-400" />
            </FormField>
            <FormField label="Preferred Contact Method">
              <Select value={form.contact_preference} onValueChange={v => set("contact_preference", v)}>
                <SelectTrigger className="bg-white/70 border-amber-200/60 text-gray-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                  <SelectItem value="Call">Phone Call</SelectItem>
                  <SelectItem value="Email">Email</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <FormField label="Car You're Interested In">
            <Input value={form.car_interested} onChange={e => set("car_interested", e.target.value)}
              placeholder="e.g. 2020 Toyota Hilux, any SUV under R300k..." className="bg-white/70 border-amber-200/60 text-gray-900 placeholder:text-slate-400" />
          </FormField>

          <FormField label="How did you hear about us?">
            <Select value={form.source} onValueChange={v => set("source", v)}>
              <SelectTrigger className="bg-white/70 border-amber-200/60 text-gray-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["Website", "Facebook", "Instagram", "TikTok", "WhatsApp", "Email", "Other"].map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Additional Notes">
            <Textarea value={form.notes} onChange={e => set("notes", e.target.value)}
              placeholder="Any specific requirements, budget, finance needed..." rows={3}
              className="bg-white/70 border-amber-200/60 text-gray-900 placeholder:text-slate-400" />
          </FormField>

          <Button type="submit" disabled={loading} className="w-full py-6 text-lg font-bold rounded-xl gap-2 text-black" style={{ background: "#C9A84C" }}>
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <><UserPlus className="w-5 h-5" /> Register My Interest</>}
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