import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "@/api/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Search, Phone, Mail, Car, Edit, ClipboardList, Clock, RefreshCw, MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import moment from "moment";
import LeadFollowUpDialog from "@/components/leads/LeadFollowUpDialog";
import LeadDetailSheet from "@/components/leads/LeadDetailSheet";
import CallDialog from "@/components/leads/CallDialog";
import WhatsAppDialog from "@/components/leads/WhatsAppDialog";
import NewLeadNotifier from "@/components/leads/NewLeadNotifier";
import PushNotificationSetup from "@/components/leads/PushNotificationSetup";
import VehicleImage from "@/components/VehicleImage";
import GlassCard from "@/components/premium/GlassCard";
import StatusPill from "@/components/premium/StatusPill";
import Avatar from "@/components/premium/Avatar";

const STATUSES = ["New", "Contacted", "Test Drive", "Approved", "Sold", "No Answer", "Lost"];
const SOURCES = ["Website", "Facebook", "Instagram", "TikTok", "WhatsApp", "Email", "Other"];

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [consultants, setConsultants] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [followUps, setFollowUps] = useState({});
  const [vehicleDialogLead, setVehicleDialogLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const pullStartY = useRef(0);
  const pullDistance = useRef(0);
  const [pullIndicator, setPullIndicator] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterConsultant, setFilterConsultant] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [followUpLead, setFollowUpLead] = useState(null);
  const [callingLead, setCallingLead] = useState(null);
  const [whatsappLead, setWhatsappLead] = useState(null);
  const [detailLead, setDetailLead] = useState(null);
  const [form, setForm] = useState({
    lead_name: "", phone: "", email: "", car_interested: "",
    assigned_consultant: "Unassigned", status: "New", source: "Website",
    notes: "", response_time_minutes: ""
  });

  useEffect(() => {
    loadLeads();
    api.entities.Consultant.filter({ role: "Sales", active: true }, "name", 50)
      .then(data => setConsultants(data || [])).catch(() => {});
    api.entities.Vehicle.list("title", 500)
      .then(data => setVehicles(data || [])).catch(() => {});
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("action") === "new") setShowForm(true);
    const autoRefresh = setInterval(loadLeads, 5 * 60 * 1000);
    const el = document.documentElement;
    const THRESHOLD = 80;
    const onTouchStart = (e) => { if (window.scrollY === 0) pullStartY.current = e.touches[0].clientY; };
    const onTouchMove = (e) => {
      if (!pullStartY.current) return;
      const dist = e.touches[0].clientY - pullStartY.current;
      if (dist > 0 && window.scrollY === 0) { pullDistance.current = dist; setPullIndicator(Math.min(dist / THRESHOLD, 1)); }
    };
    const onTouchEnd = async () => {
      if (pullDistance.current >= THRESHOLD) { setRefreshing(true); setPullIndicator(0); await loadLeads(); setRefreshing(false); }
      else setPullIndicator(0);
      pullStartY.current = 0; pullDistance.current = 0;
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
      api.entities.Lead.listAll("-created_date"),
      api.entities.LeadFollowUp.list("-update_date", 500)
    ]);
    const ordered = [...data].sort((a, b) => {
      const aNew = a.status === "New" ? 1 : 0;
      const bNew = b.status === "New" ? 1 : 0;
      if (aNew !== bNew) return bNew - aNew;
      return new Date(b.created_date || 0) - new Date(a.created_date || 0);
    });
    setLeads(ordered);
    const map = {};
    for (const fu of allFollowUps) { if (!map[fu.lead_id]) map[fu.lead_id] = fu; }
    setFollowUps(map);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, response_time_minutes: form.response_time_minutes ? Number(form.response_time_minutes) : null };
    if (editingLead) await api.entities.Lead.update(editingLead.id, payload);
    else await api.entities.Lead.create(payload);
    setShowForm(false); setEditingLead(null); resetForm(); loadLeads();
  };

  const resetForm = () => setForm({ lead_name: "", phone: "", email: "", car_interested: "", assigned_consultant: "Unassigned", status: "New", source: "Website", notes: "", response_time_minutes: "" });

  const handleEdit = (lead) => {
    setEditingLead(lead);
    setForm({ lead_name: lead.lead_name || "", phone: lead.phone || "", email: lead.email || "", car_interested: lead.car_interested || "", assigned_consultant: lead.assigned_consultant || "Unassigned", status: lead.status || "New", source: lead.source || "Website", notes: lead.notes || "", response_time_minutes: lead.response_time_minutes?.toString() || "" });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Note: Leads should not be deleted according to company policy. Are you sure?")) {
      await api.entities.Lead.delete(id); loadLeads();
    }
  };

  const handleStatusChange = async (leadId, newStatus) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
    await api.entities.Lead.update(leadId, { status: newStatus });
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.lead_name?.toLowerCase().includes(search.toLowerCase()) || lead.phone?.includes(search) || lead.car_interested?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "all" || lead.status === filterStatus;
    const matchesDealer = filterConsultant === "all" || lead.assigned_consultant === filterConsultant;
    return matchesSearch && matchesStatus && matchesDealer;
  });

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedLeads = filteredLeads.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => { setPage(1); }, [search, filterStatus, filterConsultant, pageSize]);

  const getEmailReceivedDate = (lead) => lead.email_received_date || null;

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

  const findMatchingVehicle = (carInterested) => {
    if (!carInterested || !vehicles.length) return null;
    const text = carInterested.toLowerCase();
    return vehicles.find(v => v.make?.toLowerCase() && v.model?.toLowerCase() && text.includes(v.make.toLowerCase()) && text.includes(v.model.toLowerCase())) || null;
  };

  const getResponseTimeStyle = (minutes) => {
    if (minutes <= 5) return { bg: "#16a34a22", text: "#4ade80" };
    if (minutes <= 30) return { bg: "#ca8a0422", text: "#facc15" };
    return { bg: "#dc262622", text: "#f87171" };
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 400 }}>
        <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {(pullIndicator > 0 || refreshing) && (
        <div style={{ display: "flex", justifyContent: "center", padding: "8px 0 4px" }}>
          <RefreshCw className={`w-5 h-5 text-amber-400 transition-transform ${refreshing ? "animate-spin" : ""}`} style={{ transform: `rotate(${pullIndicator * 180}deg)`, opacity: refreshing ? 1 : pullIndicator }} />
        </div>
      )}

      {/* Hero */}
      <div className="km-hero">
        <div>
          <h1 className="km-h1">Leads</h1>
          <div className="km-sub">{leads.length} total leads tracked</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <PushNotificationSetup />
          <button className="km-btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
            <Plus style={{ width: 16, height: 16 }} /> New Lead
          </button>
        </div>
      </div>

      {/* Filter chips */}
      <GlassCard style={{ marginBottom: 14 }}>
        <div className="km-chip-scroll" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span className={`km-chip ${filterStatus === "all" ? "active" : ""}`} onClick={() => setFilterStatus("all")}>All · {leads.length}</span>
          {STATUSES.map(s => (
            <span key={s} className={`km-chip ${filterStatus === s ? "active" : ""}`} onClick={() => setFilterStatus(s)}>{s}</span>
          ))}
        </div>
        <div className="km-leads-filters" style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "var(--mut)" }} />
            <Input placeholder="Search by name, phone, or car…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 36, background: "var(--glass)", border: "1px solid var(--glass-border)", borderRadius: 30, height: 40 }} />
          </div>
          <Select value={filterConsultant} onValueChange={setFilterConsultant}>
            <SelectTrigger className="km-filter-select" style={{ width: 180, background: "var(--glass)", border: "1px solid var(--glass-border)", borderRadius: 30, height: 40 }}>
              <SelectValue placeholder="Consultant" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Consultants</SelectItem>
              {consultants.map(c => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
              <SelectItem value="Unassigned">Unassigned</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </GlassCard>

      {/* Leads table */}
      <GlassCard>
        <div className="km-card-header">
          <div>
            All Leads
            {filteredLeads.length > 0 && (
              <div style={{ fontSize: 11, color: "var(--mut)", fontWeight: 400 }}>
                Showing {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filteredLeads.length)} of {filteredLeads.length.toLocaleString()}
              </div>
            )}
          </div>
        </div>
        {filteredLeads.length === 0 ? (
          <div className="km-empty">No leads found. Try adjusting your search or filters.</div>
        ) : (
          <>
          {/* Mobile lead cards */}
          <div className="leads-cards">
            {pagedLeads.map(lead => {
              const platform = getPlatformFromNotes(lead.notes);
              const created = moment(lead.created_date);
              const age = created.isValid() ? created.fromNow() : null;
              return (
                <button
                  key={lead.id}
                  type="button"
                  className="lead-card"
                  onClick={() => setDetailLead(lead)}
                  aria-label={`Open details for ${lead.lead_name || "lead"}`}
                >
                  <div className="lead-card-top">
                    <Avatar name={lead.lead_name || "?"} />
                    <div className="lead-card-id">
                      <div className="lead-card-name">{lead.lead_name || "Unnamed lead"}</div>
                      {lead.phone && <div className="lead-card-phone">{lead.phone}</div>}
                    </div>
                    <StatusPill status={lead.status} />
                  </div>
                  <div className="lead-card-car">
                    <Car />
                    <span>{lead.car_interested || "No vehicle specified"}</span>
                    {platform && <em style={{ background: platform.color + "22", color: platform.color }}>{platform.name}</em>}
                  </div>
                  <div className="lead-card-meta">
                    <Clock />
                    <span>{age ? `Added ${age}` : "Recently added"}</span>
                    {lead.assigned_consultant && (
                      <>
                        <span className="lead-card-dot">·</span>
                        <span className="lead-card-consultant">{lead.assigned_consultant}</span>
                      </>
                    )}
                    <ChevronRight className="lead-card-chev" />
                  </div>
                </button>
              );
            })}
          </div>

          <div className="km-table-wrap leads-table-desktop">
            <table className="km-table km-table-cards">
              <thead>
                <tr><th>Lead</th><th>Interest</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {pagedLeads.map(lead => {
                  const platform = getPlatformFromNotes(lead.notes);
                  return (
                    <tr key={lead.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 500, color: "var(--ink)" }}>
                          <Avatar name={lead.lead_name || "?"} />
                          <div>
                            <div>{lead.lead_name}</div>
                            {lead.phone && <div style={{ fontSize: 11, color: "var(--mut)", fontWeight: 400 }}>{lead.phone}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ color: "var(--mut)", maxWidth: 300 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                          <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={lead.car_interested || ""}>
                            {lead.car_interested && (() => {
                              const matched = findMatchingVehicle(lead.car_interested);
                              return matched?.images?.length > 0 ? (
                                <button onClick={() => setVehicleDialogLead(lead)} style={{ color: "var(--gold-deep)", cursor: "pointer", background: "none", border: 0, padding: 0, textAlign: "left", textDecoration: "underline" }}>{lead.car_interested}</button>
                              ) : <span>{lead.car_interested}</span>;
                            })() || "—"}
                          </div>
                          {platform && <span style={{ flexShrink: 0, fontSize: 10, padding: "2px 6px", borderRadius: 8, background: platform.color + "22", color: platform.color }}>{platform.name}</span>}
                        </div>
                      </td>
                      <td><StatusPill status={lead.status} /></td>
                      <td style={{ textAlign: "right" }}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="km-icon-btn" style={{ cursor: "pointer" }} aria-label={`Options for ${lead.lead_name}`}>
                              <MoreHorizontal style={{ width: 16, height: 16 }} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-60">
                            <DropdownMenuLabel style={{ fontSize: 11, color: "var(--mut)", fontWeight: 400 }}>Lead details</DropdownMenuLabel>
                            <div style={{ display: "grid", gap: 5, padding: "0 8px 8px", fontSize: 11.5, color: "var(--mut)" }}>
                              <div>Source: <span style={{ color: "var(--ink)" }}>{lead.source || "—"}</span></div>
                              <div>Consultant: <span style={{ color: "var(--ink)" }}>{lead.assigned_consultant || "Unassigned"}</span></div>
                              <div>Added: <span style={{ color: "var(--ink)" }}>{moment(lead.created_date).format("DD MMM YYYY, HH:mm")}</span></div>
                            </div>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleEdit(lead)} style={{ cursor: "pointer" }}><Edit style={{ width: 14, height: 14, marginRight: 8 }} /> Edit lead</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setFollowUpLead(lead)} style={{ cursor: "pointer" }}><ClipboardList style={{ width: 14, height: 14, marginRight: 8 }} /> Follow-up</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setCallingLead(lead)} style={{ cursor: "pointer" }}><Phone style={{ width: 14, height: 14, marginRight: 8 }} /> Log call</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="km-pagination" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--line)" }}>
            <button
              className="km-icon-btn"
              onClick={() => setPage(Math.max(1, safePage - 1))}
              disabled={safePage <= 1}
              aria-label="Previous page"
              style={{ cursor: safePage <= 1 ? "not-allowed" : "pointer", opacity: safePage <= 1 ? 0.4 : 1 }}
            >
              <ChevronLeft style={{ width: 16, height: 16 }} />
            </button>
            <span style={{ fontSize: 12, color: "var(--mut)" }}>Page</span>
            <Input
              type="number"
              min={1}
              max={totalPages}
              value={safePage}
              onChange={(e) => { const v = Number(e.target.value); if (Number.isInteger(v) && v >= 1 && v <= totalPages) setPage(v); }}
              aria-label="Page number"
              style={{ width: 64, height: 34, textAlign: "center", background: "var(--glass)", border: "1px solid var(--glass-border)", borderRadius: 10, fontSize: 12.5 }}
            />
            <span style={{ fontSize: 12, color: "var(--mut)" }}>of {totalPages}</span>
            <button
              className="km-icon-btn"
              onClick={() => setPage(Math.min(totalPages, safePage + 1))}
              disabled={safePage >= totalPages}
              aria-label="Next page"
              style={{ cursor: safePage >= totalPages ? "not-allowed" : "pointer", opacity: safePage >= totalPages ? 0.4 : 1 }}
            >
              <ChevronRight style={{ width: 16, height: 16 }} />
            </button>
            <div className="km-pagination-size" style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: "auto" }}>
              <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                <SelectTrigger className="km-page-size" style={{ width: 120, height: 34, background: "var(--glass)", border: "1px solid var(--glass-border)", borderRadius: 10, fontSize: 12 }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[50, 100, 200, 500].map(n => <SelectItem key={n} value={String(n)}>{n} rows</SelectItem>)}
                </SelectContent>
              </Select>
              <span style={{ fontSize: 12, color: "var(--mut)", whiteSpace: "nowrap" }}>{filteredLeads.length.toLocaleString()} records</span>
            </div>
          </div>
          </>
        )}
      </GlassCard>

      {detailLead && (
        <LeadDetailSheet
          key={detailLead.id}
          lead={detailLead}
          platform={getPlatformFromNotes(detailLead.notes)}
          open={!!detailLead}
          onClose={() => setDetailLead(null)}
          onEdit={(lead) => { setDetailLead(null); handleEdit(lead); }}
          onFollowUp={(lead) => { setDetailLead(null); setFollowUpLead(lead); }}
          onLogCall={(lead) => { setDetailLead(null); setCallingLead(lead); }}
          onWhatsApp={(lead) => { setDetailLead(null); setWhatsappLead(lead); }}
        />
      )}

      <NewLeadNotifier onNewLead={loadLeads} />
      {whatsappLead && <WhatsAppDialog lead={whatsappLead} open={!!whatsappLead} onClose={() => setWhatsappLead(null)} onSaved={loadLeads} />}
      {callingLead && <CallDialog lead={callingLead} open={!!callingLead} onClose={() => setCallingLead(null)} onSaved={loadLeads} onOptimisticUpdate={(leadId, newStatus) => setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l))} />}
      {followUpLead && <LeadFollowUpDialog lead={followUpLead} open={!!followUpLead} onClose={() => setFollowUpLead(null)} />}

      {/* Vehicle image dialog */}
      <Dialog open={!!vehicleDialogLead} onOpenChange={() => setVehicleDialogLead(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>{vehicleDialogLead?.car_interested}</DialogTitle></DialogHeader>
          {vehicleDialogLead && (() => {
            const matched = findMatchingVehicle(vehicleDialogLead.car_interested);
            return matched?.images?.length > 0 ? (
              <div className="space-y-3">
                <div className="aspect-[16/10] bg-gray-200/60 rounded-lg overflow-hidden">
                  <VehicleImage src={matched.images[0]} alt={matched.title} className="w-full h-full object-cover" />
                </div>
                <p className="text-gray-600 text-sm">{matched.title}</p>
                {matched.price && <p className="text-amber-400 font-semibold">R {matched.price.toLocaleString()}</p>}
                {matched.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {matched.images.slice(1, 5).map((img, i) => <VehicleImage key={i} src={img} alt={`${matched.title} ${i+2}`} className="aspect-square object-cover rounded-lg border border-amber-200/60" />)}
                  </div>
                )}
              </div>
            ) : <p className="text-gray-500 text-center py-8">No image available for this vehicle.</p>;
          })()}
        </DialogContent>
      </Dialog>

      {/* Add/Edit Lead Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) { setEditingLead(null); resetForm(); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingLead ? "Edit Lead" : "Add New Lead"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2"><Label>Lead Name *</Label><Input required value={form.lead_name} onChange={(e) => setForm({...form, lead_name: e.target.value})} placeholder="John Doe" /></div>
              <div><Label>Phone *</Label><Input required value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} placeholder="082 123 4567" /></div>
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} placeholder="john@example.com" /></div>
              <div className="sm:col-span-2"><Label>Car Interested In</Label><Input value={form.car_interested} onChange={(e) => setForm({...form, car_interested: e.target.value})} placeholder="2020 Toyota Hilux" /></div>
              <div><Label>Sales Consultant</Label><Select value={form.assigned_consultant} onValueChange={(v) => setForm({...form, assigned_consultant: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Unassigned">Unassigned</SelectItem>{consultants.map(c => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Status</Label><Select value={form.status} onValueChange={(v) => setForm({...form, status: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Lead Source</Label><Select value={form.source} onValueChange={(v) => setForm({...form, source: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Response Time (min)</Label><Input type="number" value={form.response_time_minutes} onChange={(e) => setForm({...form, response_time_minutes: e.target.value})} placeholder="5" /></div>
              <div className="sm:col-span-2"><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} placeholder="Additional notes about the lead..." rows={3} /></div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
              <Button type="submit" className="flex-1 bg-amber-600 hover:bg-amber-700 text-black font-semibold">{editingLead ? "Save Changes" : "Add Lead"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
