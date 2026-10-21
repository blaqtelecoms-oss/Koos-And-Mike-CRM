import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, FileDown, Mail, ChevronLeft, Shield, Car, User, ClipboardList, AlertTriangle } from "lucide-react";

const LOGO_URL = "https://media.base44.com/images/public/69ba4650f213ea0fa82b95fb/ed57e5a9f_istockphoto-1482350068-612x612.jpg";

const SECTION = ({ title, icon, color = "#0ea5e9", children }) => (
  <div className="rounded-2xl border p-5 space-y-4" style={{ background: "#111", borderColor: color + "30" }}>
    <div className="flex items-center gap-2 border-b pb-3" style={{ borderColor: color + "20" }}>
      <span style={{ color }}>{icon}</span>
      <h3 className="font-bold text-white text-lg">{title}</h3>
    </div>
    {children}
  </div>
);

const SCRIPT = ({ text }) => (
  <div className="rounded-xl px-4 py-3 text-sm leading-relaxed" style={{ background: "#0ea5e915", border: "1px solid #0ea5e930", color: "#7dd3fc" }}>
    <span className="text-xs font-bold uppercase tracking-wider text-blue-400 block mb-1">📢 Script — Read aloud:</span>
    {text}
  </div>
);

const FIELD = ({ label, name, value, onChange, placeholder, type = "text" }) => (
  <div>
    <Label className="text-white/70 text-xs mb-1 block">{label}</Label>
    <Input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder || label}
      className="bg-white/5 border-white/10 text-white placeholder:text-white/20"
    />
  </div>
);

const TEXTAREA_FIELD = ({ label, name, value, onChange, placeholder, rows = 2 }) => (
  <div>
    <Label className="text-white/70 text-xs mb-1 block">{label}</Label>
    <Textarea
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder || label}
      rows={rows}
      className="bg-white/5 border-white/10 text-white placeholder:text-white/20 resize-none"
    />
  </div>
);

const YesNo = ({ label, name, value, onChange }) => (
  <div>
    <Label className="text-white/70 text-xs mb-2 block">{label}</Label>
    <div className="flex gap-3">
      {["Yes", "No"].map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange({ target: { name, value: opt } })}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all"
          style={value === opt
            ? { background: opt === "Yes" ? "#22c55e22" : "#ef444422", borderColor: opt === "Yes" ? "#22c55e" : "#ef4444", color: opt === "Yes" ? "#4ade80" : "#f87171" }
            : { background: "transparent", borderColor: "#ffffff20", color: "#ffffff50" }
          }
        >
          <div className="w-4 h-4 rounded border-2 flex items-center justify-center" style={{ borderColor: value === opt ? (opt === "Yes" ? "#4ade80" : "#f87171") : "#ffffff30" }}>
            {value === opt && <div className="w-2 h-2 rounded-sm" style={{ background: opt === "Yes" ? "#4ade80" : "#f87171" }} />}
          </div>
          {opt}
        </button>
      ))}
    </div>
  </div>
);

