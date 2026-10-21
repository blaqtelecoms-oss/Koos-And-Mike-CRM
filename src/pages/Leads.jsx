import { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Search, Phone, Mail, Car, Filter, Edit, ClipboardList, Clock, RefreshCw } from "lucide-react";
import moment from "moment";
import LeadFollowUpDialog from "@/components/leads/LeadFollowUpDialog";
import CallDialog from "@/components/leads/CallDialog";
import WhatsAppDialog from "@/components/leads/WhatsAppDialog";
import NewLeadNotifier from "@/components/leads/NewLeadNotifier";
import PushNotificationSetup from "@/components/leads/PushNotificationSetup";

const STATUSES = ["New", "Contacted", "Test Drive", "Approved", "Sold", "No Answer", "Lost"];
const SOURCES = ["Website", "Facebook", "Instagram", "TikTok", "WhatsApp", "Email", "Other"];

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [consultants, setConsultants] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [followUps, setFollowUps] = useState({}); // keyed by lead_id → latest follow-up
  const [vehicleDialogLead, setVehicleDialogLead] = useState(null); // lead whose matching vehicle image to show
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Pull-to-refresh state
  const pullStartY = useRef(0);
  const pullDistance = useRef(0);
  const [pullIndicator, setPullIndicator] = useState(0); // 0-1 progress
  const [showForm, setShowForm] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterConsultant, setFilterConsultant] = useState("all");
  const [followUpLead, setFollowUpLead] = useState(null);
  const [callingLead, setCallingLead] = useState(null);
  const [whatsappLead, setWhatsappLead] = useState(null);
  const [form, setForm] = useState({
    lead_name: "",
    phone: "",
    email: "",
    car_interested: "",
    assigned_consultant: "Unassigned",
    status: "New",
    source: "Website",
    notes: "",
    response_time_minutes: ""
  });

  useEffect(() => {
    loadLeads();
    base44.entities.Consultant.filter({ role: "Sales", active: true }, "name", 50)
      .then(data => setConsultants(data || []))
      .catch(() => {});
    base44.entities.Vehicle.list("title", 500)
      .then(data => setVehicles(data || []))
      .catch(() => {});
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("action") === "new") {
      setShowForm(true);
    }

    // Auto-refresh every 5 minutes
    const autoRefresh = setInterval(loadLeads, 5 * 60 * 1000);

    // Pull-to-refresh touch handlers
    const el = document.documentElement;
    const THRESHOLD = 80;

    const onTouchStart = (e) => {
      if (window.scrollY === 0) pullStartY.current = e.touches[0].clientY;
    };
    const onTouchMove = (e) => {
      if (!pullStartY.current) return;
      const dist = e.touches[0].clientY - pullStartY.current;
      if (dist > 0 && window.scrollY === 0) {
        pullDistance.current = dist;
        setPullIndicator(Math.min(dist / THRESHOLD, 1));
      }
    };
    const onTouchEnd = async () => {
      if (pullDistance.current >= THRESHOLD) {
        setRefreshing(true);
        setPullIndicator(0);
        await loadLeads();
        setRefreshing(false);
      } else {
        setPullIndicator(0);
      }
      pullStartY.current = 0;
      pullDistance.current = 0;
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("touchend", onTouchEnd);
    return () => {
      clearInterval(autoRefresh);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  const loadLeads = async () => {
    const [data, allFollowUps] = await Promise.all([
      base44.entities.Lead.list("-created_date", 200),
      base44.entities.LeadFollowUp.list("-update_date", 500)
    ]);
    setLeads(data);
    // Build a map of lead_id → latest follow-up
    const map = {};
    for (const fu of allFollowUps) {
      if (!map[fu.lead_id]) map[fu.lead_id] = fu; // list is sorted desc, so first = latest
    }
    setFollowUps(map);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      response_time_minutes: form.response_time_minutes ? Number(form.response_time_minutes) : null
    };
    
    if (editingLead) {
      await base44.entities.Lead.update(editingLead.id, payload);
    } else {
      await base44.entities.Lead.create(payload);
    }
    
    setShowForm(false);
    setEditingLead(null);
    resetForm();
    loadLeads();
  };

  const resetForm = () => {
    setForm({
      lead_name: "",
      phone: "",
      email: "",
      car_interested: "",
      assigned_consultant: "Unassigned",
      status: "New",
      source: "Website",
      notes: "",
      response_time_minutes: ""
    });
  };

  const handleEdit = (lead) => {
    setEditingLead(lead);
    setForm({
      lead_name: lead.lead_name || "",
      phone: lead.phone || "",
      email: lead.email || "",
      car_interested: lead.car_interested || "",
      assigned_consultant: lead.assigned_consultant || "Unassigned",
      status: lead.status || "New",
      source: lead.source || "Website",
      notes: lead.notes || "",
      response_time_minutes: lead.response_time_minutes?.toString() || ""
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Note: Leads should not be deleted according to company policy. Are you sure?")) {
      await base44.entities.Lead.delete(id);
      loadLeads();
    }
  };

  const handleStatusChange = async (leadId, newStatus) => {
    // Optimistic update
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
    await base44.entities.Lead.update(leadId, { status: newStatus });
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.lead_name?.toLowerCase().includes(search.toLowerCase()) ||
      lead.phone?.includes(search) ||
      lead.car_interested?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "all" || lead.status === filterStatus;
    const matchesDealer = filterConsultant === "all" || lead.assigned_consultant === filterConsultant;
    return matchesSearch && matchesStatus && matchesDealer;
  });

  // Get the email received date — use stored field, or fall back to parsing notes
  const getEmailReceivedDate = (lead) => {
    if (lead.email_received_date) return lead.email_received_date;
    return null; // For old records without this field, we don't show misleading data
  };

  const getPlatformFromNotes = (notes) => {
    if (!notes) return null;
    const fromMatch = notes.match(/From: .+?<([^>]+)>/);
    const fromEmail = fromMatch ? fromMatch[1].toLowerCase() : "";
    const subjectMatch = notes.match(/Subject: (.+)/);
    const subject = subjectMatch ? subjectMatch[1].toLowerCase() : "";
    if (fromEmail.includes("autotrader")) return { name: "AutoTrader", color: "#e8261a" };
    if (fromEmail.includes("cars.co.za")) return { name: "Cars.co.za", color: "#005bbb" };
    if (fromEmail.includes("carfind")) return { name: "Carfind.co.za", color: "#f97316" };
    if (fromEmail.includes("changecars") || subject.includes("changecars")) return { name: "ChangeCars", color: "#16a34a" };
    if (fromEmail.includes("gumtree")) return { name: "Gumtree", color: "#00a650" };
    if (fromEmail.includes("facebook")) return { name: "Facebook", color: "#1877f2" };
    return null;
  };

  // Match car_interested text to a vehicle in inventory
  const findMatchingVehicle = (carInterested) => {
    if (!carInterested || !vehicles.length) return null;
    const text = carInterested.toLowerCase();
    return vehicles.find(v => {
      const make = v.make?.toLowerCase();
      const model = v.model?.toLowerCase();
      return make && model && text.includes(make) && text.includes(model);
    }) || null;
  };

  const getResponseTimeStyle = (minutes) => {
    if (minutes <= 5) return { bg: "#16a34a22", text: "#4ade80" };
    if (minutes <= 30) return { bg: "#ca8a0422", text: "#facc15" };
    return { bg: "#dc262622", text: "#f87171" };
  };

  const getStatusColor = (status) => {
    const colors = {
      "New": "bg-blue-100 text-blue-700 border-blue-200",
      "Contacted": "bg-yellow-100 text-yellow-700 border-yellow-200",
      "Test Drive": "bg-purple-100 text-purple-700 border-purple-200",
      "Approved": "bg-green-100 text-green-700 border-green-200",
      "Sold": "bg-emerald-100 text-emerald-700 border-emerald-200",
      "No Answer": "bg-orange-100 text-orange-700 border-orange-200",
      "Lost": "bg-red-100 text-red-700 border-red-200"
    };
    return colors[status] || "bg-slate-100 text-slate-700 border-slate-200";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pull-to-refresh indicator */}
      {(pullIndicator > 0 || refreshing) && (
        <div className="flex justify-center pt-2 pb-1">
          <RefreshCw
            className={`w-5 h-5 text-amber-400 transition-transform ${refreshing ? "animate-spin" : ""}`}
            style={{ transform: `rotate(${pullIndicator * 180}deg)`, opacity: refreshing ? 1 : pullIndicator }}
          />
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Leads</h1>
          <p className="text-white/60 mt-1">{leads.length} total leads tracked</p>
        </div>
        <div className="flex items-center gap-2">
          <PushNotificationSetup />
          <Button 
            onClick={() => { resetForm(); setShowForm(true); }}
            className="bg-amber-600 hover:bg-amber-700 text-black font-semibold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Lead
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg shadow-slate-200/50">
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Search by name, phone, or car..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-3">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterConsultant} onValueChange={setFilterConsultant}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Consultant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Consultants</SelectItem>
                  {consultants.map(c => (
                    <SelectItem key={c.name} value={c.name}>
                      {c.available !== false ? "🟢" : "🔴"} {c.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="Unassigned">Unassigned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leads Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredLeads.map((lead) => (
          <Card key={lead.id} className="border-0 shadow-lg shadow-slate-200/50 hover:shadow-xl transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {lead.lead_name?.charAt(0) || "?"}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{lead.lead_name}</h3>
                    <div className="flex items-center gap-1 flex-wrap mt-0.5">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(lead.status)}`}>
                        {lead.status}
                      </span>
                      {(() => {
                        const platform = getPlatformFromNotes(lead.notes);
                        return platform ? (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: platform.color + "22", color: platform.color, border: `1px solid ${platform.color}44` }}>
                            {platform.name}
                          </span>
                        ) : null;
                      })()}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => handleEdit(lead)}
                  >
                    <Edit className="w-4 h-4 text-slate-400" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-white/70">
                  <Phone className="w-4 h-4 text-white/40" />
                  <span className="flex-1">{lead.phone}</span>
                  <button
                    onClick={() => setCallingLead(lead)}
                    className="flex items-center gap-1 bg-green-600/20 hover:bg-green-600/40 text-green-400 text-xs font-semibold px-2 py-0.5 rounded-full border border-green-600/40 transition-all"
                  >
                    <Phone className="w-3 h-3" /> Call
                  </button>
                  <button
                    onClick={() => setWhatsappLead(lead)}
                    className="flex items-center gap-1 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 text-xs font-semibold px-2 py-0.5 rounded-full border border-emerald-600/40 transition-all"
                  >
                    💬 WA
                  </button>
                </div>
                {lead.email && (
                  <div className="flex items-center gap-2 text-white/70">
                    <Mail className="w-4 h-4 text-white/40" />
                    <a href={`mailto:${lead.email}`} className="hover:text-amber-400 truncate">{lead.email}</a>
                  </div>
                )}
                {lead.car_interested && (() => {
                  const matchedVehicle = findMatchingVehicle(lead.car_interested);
                  const hasImage = matchedVehicle?.images?.length > 0;
                  return (
                    <div className="flex items-center gap-2 text-white/70">
                      <Car className="w-4 h-4 text-white/40" />
                      {hasImage ? (
                        <button
                          onClick={() => setVehicleDialogLead(lead)}
                          className="text-left truncate text-amber-400 hover:text-amber-300 underline underline-offset-2 transition-colors cursor-pointer"
                          title="View vehicle image"
                        >
                          {lead.car_interested}
                        </button>
                      ) : (
                        <span className="truncate">{lead.car_interested}</span>
                      )}
                    </div>
                  );
                })()}
              </div>

              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/50">Consultant:</span>
                  <span className="font-medium text-white">{lead.assigned_consultant || "Unassigned"}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-white/50">Source:</span>
                  <span className="font-medium text-white">{lead.source || "Unknown"}</span>
                </div>
                {(() => {
                  const emailDate = getEmailReceivedDate(lead);
                  const displayDate = emailDate || lead.created_date;
                  const label = emailDate ? "Enquiry sent:" : "Added:";
                  return (
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-white/50">{label}</span>
                      <span className="font-medium text-white" title={moment.utc(displayDate).local().format("DD MMM YYYY, HH:mm")}>
                        {moment.utc(displayDate).local().format("DD MMM, HH:mm")} · {moment.utc(displayDate).local().fromNow()}
                      </span>
                    </div>
                  );
                })()}
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-white/50 flex items-center gap-1"><Clock className="w-3 h-3" /> Response:</span>
                  {lead.response_time_minutes != null ? (() => {
                    const s = getResponseTimeStyle(lead.response_time_minutes);
                    return (
                      <span className="font-medium text-xs px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.text }}>
                        {lead.response_time_minutes < 60
                          ? `${lead.response_time_minutes} min`
                          : `${Math.round(lead.response_time_minutes / 60 * 10) / 10} hrs`}
                      </span>
                    );
                  })() : followUps[lead.id]?.contact_method ? (
                    <span className="font-medium text-xs px-2 py-0.5 rounded-full" style={{ background: "#16a34a22", color: "#4ade80" }}>
                      {followUps[lead.id].contact_method}
                    </span>
                  ) : (
                    <span className="font-medium text-xs px-2 py-0.5 rounded-full" style={{ background: "#dc262622", color: "#f87171" }}>
                      Not recorded
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Select 
                  value={lead.status} 
                  onValueChange={(value) => handleStatusChange(lead.id, value)}
                >
                  <SelectTrigger className="flex-1 h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs border-amber-600/50 text-amber-400 hover:bg-amber-600/10"
                  onClick={() => setFollowUpLead(lead)}
                >
                  <ClipboardList className="w-3.5 h-3.5 mr-1" />
                  Follow Up
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredLeads.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-white">No leads found</h3>
          <p className="text-white/50">Try adjusting your search or filters</p>
        </div>
      )}

      {/* New Lead Notifier (sound + toast) */}
      <NewLeadNotifier onNewLead={loadLeads} />

      {/* WhatsApp Dialog */}
      {whatsappLead && (
        <WhatsAppDialog
          lead={whatsappLead}
          open={!!whatsappLead}
          onClose={() => setWhatsappLead(null)}
          onSaved={loadLeads}
        />
      )}

      {/* Call Dialog */}
      {callingLead && (
        <CallDialog
          lead={callingLead}
          open={!!callingLead}
          onClose={() => setCallingLead(null)}
          onSaved={loadLeads}
          onOptimisticUpdate={(leadId, newStatus) =>
            setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l))
          }
        />
      )}

      {/* Follow-Up Dialog */}
      {followUpLead && (
        <LeadFollowUpDialog
          lead={followUpLead}
          open={!!followUpLead}
          onClose={() => setFollowUpLead(null)}
        />
      )}

      {/* Vehicle Image Dialog */}
      <Dialog open={!!vehicleDialogLead} onOpenChange={() => setVehicleDialogLead(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-white">{vehicleDialogLead?.car_interested}</DialogTitle>
          </DialogHeader>
          {vehicleDialogLead && (() => {
            const matched = findMatchingVehicle(vehicleDialogLead.car_interested);
            return matched?.images?.length > 0 ? (
              <div className="space-y-3">
                <div className="aspect-[16/10] bg-black/30 rounded-lg overflow-hidden">
                  <img src={matched.images[0]} alt={matched.title} className="w-full h-full object-cover" />
                </div>
                <p className="text-white/60 text-sm">{matched.title}</p>
                {matched.price && <p className="text-amber-400 font-semibold">R {matched.price.toLocaleString()}</p>}
                {matched.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {matched.images.slice(1, 5).map((img, i) => (
                      <img key={i} src={img} alt={`${matched.title} ${i+2}`} className="aspect-square object-cover rounded-lg border border-white/10" />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-white/50 text-center py-8">No image available for this vehicle.</p>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Add/Edit Lead Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) { setEditingLead(null); resetForm(); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingLead ? "Edit Lead" : "Add New Lead"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Lead Name *</Label>
                <Input
                  required
                  value={form.lead_name}
                  onChange={(e) => setForm({...form, lead_name: e.target.value})}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label>Phone *</Label>
                <Input
                  required
                  value={form.phone}
                  onChange={(e) => setForm({...form, phone: e.target.value})}
                  placeholder="082 123 4567"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({...form, email: e.target.value})}
                  placeholder="john@example.com"
                />
              </div>
              <div className="col-span-2">
                <Label>Car Interested In</Label>
                <Input
                  value={form.car_interested}
                  onChange={(e) => setForm({...form, car_interested: e.target.value})}
                  placeholder="2020 Toyota Hilux"
                />
              </div>
              <div>
                <Label>Sales Consultant</Label>
                <Select value={form.assigned_consultant} onValueChange={(v) => setForm({...form, assigned_consultant: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Unassigned">Unassigned</SelectItem>
                    {consultants.map(c => (
                      <SelectItem key={c.name} value={c.name}>
                        {c.available !== false ? "🟢" : "🔴"} {c.name}{c.available === false ? " (Unavailable)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({...form, status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Lead Source</Label>
                <Select value={form.source} onValueChange={(v) => setForm({...form, source: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Response Time (min)</Label>
                <Input
                  type="number"
                  value={form.response_time_minutes}
                  onChange={(e) => setForm({...form, response_time_minutes: e.target.value})}
                  placeholder="5"
                />
              </div>
              <div className="col-span-2">
                <Label>Notes</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm({...form, notes: e.target.value})}
                  placeholder="Additional notes about the lead..."
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-amber-600 hover:bg-amber-700 text-black font-semibold">
                {editingLead ? "Save Changes" : "Add Lead"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}