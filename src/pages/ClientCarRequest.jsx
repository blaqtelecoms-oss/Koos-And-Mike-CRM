import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, Car, Loader2 } from "lucide-react";
import ClientLayout from "@/components/client/ClientLayout";

export default function ClientCarRequest() {
  const [form, setForm] = useState({
    requester_name: "", phone: "", email: "", contact_preference: "WhatsApp",
    make: "", model: "", year_from: "", year_to: "", max_price: "",
    colour_preference: "", finance_required: false, additional_requirements: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await base44.entities.CarRequest.create({
      ...form,
      year_from: form.year_from ? parseInt(form.year_from) : undefined,
      year_to: form.year_to ? parseInt(form.year_to) : undefined,
      max_price: form.max_price ? parseFloat(form.max_price) : undefined,
      status: "New",
    });
    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <ClientLayout>
        <div className="max-w-xl mx-auto px-4 py-20 text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "#C9A84C20" }}>
            <CheckCircle2 className="w-10 h-10" style={{ color: "#C9A84C" }} />
          </div>
          <h2 className="text-gray-900 text-3xl font-bold mb-3">Request Submitted!</h2>
          <p className="text-slate-300 mb-2">Thank you, <strong className="text-gray-900">{form.requester_name}</strong>.</p>
          <p className="text-slate-400 mb-8">We'll search our dealer network and contact you via {form.contact_preference} as soon as we find a match.</p>
          <Button onClick={() => { setSubmitted(false); setForm({ requester_name: "", phone: "", email: "", contact_preference: "WhatsApp", make: "", model: "", year_from: "", year_to: "", max_price: "", colour_preference: "", finance_required: false, additional_requirements: "" }); }}
            className="text-black font-bold" style={{ background: "#C9A84C" }}>
            Submit Another Request
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
            <Car className="w-6 h-6" style={{ color: "#C9A84C" }} />
          </div>
          <div>
            <h1 className="text-gray-900 text-3xl font-bold">Request a Car</h1>
            <p className="text-slate-400 text-sm">Can't find what you're looking for? We'll find it for you!</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/70 border border-amber-200/60 rounded-2xl p-6 space-y-6">
          {/* Contact Info */}
          <div>
            <h3 className="text-gray-900 font-semibold mb-4 border-b border-amber-200/60 pb-2">Your Contact Details</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <FormField label="Full Name *">
                <Input required value={form.requester_name} onChange={e => set("requester_name", e.target.value)}
                  placeholder="Your full name" className="bg-white/70 border-amber-200/60 text-gray-900 placeholder:text-slate-400" />
              </FormField>
              <FormField label="Phone Number *">
                <Input required value={form.phone} onChange={e => set("phone", e.target.value)}
                  placeholder="082 000 0000" className="bg-white/70 border-amber-200/60 text-gray-900 placeholder:text-slate-400" />
              </FormField>
              <FormField label="Email Address">
                <Input type="email" value={form.email} onChange={e => set("email", e.target.value)}
                  placeholder="your@email.com" className="bg-white/70 border-amber-200/60 text-gray-900 placeholder:text-slate-400" />
              </FormField>
              <FormField label="Preferred Contact Method">
                <Select value={form.contact_preference} onValueChange={v => set("contact_preference", v)}>
                  <SelectTrigger className="bg-white/70 border-amber-200/60 text-gray-900"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                    <SelectItem value="Call">Phone Call</SelectItem>
                    <SelectItem value="Email">Email</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            </div>
          </div>

          {/* Vehicle Requirements */}
          <div>
            <h3 className="text-gray-900 font-semibold mb-4 border-b border-amber-200/60 pb-2">What Are You Looking For?</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <FormField label="Preferred Make">
                <Input value={form.make} onChange={e => set("make", e.target.value)}
                  placeholder="e.g. Toyota, VW, Ford..." className="bg-white/70 border-amber-200/60 text-gray-900 placeholder:text-slate-400" />
              </FormField>
              <FormField label="Preferred Model">
                <Input value={form.model} onChange={e => set("model", e.target.value)}
                  placeholder="e.g. Hilux, Polo..." className="bg-white/70 border-amber-200/60 text-gray-900 placeholder:text-slate-400" />
              </FormField>
              <FormField label="Year From">
                <Input type="number" value={form.year_from} onChange={e => set("year_from", e.target.value)}
                  placeholder="e.g. 2018" min="1990" max="2026" className="bg-white/70 border-amber-200/60 text-gray-900 placeholder:text-slate-400" />
              </FormField>
              <FormField label="Year To">
                <Input type="number" value={form.year_to} onChange={e => set("year_to", e.target.value)}
                  placeholder="e.g. 2023" min="1990" max="2026" className="bg-white/70 border-amber-200/60 text-gray-900 placeholder:text-slate-400" />
              </FormField>
              <FormField label="Maximum Budget (R)">
                <Input type="number" value={form.max_price} onChange={e => set("max_price", e.target.value)}
                  placeholder="e.g. 350000" className="bg-white/70 border-amber-200/60 text-gray-900 placeholder:text-slate-400" />
              </FormField>
              <FormField label="Colour Preference">
                <Input value={form.colour_preference} onChange={e => set("colour_preference", e.target.value)}
                  placeholder="e.g. White, any colour..." className="bg-white/70 border-amber-200/60 text-gray-900 placeholder:text-slate-400" />
              </FormField>
            </div>
          </div>

          <div className="flex items-center gap-3 py-2">
            <Checkbox
              id="finance"
              checked={form.finance_required}
              onCheckedChange={v => set("finance_required", v)}
              className="border-amber-300/60"
            />
            <label htmlFor="finance" className="text-slate-300 text-sm cursor-pointer">
              I will need finance / vehicle financing
            </label>
          </div>

          <FormField label="Additional Requirements">
            <Textarea value={form.additional_requirements} onChange={e => set("additional_requirements", e.target.value)}
              placeholder="Automatic/manual, diesel/petrol, tow bar, any other requirements..." rows={3}
              className="bg-white/70 border-amber-200/60 text-gray-900 placeholder:text-slate-400" />
          </FormField>

          <Button type="submit" disabled={loading} className="w-full py-6 text-lg font-bold rounded-xl gap-2 text-black" style={{ background: "#C9A84C" }}>
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <><Car className="w-5 h-5" /> Submit My Request</>}
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