export default function InsuranceCallFlow() {
  const consultant = (() => {
    try { return JSON.parse(localStorage.getItem("ccConsultant") || "{}"); } catch { return {}; }
  })();

  const [form, setForm] = useState({
    agent_name: consultant?.name || "",
    customer_title: "Mr",
    customer_surname: "",
    full_names: "",
    id_number: "",
    residential_address: "",
    email_address: "",
    contact_number: "",
    vehicle_make: "",
    vehicle_model: "",
    vehicle_year_description: "",
    has_insurance: "",
    current_insurer: "",
    current_premium: "",
    has_claims: "",
    claims_details: "",
    licence_send_method: "",
    customer_agreed: "",
    additional_notes: "",
    send_email: "",
  });

  const [checklist, setChecklist] = useState({
    full_names: false, id_number: false, contact_number: false,
    email_address: false, residential_address: false, vehicle_make: false,
    vehicle_model: false, vehicle_year_description: false, has_insurance: false,
    current_insurer: false, current_premium: false, has_claims: false,
    customer_agreed: false, licence_send_method: false,
  });

  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState("");
  const [pdfGenerated, setPdfGenerated] = useState(false);

  const handle = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (name in checklist && value.trim()) {
      setChecklist(prev => ({ ...prev, [name]: true }));
    }
  };

  const checklistItems = [
    ["full_names", "Full Names"],
    ["id_number", "ID Number"],
    ["contact_number", "Contact Number"],
    ["email_address", "Email Address"],
    ["residential_address", "Residential Address"],
    ["vehicle_make", "Vehicle Make"],
    ["vehicle_model", "Vehicle Model"],
    ["vehicle_year_description", "Vehicle Year Model & Full Description"],
    ["has_insurance", "Current Insurance (Yes/No)"],
    ["current_insurer", "Current Insurance Company (if applicable)"],
    ["current_premium", "Current Monthly Premium (if known)"],
    ["has_claims", "Claims History (Past 3 Years)"],
    ["customer_agreed", "Customer agreed to receive a quotation"],
    ["licence_send_method", "Driver's Licence Photo requested (WhatsApp/Email)"],
  ];

  const checkedCount = checklistItems.filter(([key]) => {
    if (key === "current_insurer" || key === "current_premium") return form.has_insurance !== "Yes" || checklist[key];
    return checklist[key] || (form[key] && form[key].trim && form[key].trim());
  }).length;

  const buildPdfHtml = () => {
    const now = new Date().toLocaleDateString("en-ZA", { day: "2-digit", month: "long", year: "numeric" });
    return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<style>
  body { font-family: Arial, sans-serif; color: #111; margin: 40px; font-size: 13px; }
  .header { display: flex; align-items: center; gap: 20px; margin-bottom: 24px; border-bottom: 3px solid #0ea5e9; padding-bottom: 16px; }
  .header img { width: 80px; height: 80px; object-fit: contain; }
  .header-text h1 { margin: 0; font-size: 22px; color: #0ea5e9; }
  .header-text p { margin: 4px 0 0; color: #666; font-size: 12px; }
  h2 { font-size: 14px; color: #0ea5e9; border-bottom: 1px solid #0ea5e930; padding-bottom: 4px; margin: 20px 0 10px; text-transform: uppercase; letter-spacing: 1px; }
  .row { display: flex; gap: 20px; margin-bottom: 8px; }
  .field { flex: 1; }
  .field label { font-size: 11px; color: #666; display: block; margin-bottom: 2px; }
  .field .val { border-bottom: 1px solid #ccc; min-height: 22px; padding: 2px 0; font-size: 13px; font-weight: 500; }
  .badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 11px; font-weight: bold; }
  .badge-yes { background: #dcfce7; color: #166534; }
  .badge-no { background: #fee2e2; color: #991b1b; }
  .footer { margin-top: 30px; padding-top: 12px; border-top: 1px solid #ccc; font-size: 11px; color: #666; }
  .important { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 10px 14px; margin-top: 20px; }
  .important b { color: #ea580c; }
  .important ul { margin: 6px 0 0 16px; padding: 0; }
</style>
</head>
<body>
<div class="header">
  <img src="${LOGO_URL}" alt="Call Centre" />
  <div class="header-text">
    <h1>Koos &amp; Mike Cars – Insurance Lead</h1>
    <p>Call Centre Agent Script — Completed Form</p>
    <p>Date: ${now} &nbsp;|&nbsp; Agent: ${form.agent_name || "—"}</p>
  </div>
</div>

<h2>Personal Details</h2>
<div class="row">
  <div class="field"><label>Full Names</label><div class="val">${form.full_names || ""}</div></div>
  <div class="field"><label>ID Number</label><div class="val">${form.id_number || ""}</div></div>
</div>
<div class="row">
  <div class="field"><label>Contact Number</label><div class="val">${form.contact_number || ""}</div></div>
  <div class="field"><label>Email Address</label><div class="val">${form.email_address || ""}</div></div>
</div>
<div class="row">
  <div class="field"><label>Residential Address</label><div class="val">${form.residential_address || ""}</div></div>
</div>

<h2>Vehicle Details</h2>
<div class="row">
  <div class="field"><label>Vehicle Make</label><div class="val">${form.vehicle_make || ""}</div></div>
  <div class="field"><label>Vehicle Model</label><div class="val">${form.vehicle_model || ""}</div></div>
</div>
<div class="row">
  <div class="field"><label>Year Model &amp; Full Description</label><div class="val">${form.vehicle_year_description || ""}</div></div>
</div>

<h2>Insurance Details</h2>
<div class="row">
  <div class="field"><label>Currently Insured?</label><div class="val"><span class="badge ${form.has_insurance === 'Yes' ? 'badge-yes' : 'badge-no'}">${form.has_insurance || "—"}</span></div></div>
  <div class="field"><label>Current Insurer</label><div class="val">${form.current_insurer || "—"}</div></div>
</div>
<div class="row">
  <div class="field"><label>Current Monthly Premium</label><div class="val">R ${form.current_premium || "—"}</div></div>
</div>

<h2>Claims History</h2>
<div class="row">
  <div class="field"><label>Claims in past 3 years?</label><div class="val"><span class="badge ${form.has_claims === 'Yes' ? 'badge-yes' : 'badge-no'}">${form.has_claims || "—"}</span></div></div>
</div>
${form.claims_details ? `<div class="row"><div class="field"><label>Claims Details</label><div class="val">${form.claims_details}</div></div></div>` : ""}

<h2>Driver's Licence</h2>
<div class="row">
  <div class="field"><label>Preferred method to send licence</label><div class="val">${form.licence_send_method || "—"}</div></div>
  <div class="field"><label>Customer agreed to quotation?</label><div class="val"><span class="badge ${form.customer_agreed === 'Yes' ? 'badge-yes' : 'badge-no'}">${form.customer_agreed || "—"}</span></div></div>
</div>

${form.additional_notes ? `<h2>Additional Notes</h2><div class="row"><div class="field"><div class="val">${form.additional_notes}</div></div></div>` : ""}

<div class="important">
  <b>⚠ Important Reminders:</b>
  <ul>
    <li>Never promise that the premium will be cheaper.</li>
    <li>Never quote a premium yourself.</li>
    <li>Never give insurance advice.</li>
    <li>Your role is to collect accurate information and arrange a free quotation.</li>
  </ul>
</div>

<div class="footer">Generated by Koos &amp; Mike Cars CRM &nbsp;|&nbsp; Purple Blaq Media Call Centre &nbsp;|&nbsp; ${now}</div>
</body>
</html>`;
  };

  const handleDownloadPdf = () => {
    const html = buildPdfHtml();
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `insurance-lead-${form.full_names || "form"}-${new Date().toISOString().slice(0, 10)}.html`;
    a.click();
    URL.revokeObjectURL(url);
    setPdfGenerated(true);
  };

  const handleSendEmail = async () => {
    if (!form.email_address) {
      setSendError("Please enter the customer's email address first.");
      return;
    }
    setSending(true);
    setSendError("");
    try {
      const html = buildPdfHtml();
      await base44.integrations.Core.SendEmail({
        to: form.email_address,
        subject: `Insurance Quotation Request – ${form.full_names} | Koos & Mike Cars`,
        body: html,
      });
      setSent(true);
    } catch (e) {
      setSendError("Could not send email. Only registered app users can receive emails via this system. Please download the form instead.");
    }
    setSending(false);
  };

  return (
    <div className="min-h-screen" style={{ background: "#0D0D0D" }}>
      <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #0ea5e9, #38bdf8)" }} />

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-sm border-b" style={{ background: "#111111ee", borderColor: "#0ea5e920" }}>
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => window.history.back()} className="p-2 rounded-lg hover:bg-white/5">
            <ChevronLeft className="w-5 h-5 text-blue-400" />
          </button>
          <img src={LOGO_URL} alt="Call Centre" className="w-10 h-10 object-contain rounded-lg" />
          <div>
            <h1 className="font-bold text-blue-400 leading-none">Insurance Lead Script</h1>
            <p className="text-xs text-white/30">Koos &amp; Mike Cars × Santam</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-white/30">Agent</p>
              <p className="text-sm font-semibold text-white">{consultant?.name || "—"}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">

        {/* Agent name */}
        <div className="rounded-2xl border p-4" style={{ background: "#111", borderColor: "#0ea5e930" }}>
          <FIELD label="Agent Name" name="agent_name" value={form.agent_name} onChange={handle} placeholder="Your name" />
        </div>

        {/* INTRODUCTION */}
        <SECTION title="Introduction" icon={<Shield className="w-5 h-5" />}>
          <SCRIPT text={
            <>
              Good day, may I please speak with <strong>Mr/Ms {form.customer_surname || "___________"}</strong>?<br /><br />
              My name is <strong>{form.agent_name || "___________"}</strong>, and I'm calling on behalf of <strong>Koos &amp; Mike Cars</strong>.<br /><br />
              How are you today?<br /><br />
              The reason for my call is that <strong>Koos &amp; Mike Cars has partnered with Santam</strong> to help motorists compare their current insurance premiums.<br /><br />
              Many South Africans are paying more than they need to for their insurance. We offer a <strong>FREE, no-obligation insurance comparison</strong>, and in many cases we're able to beat existing premiums while maintaining excellent cover.<br /><br />
              <strong>Do you currently have insurance on your vehicle?</strong>
            </>
          } />
          <div className="grid grid-cols-2 gap-3">
            <FIELD label="Customer Title" name="customer_title" value={form.customer_title} onChange={handle} placeholder="Mr / Ms / Dr" />
            <FIELD label="Customer Surname (for greeting)" name="customer_surname" value={form.customer_surname} onChange={handle} placeholder="Surname" />
          </div>
          <YesNo label="Does the customer have vehicle insurance?" name="has_insurance" value={form.has_insurance} onChange={handle} />
        </SECTION>

        {/* INTERESTED? */}
        {form.has_insurance && (
          <SECTION title="If Customer Is Interested" icon={<CheckCircle2 className="w-5 h-5" />} color="#22c55e">
            <SCRIPT text={
              <>
                That's great!<br /><br />
                To prepare an accurate quotation, I'll need to collect a few details. This will only take a few minutes.
              </>
            } />
          </SECTION>
        )}

        {/* PERSONAL DETAILS */}
        <SECTION title="Customer Information" icon={<User className="w-5 h-5" />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FIELD label="Full Names *" name="full_names" value={form.full_names} onChange={handle} />
            <FIELD label="ID Number *" name="id_number" value={form.id_number} onChange={handle} />
            <FIELD label="Contact Number *" name="contact_number" value={form.contact_number} onChange={handle} type="tel" />
            <FIELD label="Email Address *" name="email_address" value={form.email_address} onChange={handle} type="email" />
          </div>
          <TEXTAREA_FIELD label="Residential Address *" name="residential_address" value={form.residential_address} onChange={handle} />
        </SECTION>

        {/* VEHICLE DETAILS */}
        <SECTION title="Vehicle Details" icon={<Car className="w-5 h-5" />} color="#f59e0b">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FIELD label="Vehicle Make *" name="vehicle_make" value={form.vehicle_make} onChange={handle} placeholder="e.g. Toyota" />
            <FIELD label="Vehicle Model *" name="vehicle_model" value={form.vehicle_model} onChange={handle} placeholder="e.g. Corolla" />
          </div>
          <TEXTAREA_FIELD label="Vehicle Year Model & Full Description *" name="vehicle_year_description" value={form.vehicle_year_description} onChange={handle} placeholder="e.g. 2020 Toyota Corolla 1.8 Prestige, White, 45000km" />
        </SECTION>

        {/* CURRENT INSURANCE */}
        <SECTION title="Current Insurance Details" icon={<Shield className="w-5 h-5" />} color="#8b5cf6">
          {form.has_insurance === "Yes" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FIELD label="Current Insurance Company" name="current_insurer" value={form.current_insurer} onChange={handle} placeholder="e.g. OUTsurance" />
              <FIELD label="Current Monthly Premium (if known)" name="current_premium" value={form.current_premium} onChange={handle} placeholder="e.g. 1200" />
            </div>
          )}
          {form.has_insurance === "No" && (
            <p className="text-sm text-white/40 italic">Customer does not have current insurance.</p>
          )}
          {!form.has_insurance && (
            <p className="text-sm text-white/30 italic">Answer the insurance question in the Introduction section first.</p>
          )}
        </SECTION>

        {/* CLAIMS HISTORY */}
        <SECTION title="Claims History" icon={<AlertTriangle className="w-5 h-5" />} color="#ef4444">
          <SCRIPT text="Have you had any insurance claims during the past 3 years?" />
          <YesNo label="Claims in past 3 years?" name="has_claims" value={form.has_claims} onChange={handle} />
          {form.has_claims === "Yes" && (
            <TEXTAREA_FIELD label="Brief details of claims" name="claims_details" value={form.claims_details} onChange={handle} placeholder="Date, nature of claim, outcome..." rows={3} />
          )}
        </SECTION>

        {/* DRIVER'S LICENCE */}
        <SECTION title="Driver's Licence" icon={<ClipboardList className="w-5 h-5" />} color="#06b6d4">
          <SCRIPT text={<>For the quotation, we'll also require a <strong>clear photo of your driver's licence</strong>. Would you be comfortable sending it via <strong>WhatsApp or Email</strong>?</>} />
          <div>
            <Label className="text-white/70 text-xs mb-2 block">Preferred method to send licence</Label>
            <div className="flex gap-3">
              {["WhatsApp", "Email", "Neither"].map(opt => (
                <button key={opt} type="button"
                  onClick={() => handle({ target: { name: "licence_send_method", value: opt } })}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all"
                  style={form.licence_send_method === opt
                    ? { background: "#0ea5e922", borderColor: "#0ea5e9", color: "#38bdf8" }
                    : { background: "transparent", borderColor: "#ffffff20", color: "#ffffff50" }
                  }
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </SECTION>

        {/* VALUE PROPOSITION */}
        <SECTION title="Value Proposition & Closing" icon={<CheckCircle2 className="w-5 h-5" />} color="#10b981">
          <SCRIPT text={
            <>
              Thank you.<br /><br />
              Our insurance adviser will compare your current cover with our available options through Santam.<br /><br />
              If we're able to offer you a better premium or better value for your money, they'll explain everything to you before you make any decision.<br /><br />
              There is <strong>no obligation</strong> to switch your insurance.<br /><br />
              Thank you for your time today. One of our qualified insurance advisers will contact you shortly with your quotation. We appreciate the opportunity to assist you. Have a wonderful day!
            </>
          } />
          <YesNo label="Did the customer agree to receive a quotation?" name="customer_agreed" value={form.customer_agreed} onChange={handle} />
          <TEXTAREA_FIELD label="Additional Notes" name="additional_notes" value={form.additional_notes} onChange={handle} placeholder="Any other relevant information..." rows={2} />
        </SECTION>

        {/* AGENT CHECKLIST */}
        <div className="rounded-2xl border p-5 space-y-3" style={{ background: "#111", borderColor: "#f59e0b30" }}>
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-amber-400 flex items-center gap-2"><ClipboardList className="w-5 h-5" /> Agent Checklist</h3>
            <span className="text-sm font-bold px-3 py-1 rounded-full" style={{ background: checkedCount === checklistItems.length ? "#22c55e22" : "#f59e0b22", color: checkedCount === checklistItems.length ? "#4ade80" : "#fbbf24" }}>
              {checkedCount}/{checklistItems.length}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {checklistItems.map(([key, label]) => {
              const checked = checklist[key] || (form[key] && typeof form[key] === "string" && form[key].trim());
              return (
                <button key={key} type="button"
                  onClick={() => setChecklist(prev => ({ ...prev, [key]: !prev[key] }))}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border text-left transition-all text-sm"
                  style={checked
                    ? { background: "#22c55e15", borderColor: "#22c55e40", color: "#4ade80" }
                    : { background: "#ffffff05", borderColor: "#ffffff15", color: "#ffffff60" }
                  }
                >
                  <div className="w-4 h-4 rounded border-2 flex items-center justify-center shrink-0" style={{ borderColor: checked ? "#4ade80" : "#ffffff30" }}>
                    {checked && <CheckCircle2 className="w-3 h-3 text-green-400" />}
                  </div>
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* IMPORTANT REMINDERS */}
        <div className="rounded-2xl border p-4" style={{ background: "#1a0a00", borderColor: "#f97316" + "44" }}>
          <p className="text-orange-400 font-bold text-sm mb-2">⚠ Important to Remember</p>
          <ul className="space-y-1 text-sm text-orange-200/70 list-disc list-inside">
            <li>Never promise that the premium <strong>will</strong> be cheaper.</li>
            <li>Never quote a premium yourself.</li>
            <li>Never give insurance advice.</li>
            <li>Your role is to collect accurate information and arrange a free quotation from the licensed insurance adviser.</li>
            <li>Be friendly, professional, and thank the customer for their time.</li>
          </ul>
        </div>

        {/* ACTIONS */}
        <div className="rounded-2xl border p-5 space-y-4" style={{ background: "#111", borderColor: "#0ea5e930" }}>
          <h3 className="font-bold text-white">Save &amp; Send</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={handleDownloadPdf} className="flex-1 gap-2" style={{ background: "#0ea5e9", color: "#fff" }}>
              <FileDown className="w-4 h-4" /> Download Form
            </Button>
            <Button onClick={handleSendEmail} disabled={sending || sent} className="flex-1 gap-2" style={{ background: sent ? "#22c55e" : "#7c3aed", color: "#fff" }}>
              {sending ? "Sending..." : sent ? <><CheckCircle2 className="w-4 h-4" /> Sent!</> : <><Mail className="w-4 h-4" /> Email to Customer</>}
            </Button>
          </div>
          {sendError && <p className="text-xs text-red-400 bg-red-400/10 rounded-lg p-3">{sendError}</p>}
          {pdfGenerated && <p className="text-xs text-green-400">Form downloaded. Open in browser and use Ctrl+P / Print → Save as PDF.</p>}
        </div>

      </div>
    </div>
  );
}