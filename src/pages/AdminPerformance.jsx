import { useState, useEffect } from "react";
import { api } from "@/api/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users, TrendingUp, Phone, PhoneOff, Clock, CheckCircle2,
  AlertCircle, Star, Award, BarChart2, Bell, LogOut, ChevronLeft, ChevronRight, UserCheck, Link, Copy, Check
} from "lucide-react";
import moment from "moment";
import StatusPill from "@/components/premium/StatusPill";

const GOLD = "#ff9d00";

const PIPELINE_STAGES = [
  "Initial Contact", "Engaged", "Test Drive Booked", "Test Drive Done",
  "With Sales Department", "With Finance", "Application Submitted",
  "Application Approved", "Deal Closed - Sold", "Deal Closed - Not Buying", "Application Failed"
];

export default function AdminPerformance() {
  const [leads, setLeads] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState(moment().subtract(1, "day").format("YYYY-MM-DD"));
  const [showReminder, setShowReminder] = useState(true);
  const [selectedConsultant, setSelectedConsultant] = useState(null);
  const [teamView, setTeamView] = useState("sales"); // "sales" | "callcentre" | "manage"
  const [consultants, setConsultants] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newConsultantName, setNewConsultantName] = useState("");
  const [newConsultantRole, setNewConsultantRole] = useState("Sales");
  const [newConsultantEmail, setNewConsultantEmail] = useState("");
  const [newConsultantPhone, setNewConsultantPhone] = useState("");
  const [newConsultantWhatsapp, setNewConsultantWhatsapp] = useState("");
  const [newConsultantIsManager, setNewConsultantIsManager] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editWhatsapp, setEditWhatsapp] = useState("");
  const [editIsManager, setEditIsManager] = useState(false);

  useEffect(() => {
    api.auth.me().then(u => {
      setUser(u);
      if (u?.role !== "admin") {
        window.location.href = "/";
      }
    }).catch(() => { window.location.href = "/"; });
    loadData();
    loadConsultants();
  }, []);

  const loadConsultants = async () => {
    const res = await api.functions.invoke("getConsultants", {});
    setConsultants(res.data?.consultants || []);
  };

  const loadData = async () => {
    const [leadsData, followUpsData] = await Promise.all([
      api.entities.Lead.list("-created_date", 500),
      api.entities.LeadFollowUp.list("-update_date", 1000),
    ]);
    setLeads(leadsData);
    setFollowUps(followUpsData);
    setLoading(false);
  };

  const isYesterday = selectedDate === moment().subtract(1, "day").format("YYYY-MM-DD");

  // Helper: check if lead's email_received_date falls within working hours (7:30-18:00 SAST = 5:30-16:00 UTC)
  const isWorkingHours = (lead) => {
    const emailDate = lead.email_received_date;
    if (!emailDate) return false; // Can't determine — exclude from averages
    const m = moment.utc(emailDate);
    const utcMinutes = m.hour() * 60 + m.minute();
    return utcMinutes >= 330 && utcMinutes < 960; // 5:30-16:00 UTC
  };

  // Leads received on selected date
  const leadsOnDate = leads.filter(l =>
    moment(l.created_date).format("YYYY-MM-DD") === selectedDate
  );

  // Follow ups logged on selected date
  const followUpsOnDate = followUps.filter(f => f.update_date === selectedDate);

  const getConsultantStats = (consultant) => {
    const myLeads = leadsOnDate.filter(l => l.assigned_consultant === consultant);
    const myFollowUps = followUpsOnDate.filter(f => f.reported_by === consultant);

    // Leads that had any follow up on that day
    const calledLeadIds = new Set(
      followUpsOnDate
        .filter(f => f.reported_by === consultant && f.contact_method !== "No Contact Attempted")
        .map(f => f.lead_id)
    );

    // All leads assigned to consultant (ever) that were NOT called on that day
    const allMyLeads = leads.filter(l =>
      l.assigned_consultant === consultant && l.status !== "Sold" && l.status !== "Lost"
    );
    const notCalledCount = allMyLeads.filter(l => !calledLeadIds.has(l.id)).length;

    // Average response time for leads received that day (working hours only, responded only)
    const leadsWithResponse = myLeads.filter(l => l.response_time_minutes && isWorkingHours(l));
    const avgResponse = leadsWithResponse.length > 0
      ? Math.round(leadsWithResponse.reduce((sum, l) => sum + l.response_time_minutes, 0) / leadsWithResponse.length)
      : null;

    // Total sold by consultant ever
    const totalSold = leads.filter(l => l.assigned_consultant === consultant && l.status === "Sold").length;

    // Pipeline stages breakdown
    const stageMap = {};
    myFollowUps.forEach(f => {
      stageMap[f.pipeline_stage] = (stageMap[f.pipeline_stage] || 0) + 1;
    });

    return {
      consultant,
      newLeads: myLeads.length,
      calledCount: calledLeadIds.size,
      notCalledCount,
      avgResponse,
      followUpCount: myFollowUps.length,
      totalSold,
      stageMap,
      leadList: myLeads,
    };
  };

  const consultantNames = consultants.filter(c => c.role === "Sales").map(c => c.name);
  const ccAgentNames = consultants.filter(c => c.role === "Call Centre").map(c => c.name);

  const allStats = consultantNames.map(name => {
    const c = consultants.find(x => x.name === name);
    const myLeads = leadsOnDate.filter(l => l.assigned_consultant === name);
    const myFollowUps = followUpsOnDate.filter(f => f.reported_by === name);
    const calledLeadIds = new Set(
      followUpsOnDate
        .filter(f => f.reported_by === name && f.contact_method !== "No Contact Attempted")
        .map(f => f.lead_id)
    );
    const allMyLeads = leads.filter(l =>
      l.assigned_consultant === name && l.status !== "Sold" && l.status !== "Lost"
    );
    const notCalledCount = allMyLeads.filter(l => !calledLeadIds.has(l.id)).length;
    const leadsWithResponse = myLeads.filter(l => l.response_time_minutes && isWorkingHours(l));
    const avgResponse = leadsWithResponse.length > 0
      ? Math.round(leadsWithResponse.reduce((sum, l) => sum + l.response_time_minutes, 0) / leadsWithResponse.length)
      : null;
    const totalSold = leads.filter(l => l.assigned_consultant === name && l.status === "Sold").length;
    const stageMap = {};
    myFollowUps.forEach(f => {
      stageMap[f.pipeline_stage] = (stageMap[f.pipeline_stage] || 0) + 1;
    });
    return { consultant: name, newLeads: myLeads.length, calledCount: calledLeadIds.size, notCalledCount, avgResponse, followUpCount: myFollowUps.length, totalSold, stageMap, leadList: myLeads };
  });

  const getCCAgentStats = (agent) => {
    const agentFollowUps = followUpsOnDate.filter(f => f.reported_by === agent);
    const calledCount = agentFollowUps.filter(f => f.contact_method !== "No Contact Attempted").length;
    const allocatedLeadIds = new Set(agentFollowUps.map(f => f.lead_id));
    // Leads that were unassigned and are now assigned (check follow-up notes as proxy)
    const allocatedToConsultants = {};
    agentFollowUps.forEach(f => {
      const lead = leads.find(l => l.id === f.lead_id);
      if (lead?.assigned_consultant && lead.assigned_consultant !== "Unassigned") {
        allocatedToConsultants[lead.assigned_consultant] = (allocatedToConsultants[lead.assigned_consultant] || 0) + 1;
      }
    });
    const totalFollowUps = agentFollowUps.length;
    const responses = {
      interested: agentFollowUps.filter(f => f.lead_response === "Answered - Interested").length,
      notInterested: agentFollowUps.filter(f => f.lead_response === "Answered - Not Interested").length,
      noAnswer: agentFollowUps.filter(f => f.lead_response === "No Answer").length,
    };
    return { agent, calledCount, totalFollowUps, allocatedToConsultants, responses, uniqueLeads: allocatedLeadIds.size };
  };

  const allCCStats = ccAgentNames.map(name => getCCAgentStats(name));

  const totalNewLeads = leadsOnDate.length;
  const totalCalled = new Set(followUpsOnDate.filter(f => f.contact_method !== "No Contact Attempted").map(f => f.lead_id)).size;
  const totalNotCalled = leads.filter(l =>
    l.status !== "Sold" && l.status !== "Lost" &&
    !followUpsOnDate.find(f => f.lead_id === l.id && f.contact_method !== "No Contact Attempted")
  ).length;
  const avgResponseAll = (() => {
    const r = leadsOnDate.filter(l => l.response_time_minutes && isWorkingHours(l));
    return r.length ? Math.round(r.reduce((s, l) => s + l.response_time_minutes, 0) / r.length) : null;
  })();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-4 border-amber-700 border-t-amber-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="km-hero">
        <div>
          <h1 className="km-h1">Performance Monitor</h1>
          <div className="km-sub">Koos & Mike Cars · Internal only</div>
        </div>
      </div>

      <div className="space-y-8">

        {/* Portal Links — only for Blaq Telecoms admin */}
        {user?.email?.toLowerCase().includes("blaq") && (
          <PortalLinks />
        )}

        {/* Morning Reminder Banner */}
        {showReminder && isYesterday && (
          <div className="rounded-2xl p-5 border flex items-start gap-4" style={{ background: "var(--glass)", borderColor: "var(--glass-border)" }}>
            <Bell className="w-6 h-6 mt-0.5 shrink-0" style={{ color: GOLD }} />
            <div className="flex-1">
              <p className="font-bold text-gray-900">Good morning! 🌅 Time to review yesterday's performance.</p>
              <p className="text-sm mt-1" style={{ color: "var(--mut)" }}>
                Yesterday ({moment().subtract(1, "day").format("DD MMM YYYY")}): <strong className="text-gray-900">{totalNewLeads} new leads received</strong> — {totalCalled} called, {totalNotCalled} not yet contacted.
                {avgResponseAll !== null && ` Avg response (working hours): ${avgResponseAll} min.`}
              </p>
            </div>
            <button onClick={() => setShowReminder(false)} className="text-xs hover:underline" style={{ color: "var(--mut)" }}>Dismiss</button>
          </div>
        )}

        {/* Date Selector */}
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900">Daily Performance Report</h2>
          <div className="flex items-center gap-2 ml-auto rounded-xl border overflow-hidden" style={{ borderColor: "var(--glass-border)" }}>
            <button
              onClick={() => setSelectedDate(moment(selectedDate).subtract(1, "day").format("YYYY-MM-DD"))}
              className="p-2 hover:bg-white/70 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" style={{ color: "var(--mut)" }} />
            </button>
            <div className="px-4 py-2 text-gray-900 text-sm font-medium" style={{ background: "var(--glass)" }}>
              {moment(selectedDate).format("dddd, DD MMM YYYY")}
              {isYesterday && <span className="ml-2 text-xs" style={{ color: GOLD }}>(Yesterday)</span>}
              {selectedDate === moment().format("YYYY-MM-DD") && <span className="ml-2 text-xs" style={{ color: "var(--mut)" }}>(Today)</span>}
            </div>
            <button
              onClick={() => setSelectedDate(moment(selectedDate).add(1, "day").format("YYYY-MM-DD"))}
              disabled={selectedDate >= moment().format("YYYY-MM-DD")}
              className="p-2 hover:bg-white/70 transition-colors disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" style={{ color: "var(--mut)" }} />
            </button>
          </div>
        </div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard icon={<Users className="w-6 h-6" />} label="New Leads" value={totalNewLeads} />
          <KpiCard icon={<Phone className="w-6 h-6" />} label="Leads Called" value={totalCalled} />
          <KpiCard icon={<PhoneOff className="w-6 h-6" />} label="Not Contacted" value={totalNotCalled} />
          <KpiCard icon={<Clock className="w-6 h-6" />} label="Avg Response" value={avgResponseAll !== null ? `${avgResponseAll}m` : "N/A"} />
        </div>

        {/* Team Toggle */}
        <div className="flex gap-2 flex-wrap">
          {[["sales", "Sales Consultants"], ["callcentre", "Call Centre"], ["manage", "Manage Staff"]].map(([v, l]) => (
            <button key={v} onClick={() => { setTeamView(v); setSelectedConsultant(null); }}
              className="px-5 py-2.5 rounded-xl text-sm font-bold border transition-all"
              style={teamView === v
                ? { background: GOLD, color: "#000", borderColor: "transparent" }
                : { background: "transparent", color: "var(--mut)", borderColor: "var(--glass-border)" }}>
              {l}
            </button>
          ))}
        </div>

        {teamView === "sales" && (
          <>
            {/* Consultant Selector Tabs */}
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setSelectedConsultant(null)}
                className="px-4 py-2 rounded-xl text-sm font-semibold transition-all border"
                style={!selectedConsultant ? { background: GOLD, color: "#000", borderColor: "transparent" } : { background: "transparent", color: "var(--mut)", borderColor: "var(--glass-border)" }}>
                All Consultants
              </button>
              {consultantNames.map(c => (
                <button key={c} onClick={() => setSelectedConsultant(c)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold transition-all border"
                  style={selectedConsultant === c ? { background: GOLD, color: "#000", borderColor: "transparent" } : { background: "transparent", color: "var(--mut)", borderColor: "var(--glass-border)" }}>
                  {c}
                </button>
              ))}
            </div>
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {allStats.filter(s => !selectedConsultant || s.consultant === selectedConsultant).map(stats => (
                <ConsultantCard key={stats.consultant} stats={stats} />
              ))}
            </div>
          </>
        )}

        {teamView === "callcentre" && (
          <>
            <div className="rounded-2xl border p-4 flex items-center gap-3" style={{ borderColor: "var(--glass-border)", background: "var(--glass)" }}>
              <Phone className="w-5 h-5" style={{ color: GOLD }} />
              <p className="text-sm" style={{ color: "var(--mut)" }}>Call Centre agents call leads and allocate them to sales consultants. Their activity is tracked below.</p>
            </div>
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {allCCStats.map(stats => <CCAgentCard key={stats.agent} stats={stats} />)}
            </div>

            {/* CC Follow-up Detail Table */}
            {followUpsOnDate.filter(f => ccAgentNames.includes(f.reported_by)).length > 0 && (
              <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--glass-border)" }}>
                <div className="px-6 py-4 border-b" style={{ background: "var(--line)", borderColor: "var(--glass-border)" }}>
                  <h3 className="text-gray-900 font-bold flex items-center gap-2">
                    <Phone className="w-4 h-4" style={{ color: GOLD }} />
                    Call Centre Activity — {moment(selectedDate).format("DD MMM YYYY")}
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--line)" }}>
                        {["Agent", "Lead", "Contact Method", "Lead Response", "Pipeline Stage", "Allocated To", "Notes"].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--mut)" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {followUpsOnDate.filter(f => ccAgentNames.includes(f.reported_by)).map((fu) => {
                        const lead = leads.find(l => l.id === fu.lead_id);
                        return (
                          <tr key={fu.id} style={{ borderBottom: "1px solid var(--line)" }}>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: "var(--line)", color: "var(--ink)" }}>{fu.reported_by}</span>
                            </td>
                            <td className="px-4 py-3 text-gray-900 font-medium">{fu.lead_name || lead?.lead_name || "—"}</td>
                            <td className="px-4 py-3 text-gray-600">{fu.contact_method || "—"}</td>
                            <td className="px-4 py-3 text-gray-600">{fu.lead_response || "—"}</td>
                            <td className="px-4 py-3 text-gray-600">{fu.pipeline_stage || "—"}</td>
                            <td className="px-4 py-3">
                              {lead?.assigned_consultant && lead.assigned_consultant !== "Unassigned"
                                ? <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: "rgba(255,157,0,.14)", color: GOLD }}>{lead.assigned_consultant}</span>
                                : <span className="text-gray-400 text-xs">Unassigned</span>}
                            </td>
                            <td className="px-4 py-3 text-gray-400 text-xs max-w-xs truncate">{fu.notes || "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {teamView === "manage" && (
          <>
            <div className="rounded-2xl border p-5 flex items-center gap-3" style={{ borderColor: "var(--glass-border)", background: "var(--glass)" }}>
              <Users className="w-5 h-5" style={{ color: GOLD }} />
              <p className="text-sm" style={{ color: "var(--mut)" }}>
                {user?.role === 'admin' && user?.email && ["heino", "koos"].some(name => user.email.toLowerCase().includes(name)) 
                  ? "Manage your sales team"
                  : "Add sales consultants and call centre agents manually without requiring login credentials."}
              </p>
            </div>

            {/* Add Staff Form */}
            {showAddForm && (
              <div className="rounded-2xl border p-6 space-y-4" style={{ borderColor: "var(--glass-border)", background: "var(--glass)" }}>
                <h3 className="text-gray-900 font-bold text-lg">Add New Staff Member</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-gray-900 text-sm font-medium block mb-1">Name</label>
                    <input
                      type="text"
                      value={newConsultantName}
                      onChange={(e) => setNewConsultantName(e.target.value)}
                      placeholder="Enter staff name"
                      className="w-full rounded-lg px-4 py-2 bg-white/60 border text-gray-900"
                      style={{ borderColor: "var(--glass-border)" }}
                    />
                  </div>
                  <div>
                    <label className="text-gray-900 text-sm font-medium block mb-1">Role</label>
                    <select
                      value={newConsultantRole}
                      onChange={(e) => setNewConsultantRole(e.target.value)}
                      className="w-full rounded-lg px-4 py-2 bg-white/60 border text-gray-900"
                      style={{ borderColor: "var(--glass-border)" }}
                    >
                      <option value="Sales">Sales Consultant</option>
                      <option value="Call Centre">Call Centre Agent</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-gray-900 text-sm font-medium block mb-1">Email</label>
                    <input
                      type="email"
                      value={newConsultantEmail}
                      onChange={(e) => setNewConsultantEmail(e.target.value)}
                      placeholder="Enter email"
                      className="w-full rounded-lg px-4 py-2 bg-white/60 border text-gray-900"
                      style={{ borderColor: "var(--glass-border)" }}
                    />
                  </div>
                  <div>
                    <label className="text-gray-900 text-sm font-medium block mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={newConsultantPhone}
                      onChange={(e) => setNewConsultantPhone(e.target.value)}
                      placeholder="Enter phone number"
                      className="w-full rounded-lg px-4 py-2 bg-white/60 border text-gray-900"
                      style={{ borderColor: "var(--glass-border)" }}
                    />
                  </div>
                  <div>
                    <label className="text-gray-900 text-sm font-medium block mb-1">WhatsApp Number</label>
                    <input
                      type="text"
                      value={newConsultantWhatsapp}
                      onChange={(e) => setNewConsultantWhatsapp(e.target.value)}
                      placeholder="Enter WhatsApp number"
                      className="w-full rounded-lg px-4 py-2 bg-white/60 border text-gray-900"
                      style={{ borderColor: "var(--glass-border)" }}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isManager"
                      checked={newConsultantIsManager}
                      onChange={(e) => setNewConsultantIsManager(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <label htmlFor="isManager" className="text-gray-900 text-sm font-medium">Is Manager</label>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={async () => {
                      if (!newConsultantName.trim()) return;
                      await api.entities.Consultant.create({
                        name: newConsultantName,
                        role: newConsultantRole,
                        email: newConsultantEmail,
                        phone: newConsultantPhone,
                        whatsapp_number: newConsultantWhatsapp,
                        is_manager: newConsultantIsManager,
                        active: true
                      });
                      await loadConsultants();
                      setNewConsultantName("");
                      setNewConsultantEmail("");
                      setNewConsultantPhone("");
                      setNewConsultantWhatsapp("");
                      setNewConsultantRole("Sales");
                      setNewConsultantIsManager(false);
                      setShowAddForm(false);
                    }}
                    style={{ background: GOLD, color: "#000" }}
                  >
                    Add Staff
                  </Button>
                  <Button onClick={() => setShowAddForm(false)} variant="outline">Cancel</Button>
                </div>
              </div>
            )}

            {!showAddForm && !editingStaff && (
              <Button onClick={() => setShowAddForm(true)} style={{ background: GOLD, color: "#000" }} className="gap-2">
                <Users className="w-4 h-4" /> Add Staff Member
              </Button>
            )}

            {/* Edit Staff Form */}
            {editingStaff && (
              <div className="rounded-2xl border p-6 space-y-4" style={{ borderColor: "var(--glass-border)", background: "var(--glass)" }}>
                <h3 className="text-gray-900 font-bold text-lg">Edit Staff Member</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-gray-900 text-sm font-medium block mb-1">Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full rounded-lg px-4 py-2 bg-white/60 border text-gray-900"
                      style={{ borderColor: "var(--glass-border)" }}
                    />
                  </div>
                  <div>
                    <label className="text-gray-900 text-sm font-medium block mb-1">Email</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full rounded-lg px-4 py-2 bg-white/60 border text-gray-900"
                      style={{ borderColor: "var(--glass-border)" }}
                    />
                  </div>
                  <div>
                    <label className="text-gray-900 text-sm font-medium block mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full rounded-lg px-4 py-2 bg-white/60 border text-gray-900"
                      style={{ borderColor: "var(--glass-border)" }}
                    />
                  </div>
                  <div>
                    <label className="text-gray-900 text-sm font-medium block mb-1">WhatsApp Number</label>
                    <input
                      type="text"
                      value={editWhatsapp}
                      onChange={(e) => setEditWhatsapp(e.target.value)}
                      className="w-full rounded-lg px-4 py-2 bg-white/60 border text-gray-900"
                      style={{ borderColor: "var(--glass-border)" }}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="editIsManager"
                      checked={editIsManager}
                      onChange={(e) => setEditIsManager(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <label htmlFor="editIsManager" className="text-gray-900 text-sm font-medium">Is Manager</label>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={async () => {
                      await api.entities.Consultant.update(editingStaff.id, {
                        name: editName,
                        email: editEmail,
                        phone: editPhone,
                        whatsapp_number: editWhatsapp,
                        is_manager: editIsManager
                      });
                      await loadConsultants();
                      setEditingStaff(null);
                    }}
                    style={{ background: GOLD, color: "#000" }}
                  >
                    Save Changes
                  </Button>
                  <Button onClick={() => setEditingStaff(null)} variant="outline">Cancel</Button>
                </div>
              </div>
            )}

            {/* Staff List */}
            <div className="space-y-4">
              {(() => {
                // Check if user is a sales manager (Heino or Koos)
                const isSalesManager = user?.role === 'admin' && user?.email && ["heino", "koos"].some(name => user.email.toLowerCase().includes(name));
                const rolesToShow = isSalesManager ? ["Sales"] : ["Sales", "Call Centre"];
                
                return rolesToShow.map(role => {
                  const staffByRole = consultants.filter(c => c.role === role);
                  if (staffByRole.length === 0) return null;
                return (
                  <div key={role} className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--glass-border)" }}>
                    <div className="px-6 py-4 border-b" style={{ background: "var(--line)", borderColor: "var(--glass-border)" }}>
                      <h3 className="text-gray-900 font-bold">{role === "Sales" ? "Sales Consultants" : "Call Centre Agents"} ({staffByRole.length})</h3>
                    </div>
                    <div className="divide-y" style={{ borderColor: "var(--line)" }}>
                      {staffByRole.map(staff => (
                        <div key={staff.id} className="px-6 py-4 hover:bg-black/5 transition-colors">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <p className="text-gray-900 font-semibold">{staff.name}</p>
                                {staff.is_manager && <span className="text-xs px-2 py-1 rounded" style={{ background: "rgba(255,157,0,.14)", color: GOLD }}>Manager</span>}
                              </div>
                              <div className="space-y-1 text-sm">
                                {staff.email && <p className="text-gray-600">{staff.email}</p>}
                                {staff.phone && <p className="text-gray-600">📞 {staff.phone}</p>}
                                {staff.whatsapp_number && <p className="text-gray-600">💬 {staff.whatsapp_number}</p>}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => {
                                  setEditingStaff(staff);
                                  setEditName(staff.name);
                                  setEditEmail(staff.email || "");
                                  setEditPhone(staff.phone || "");
                                  setEditWhatsapp(staff.whatsapp_number || "");
                                  setEditIsManager(staff.is_manager || false);
                                }}
                                size="sm"
                              >
                                Edit
                              </Button>
                              <Button
                                onClick={async () => {
                                  if (confirm(`Reset password for ${staff.name}? They will need to set a new password on next login.`)) {
                                    await api.functions.invoke("resetConsultantPassword", { consultant_id: staff.id });
                                    alert("Password reset. User must set new password on next login.");
                                  }
                                }}
                                size="sm"
                                variant="outline"
                              >
                                Reset Password
                              </Button>
                              <Button
                                onClick={async () => {
                                  if (confirm(`Remove ${staff.name}?`)) {
                                    await api.entities.Consultant.update(staff.id, { active: false });
                                    await loadConsultants();
                                  }
                                }}
                                variant="destructive"
                                size="sm"
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              });
              })()}
            </div>
          </>
        )}

        {/* Leads received that day — detail table */}
        {leadsOnDate.length > 0 && (
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--glass-border)" }}>
            <div className="px-6 py-4 border-b" style={{ background: "var(--line)", borderColor: "var(--glass-border)" }}>
              <h3 className="text-gray-900 font-bold flex items-center gap-2">
                <Star className="w-4 h-4" style={{ color: GOLD }} />
                Leads Received — {moment(selectedDate).format("DD MMM YYYY")} ({leadsOnDate.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--line)" }}>
                    {["Lead Name", "Phone", "Car Interested", "Consultant", "Status", "Response Time", "Called?"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--mut)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leadsOnDate
                    .filter(l => !selectedConsultant || l.assigned_consultant === selectedConsultant)
                    .map((lead) => {
                      const wasCalled = followUpsOnDate.some(f =>
                        f.lead_id === lead.id && f.contact_method !== "No Contact Attempted"
                      );
                      return (
                        <tr key={lead.id} style={{ borderBottom: "1px solid var(--line)" }}>
                          <td className="px-4 py-3 text-gray-900 font-medium">{lead.lead_name}</td>
                          <td className="px-4 py-3 text-gray-600">{lead.phone}</td>
                          <td className="px-4 py-3 text-gray-600">{lead.car_interested || "—"}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: "rgba(255,157,0,.14)", color: GOLD }}>
                              {lead.assigned_consultant || "Unassigned"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <StatusPill status={lead.status} />
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {lead.response_time_minutes ? `${lead.response_time_minutes} min` : "—"}
                          </td>
                          <td className="px-4 py-3">
                            {wasCalled
                              ? <span className="flex items-center gap-1 text-xs" style={{ color: "var(--mut)" }}><CheckCircle2 className="w-3.5 h-3.5" /> Called</span>
                              : <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: "var(--ink)" }}><AlertCircle className="w-3.5 h-3.5" /> Not Called</span>}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <footer className="border-t pt-6 text-center text-xs" style={{ borderColor: "var(--line)", color: "var(--mut)" }}>
          Admin Performance Dashboard · Koos & Mike Cars · Internal Use Only
        </footer>
      </div>
    </div>
  );
}

function KpiCard({ icon, label, value }) {
  return (
    <div className="rounded-2xl p-5 border flex items-center gap-4" style={{ background: "var(--glass)", borderColor: "var(--glass-border)" }}>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--line)", color: "var(--mut)" }}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--mut)" }}>{label}</p>
        <p className="text-3xl font-extrabold mt-0.5" style={{ color: "var(--ink)" }}>{value}</p>
      </div>
    </div>
  );
}

function ConsultantCard({ stats }) {
  const callRate = stats.calledCount + stats.notCalledCount > 0
    ? Math.round((stats.calledCount / (stats.calledCount + stats.notCalledCount)) * 100)
    : 0;

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--glass)", borderColor: "var(--glass-border)" }}>
      {/* Header */}
      <div className="px-5 py-4 border-b flex items-center gap-3" style={{ borderColor: "var(--line)" }}>
        <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg text-black" style={{ background: "var(--gold)" }}>
          {stats.consultant[0]}
        </div>
        <div className="flex-1">
          <p className="text-gray-900 font-bold text-lg">{stats.consultant}</p>
          <p className="text-xs" style={{ color: "var(--mut)" }}>Sales Consultant</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-extrabold" style={{ color: "var(--ink)" }}>{stats.totalSold}</p>
          <p className="text-xs" style={{ color: "var(--mut)" }}>Total Sold</p>
        </div>
      </div>

      {/* Stats */}
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <MiniStat label="New Leads" value={stats.newLeads} />
          <MiniStat label="Follow-Ups Logged" value={stats.followUpCount} />
          <MiniStat label="Leads Called" value={stats.calledCount} />
          <MiniStat label="Not Contacted" value={stats.notCalledCount} />
        </div>

        {stats.avgResponse !== null && (
          <div className="flex items-center gap-2 rounded-xl px-4 py-3 border" style={{ background: "var(--line)", borderColor: "transparent" }}>
            <Clock className="w-4 h-4" style={{ color: "var(--mut)" }} />
            <span className="text-sm" style={{ color: "var(--mut)" }}>Avg response time: <strong style={{ color: "var(--ink)" }}>{stats.avgResponse} min</strong></span>
          </div>
        )}

        {/* Call Rate Progress */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span style={{ color: "var(--mut)" }}>Contact Rate</span>
            <span className="font-semibold" style={{ color: "var(--ink)" }}>{callRate}%</span>
          </div>
          <div className="w-full h-2 rounded-full" style={{ background: "var(--line)" }}>
            <div className="h-2 rounded-full transition-all" style={{ width: `${callRate}%`, background: "var(--gold)" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-xl p-3 border text-center" style={{ background: "var(--line)", borderColor: "transparent" }}>
      <p className="text-2xl font-extrabold" style={{ color: "var(--ink)" }}>{value}</p>
      <p className="text-xs mt-0.5" style={{ color: "var(--mut)" }}>{label}</p>
    </div>
  );
}

function PortalLinks() {
  const [copiedStaff, setCopiedStaff] = useState(false);
  const [copiedCC, setCopiedCC] = useState(false);

  const staffUrl = `${window.location.origin}/staff`;
  const ccUrl = `${window.location.origin}/CCLanding`;

  const copy = async (url, setter) => {
    await navigator.clipboard.writeText(url);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  return (
    <div className="rounded-2xl border p-5 space-y-4" style={{ borderColor: "var(--glass-border)", background: "var(--glass)" }}>
      <div className="flex items-center gap-2">
        <Link className="w-4 h-4" style={{ color: "var(--gold)" }} />
        <h3 className="font-bold text-gray-900 text-sm">Portal Links</h3>
        <span className="text-xs text-gray-400 ml-1">Share these with your staff</span>
      </div>
      <div className="space-y-3">
        {/* Staff (Sales) Portal */}
        <div className="flex items-center gap-3 rounded-xl border px-4 py-3" style={{ background: "var(--glass)", borderColor: "#C9A84C22" }}>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-500 mb-0.5">Sales Staff Portal</p>
            <p className="text-sm font-mono truncate" style={{ color: "var(--ink)" }}>{staffUrl}</p>
          </div>
          <button
            onClick={() => copy(staffUrl, setCopiedStaff)}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{ background: "var(--line)", color: copiedStaff ? "var(--gold)" : "var(--ink)", border: "1px solid var(--glass-border)" }}
          >
            {copiedStaff ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
          </button>
        </div>
        {/* Call Centre Portal */}
        <div className="flex items-center gap-3 rounded-xl border px-4 py-3" style={{ background: "var(--glass)", borderColor: "var(--glass-border)" }}>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-500 mb-0.5">Call Centre Portal</p>
            <p className="text-sm font-mono truncate" style={{ color: "var(--ink)" }}>{ccUrl}</p>
          </div>
          <button
            onClick={() => copy(ccUrl, setCopiedCC)}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{ background: "var(--line)", color: copiedCC ? "var(--gold)" : "var(--ink)", border: "1px solid var(--glass-border)" }}
          >
            {copiedCC ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function CCAgentCard({ stats }) {
  const allocations = Object.entries(stats.allocatedToConsultants);
  return (
    <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--glass)", borderColor: "var(--glass-border)" }}>
      {/* Header */}
      <div className="px-5 py-4 border-b flex items-center gap-3" style={{ borderColor: "var(--line)" }}>
        <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg" style={{ background: "var(--line)", color: "var(--ink)" }}>
          {stats.agent[0]}
        </div>
        <div className="flex-1">
          <p className="text-gray-900 font-bold text-lg">{stats.agent}</p>
          <p className="text-xs" style={{ color: "var(--mut)" }}>Call Centre Agent</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-extrabold" style={{ color: "var(--ink)" }}>{stats.calledCount}</p>
          <p className="text-xs" style={{ color: "var(--mut)" }}>Calls Made</p>
        </div>
      </div>

      {/* Stats */}
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <MiniStat label="Leads Handled" value={stats.uniqueLeads} />
          <MiniStat label="Interested" value={stats.responses.interested} />
          <MiniStat label="No Answer" value={stats.responses.noAnswer} />
          <MiniStat label="Not Interested" value={stats.responses.notInterested} />
        </div>

        {allocations.length > 0 && (
          <div className="rounded-xl border p-3 space-y-2" style={{ borderColor: "var(--glass-border)" }}>
            <p className="text-xs font-semibold flex items-center gap-1" style={{ color: "var(--mut)" }}>
              <UserCheck className="w-3.5 h-3.5" /> Allocated to Consultants
            </p>
            {allocations.map(([consultant, count]) => (
              <div key={consultant} className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "var(--ink)" }}>{consultant}</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: "rgba(255,157,0,.14)", color: GOLD }}>{count}</span>
              </div>
            ))}
          </div>
        )}

        {allocations.length === 0 && (
          <div className="text-center py-2 text-xs" style={{ color: "var(--mut)" }}>No allocations logged today</div>
        )}
      </div>
    </div>
  );
}