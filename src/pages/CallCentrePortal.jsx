import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Phone, Search, Car, LogOut, MessageCircle,
  CheckCircle2, AlertCircle, UserCheck, Clock, BellRing, BellOff, PhoneMissed, Shield
} from "lucide-react";
import moment from "moment";

const GOLD = "#C9A84C";
const BLUE = "#3b82f6";
const PIPELINE_STAGES = [
  "Initial Contact", "Engaged", "Test Drive Booked", "Test Drive Done",
  "With Sales Department", "With Finance", "Application Submitted",
  "Application Approved", "Deal Closed - Sold", "Deal Closed - Not Buying", "Application Failed"
];
const LEAD_RESPONSES = [
  "Answered - Interested", "Answered - Not Interested", "No Answer",
  "Callback Requested", "WhatsApp Replied", "No Response"
];

export default function CallCentrePortal() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [consultant, setConsultant] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("unassigned");
  const [callLead, setCallLead] = useState(null);
  const [allConsultants, setAllConsultants] = useState([]);
  const [togglingAvailability, setTogglingAvailability] = useState(false);
  const [todayFollowUps, setTodayFollowUps] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem("ccConsultant");
    if (!stored) {
      window.location.href = "/CCLanding";
      return;
    }
    setConsultant(JSON.parse(stored));
    Promise.all([loadConsultants(), loadLeads(), loadTodayFollowUps()]);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("ccConsultant");
    localStorage.removeItem("ccMustChangePassword");
    window.location.href = "/CCLanding";
  };

  const handleToggleAvailability = async () => {
    if (!consultant?.id) return;
    setTogglingAvailability(true);
    const newVal = !consultant.available;
    try {
      await base44.entities.Consultant.update(consultant.id, { available: newVal });
      const updated = { ...consultant, available: newVal };
      setConsultant(updated);
      localStorage.setItem("ccConsultant", JSON.stringify(updated));
    } finally {
      setTogglingAvailability(false);
    }
  };

  const loadConsultants = async () => {
    const consultants = await base44.entities.Consultant.list("-created_date", 100);
    setAllConsultants(consultants.filter(c => c.active && c.available && c.role === "Sales"));
  };

  const loadLeads = async () => {
    const data = await base44.entities.Lead.list("-created_date", 500);
    setLeads(data);
    setLoading(false);
  };

  const loadTodayFollowUps = async () => {
    const today = moment().format("YYYY-MM-DD");
    const data = await base44.entities.LeadFollowUp.filter({ update_date: today });
    setTodayFollowUps(data);
  };

  const filteredLeads = leads.filter(lead => {
    const matchSearch =
      lead.lead_name?.toLowerCase().includes(search.toLowerCase()) ||
      lead.phone?.includes(search) ||
      lead.car_interested?.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filterStatus === "all" ? true :
      filterStatus === "unassigned" ? (!lead.assigned_consultant || lead.assigned_consultant === "Unassigned") :
      filterStatus === "new" ? lead.status === "New" :
      filterStatus === "active" ? (lead.status !== "Sold" && lead.status !== "Lost") : true;
    return matchSearch && matchFilter;
  });

  const unassignedCount = leads.filter(l => !l.assigned_consultant || l.assigned_consultant === "Unassigned").length;
  const newTodayCount = leads.filter(l => moment(l.created_date).isSame(moment(), "day")).length;

  const noAnswerSummary = useMemo(() => {
    const counts = {};
    todayFollowUps
      .filter(f => f.lead_response === "No Answer")
      .forEach(f => {
        const name = f.reported_by || "Unknown";
        counts[name] = (counts[name] || 0) + 1;
      });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [todayFollowUps]);

  if (loading || !consultant) return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: "#0D0D0D" }}>
      <div className="w-10 h-10 border-4 border-blue-700 border-t-blue-400 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: "#0D0D0D" }}>
      <div className="h-1 w-full" style={{ background: BLUE }} />

      {/* Header */}
      <header className="border-b sticky top-0 z-50 backdrop-blur-sm" style={{ background: "#111111ee", borderColor: "#3b82f622" }}>
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="https://media.base44.com/images/public/69ba4650f213ea0fa82b95fb/fab77c211_KMLogo.png" alt="K&M" className="w-10 h-10 object-contain" />
            <div>
              <h1 className="font-bold text-lg leading-none" style={{ color: BLUE }}>Call Centre Portal</h1>
              <p className="text-xs" style={{ color: "#3b82f650" }}>Koos & Mike Cars</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm hidden sm:block" style={{ color: BLUE }}>{consultant.name}</span>
            <button
              onClick={handleToggleAvailability}
              disabled={togglingAvailability}
              title={consultant.available !== false ? "Click to go Unavailable" : "Click to go Available"}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all text-xs font-semibold border"
              style={{
                background: consultant.available !== false ? "#22c55e18" : "#ef444418",
                borderColor: consultant.available !== false ? "#22c55e44" : "#ef444444",
                color: consultant.available !== false ? "#4ade80" : "#f87171"
              }}
            >
              {consultant.available !== false
                ? <><BellRing className="w-3.5 h-3.5" /><span className="hidden sm:inline">Available</span></>
                : <><BellOff className="w-3.5 h-3.5" /><span className="hidden sm:inline">Unavailable</span></>
              }
            </button>
            <Button variant="ghost" size="sm" style={{ color: BLUE }} onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
          {/* Welcome */}
          <div>
            <h2 className="text-3xl font-extrabold text-white">Welcome, <span style={{ color: BLUE }}>{consultant.name}</span> 👋</h2>
            <p className="text-white/50 mt-1">Call leads, capture outcomes, and allocate to sales consultants</p>
          </div>

          {/* Insurance Script Link */}
          <a href="/InsuranceCallFlow">
            <div className="rounded-2xl border p-4 flex items-center gap-4 hover:opacity-90 transition-opacity cursor-pointer" style={{ background: "#0ea5e915", borderColor: "#0ea5e940" }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#0ea5e922" }}>
                <Shield className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="font-bold text-white">Insurance Lead Script</p>
                <p className="text-xs text-white/40">Open the Santam insurance call flow & digital form</p>
              </div>
              <div className="ml-auto px-3 py-1 rounded-full text-xs font-semibold" style={{ background: "#0ea5e922", color: "#38bdf8" }}>Open →</div>
            </div>
          </a>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard label="Unassigned Leads" value={unassignedCount} color="#ef4444" icon={<AlertCircle className="w-5 h-5" />} />
            <StatCard label="New Today" value={newTodayCount} color="#3b82f6" icon={<Clock className="w-5 h-5" />} />
            <StatCard label="Total Leads" value={leads.length} color={GOLD} icon={<UserCheck className="w-5 h-5" />} />
          </div>

          {/* No Answer Today Summary */}
          <div className="rounded-2xl border p-4 space-y-3" style={{ background: "#111", borderColor: "#ef444430" }}>
            <div className="flex items-center gap-2">
              <PhoneMissed className="w-4 h-4 text-red-400" />
              <h3 className="text-sm font-bold text-red-400">No Answer Today</h3>
              <span className="ml-auto text-xs text-white/30">{moment().format("D MMM YYYY")}</span>
            </div>
            {noAnswerSummary.length === 0 ? (
              <p className="text-xs text-white/30">No "No Answer" calls logged yet today.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {noAnswerSummary.map(([name, count]) => (
                  <div key={name} className="flex items-center gap-2 px-3 py-2 rounded-xl border" style={{ background: "#ef444415", borderColor: "#ef444430" }}>
                    <span className="text-sm font-semibold text-white">{name}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "#ef444430", color: "#f87171" }}>{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Search + Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <Input
                placeholder="Search name, phone, car..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 bg-white/5 border-white/10 text-white"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {[["unassigned", "Unassigned"], ["new", "New"], ["active", "Active"], ["all", "All"]].map(([v, l]) => (
                <button key={v} onClick={() => setFilterStatus(v)} className="px-3 py-2 rounded-lg text-xs font-semibold border transition-all"
                  style={filterStatus === v
                    ? { background: "#3b82f6", color: "#fff", borderColor: "transparent" }
                    : { background: "transparent", color: "#3b82f6", borderColor: "#3b82f640" }}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Leads List */}
          <div className="space-y-3">
            {filteredLeads.length === 0 && (
              <div className="text-center py-12 text-white/30">No leads match your filter.</div>
            )}
            {filteredLeads.map(lead => (
              <LeadRow
                key={lead.id}
                lead={lead}
                onCall={() => setCallLead(lead)}
                onReload={loadLeads}
                agent={consultant.name}
              />
            ))}
          </div>
        </div>

      {/* Call/Log Dialog */}
      {callLead && (
        <CallLogDialog
          lead={callLead}
          agent={consultant.name}
          allConsultants={allConsultants}
          onClose={() => setCallLead(null)}
          onSaved={() => { setCallLead(null); loadLeads(); loadTodayFollowUps(); }}
        />
      )}
    </div>
  );
}

function LeadRow({ lead, onCall }) {
  const isUnassigned = !lead.assigned_consultant || lead.assigned_consultant === "Unassigned";
  const statusColors = { "New": "#3b82f6", "Contacted": "#eab308", "Test Drive": "#a855f7", "Approved": "#22c55e", "Sold": "#10b981", "Lost": "#ef4444" };
  const c = statusColors[lead.status] || "#6b7280";

  return (
    <div className="rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center gap-3" style={{ background: "#111", borderColor: isUnassigned ? "#ef444430" : "#ffffff10" }}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-white font-semibold">{lead.lead_name}</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: c + "22", color: c }}>{lead.status}</span>
          {isUnassigned && <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">Unassigned</span>}
        </div>
        <div className="flex items-center gap-3 mt-1 text-sm text-white/50 flex-wrap">
          <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{lead.phone}</span>
          {lead.car_interested && <span className="flex items-center gap-1"><Car className="w-3 h-3" />{lead.car_interested}</span>}
          <span>{moment(lead.created_date).fromNow()}</span>
          {lead.assigned_consultant && lead.assigned_consultant !== "Unassigned" && (
            <span className="text-amber-400">→ {lead.assigned_consultant}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <a href={`https://wa.me/${lead.phone?.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer">
          <button className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#16a34a22", border: "1px solid #16a34a44" }}>
            <MessageCircle className="w-4 h-4 text-green-400" />
          </button>
        </a>
        <Button size="sm" onClick={onCall} className="bg-blue-600 hover:bg-blue-700 text-white gap-1">
          <Phone className="w-3.5 h-3.5" /> Log Call
        </Button>
      </div>
    </div>
  );
}

function CallLogDialog({ lead, agent, allConsultants, onClose, onSaved }) {
  const [form, setForm] = useState({
    contact_method: "Called",
    lead_response: "Answered - Interested",
    pipeline_stage: "Initial Contact",
    notes: "",
    assign_to: lead.assigned_consultant && lead.assigned_consultant !== "Unassigned" ? lead.assigned_consultant : "",
    new_status: lead.status
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    // Log the follow-up
    await base44.entities.LeadFollowUp.create({
      lead_id: lead.id,
      lead_name: lead.lead_name,
      update_date: moment().format("YYYY-MM-DD"),
      contact_method: form.contact_method,
      lead_response: form.lead_response,
      pipeline_stage: form.pipeline_stage,
      reported_by: agent,
      notes: form.notes
    });

    // Update lead: assign consultant + status
    const updates = { status: form.new_status };
    if (form.assign_to) updates.assigned_consultant = form.assign_to;
    await base44.entities.Lead.update(lead.id, updates);

    setSaving(false);
    onSaved();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-blue-400" />
            Log Call — {lead.lead_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Call now buttons */}
          <div className="flex gap-2">
            <a href={`tel:${lead.phone}`} className="flex-1">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 gap-2">
                <Phone className="w-4 h-4" /> Call {lead.phone}
              </Button>
            </a>
            <a href={`https://wa.me/${lead.phone?.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer" className="flex-1">
              <Button className="w-full bg-green-700 hover:bg-green-800 gap-2">
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </Button>
            </a>
          </div>

          <div>
            <Label>Contact Method</Label>
            <Select value={form.contact_method} onValueChange={v => setForm({ ...form, contact_method: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Called", "WhatsApp Messaged", "Email Sent", "No Contact Attempted"].map(m => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Lead Response</Label>
            <Select value={form.lead_response} onValueChange={v => setForm({ ...form, lead_response: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LEAD_RESPONSES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Pipeline Stage</Label>
            <Select value={form.pipeline_stage} onValueChange={v => setForm({ ...form, pipeline_stage: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PIPELINE_STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Update Lead Status</Label>
            <Select value={form.new_status} onValueChange={v => setForm({ ...form, new_status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["New", "Contacted", "Test Drive", "Approved", "Sold", "Lost"].map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="flex items-center gap-1"><UserCheck className="w-3.5 h-3.5" /> Allocate to Sales Consultant</Label>
            <Select value={form.assign_to} onValueChange={v => setForm({ ...form, assign_to: v })}>
              <SelectTrigger><SelectValue placeholder="Select available consultant..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Unassigned">Unassigned</SelectItem>
                {allConsultants.map(c => (
                  <SelectItem key={c.id} value={c.name}>{c.name} {c.is_manager ? "(Manager)" : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {allConsultants.length === 0 && (
              <p className="text-xs text-yellow-400 mt-1">No available consultants. Check their availability status.</p>
            )}
          </div>

          <div>
            <Label>Call Notes</Label>
            <Textarea
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="What did the lead say? Any important details..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700">
              {saving ? "Saving..." : <><CheckCircle2 className="w-4 h-4 mr-1" /> Save & Allocate</>}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StatCard({ label, value, color, icon }) {
  return (
    <div className="rounded-2xl p-4 border flex items-center gap-3" style={{ background: "#111", borderColor: color + "22" }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: color + "22" }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <p className="text-xs text-white/40 font-medium">{label}</p>
        <p className="text-2xl font-extrabold text-white">{value}</p>
      </div>
    </div>
  );
}