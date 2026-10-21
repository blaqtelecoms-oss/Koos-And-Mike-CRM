import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Users, Phone, MessageCircle, LogOut, Car, ClipboardList, ChevronRight, X, Check, KeyRound, CheckSquare, BellRing, BellOff, RefreshCw } from "lucide-react";
import moment from "moment";
import ChangePasswordDialog from "@/components/staff/ChangePasswordDialog";

const GOLD = "#C9A84C";

const STATUS_COLORS = {
  "New": { bg: "#C9A84C20", color: "#C9A84C" },
  "Contacted": { bg: "#3b82f620", color: "#3b82f6" },
  "Test Drive": { bg: "#a855f720", color: "#a855f7" },
  "Approved": { bg: "#22c55e20", color: "#22c55e" },
  "Sold": { bg: "#10b98120", color: "#10b981" },
  "No Answer": { bg: "#f9731620", color: "#fb923c" },
  "Lost": { bg: "#ef444420", color: "#ef4444" },
};

const PIPELINE_STAGES = [
  "Initial Contact", "Engaged", "Test Drive Booked", "Test Drive Done",
  "With Sales Department", "With Finance", "Application Submitted",
  "Application Approved", "Deal Closed - Sold", "Deal Closed - Not Buying", "Application Failed"
];

const CONTACT_METHODS = ["Called", "WhatsApp Messaged", "Email Sent", "In Person", "No Contact Attempted"];
const LEAD_RESPONSES = ["Answered - Interested", "Answered - Not Interested", "No Answer", "Callback Requested", "WhatsApp Replied", "No Response"];
const LEAD_STATUSES = ["New", "Contacted", "Test Drive", "Approved", "Sold", "No Answer", "Lost"];
const TABS = ["My Leads", "All Leads", "Vehicles", "Tasks"];

export default function MyLeads() {
  const [consultant, setConsultant] = useState(null);
  const [authUser, setAuthUser] = useState(null);
  const [leads, setLeads] = useState([]);
  const [allLeads, setAllLeads] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [activeTab, setActiveTab] = useState("My Leads");
  const [selectedLead, setSelectedLead] = useState(null);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpData, setFollowUpData] = useState({});
  const [savingFollowUp, setSavingFollowUp] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [followUpHistory, setFollowUpHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isLegacyUser, setIsLegacyUser] = useState(false);
  const [togglingAvailability, setTogglingAvailability] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pullIndicator, setPullIndicator] = useState(0);
  const pullStartY = useRef(0);
  const pullDistance = useRef(0);
  const consultantRef = useRef(null);
  const isLegacyRef = useRef(false);

  // Keep refs in sync with state for use in touch handlers
  useEffect(() => { consultantRef.current = consultant; }, [consultant]);
  useEffect(() => { isLegacyRef.current = isLegacyUser; }, [isLegacyUser]);

  useEffect(() => {
    const init = async () => {
      // First try Base44 authenticated user
      try {
        const user = await base44.auth.me();
        if (user) {
          setAuthUser(user);
          // Find their consultant record by email first, then by name as fallback
          let allConsultants = await base44.entities.Consultant.filter({ email: user.email }, "-created_date", 1);
          if (!allConsultants || allConsultants.length === 0) {
            // Try matching by full name
            const allC = await base44.entities.Consultant.list("-created_date", 200);
            allConsultants = allC.filter(c =>
              c.name?.toLowerCase().trim() === user.full_name?.toLowerCase().trim()
            );
          }
          if (allConsultants && allConsultants.length > 0) {
            setConsultant(allConsultants[0]);
            await loadData(allConsultants[0].name, false);
          } else {
            // User is logged in but no consultant record — still load all leads
            await loadData(null, false);
          }
          return;
        }
      } catch (e) {
        // Not logged in via Base44
      }

      // Fall back to localStorage session (old staff portal flow)
      const stored = localStorage.getItem("staffConsultant");
      const must = localStorage.getItem("mustChangePassword") === "1";

      if (!stored) {
        window.location.href = "/staff";
        return;
      }

      const c = JSON.parse(stored);
      setConsultant(c);
      setMustChangePassword(must);
      if (must) setShowChangePassword(true);
      setIsLegacyUser(true);
      isLegacyRef.current = true;
      await loadData(c.name, true); // use backend function — no Base44 auth
    };

    init();

    // Pull-to-refresh
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
        await loadData(consultantRef.current?.name || null, isLegacyRef.current);
        setRefreshing(false);
      } else {
        setPullIndicator(0);
      }
      pullStartY.current = 0;
      pullDistance.current = 0;
    };
    document.documentElement.addEventListener("touchstart", onTouchStart, { passive: true });
    document.documentElement.addEventListener("touchmove", onTouchMove, { passive: true });
    document.documentElement.addEventListener("touchend", onTouchEnd);
    return () => {
      document.documentElement.removeEventListener("touchstart", onTouchStart);
      document.documentElement.removeEventListener("touchmove", onTouchMove);
      document.documentElement.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  const loadData = async (name, useBackendFunction = false) => {
    setLoading(true);
    try {
      if (useBackendFunction) {
        // localStorage users can't call entities directly — use the public backend function
        const res = await base44.functions.invoke("getStaffPortalData", { consultantName: name });
        const d = res.data;
        setLeads(d.myLeads || []);
        setAllLeads(d.allLeads || []);
        setVehicles(d.vehicles || []);
        setTasks(d.tasks || []);
      } else {
        // Base44 authenticated users call entities directly
        const [myLeadsData, allLeadsData, vehiclesData, tasksData] = await Promise.all([
          name
            ? base44.entities.Lead.filter({ assigned_consultant: name }, "-created_date", 300)
            : Promise.resolve([]),
          base44.entities.Lead.list("-created_date", 300),
          base44.entities.Vehicle.filter({ status: "Available" }, "-created_date", 100),
          base44.entities.DailyTask.list("-task_date", 100),
        ]);
        setLeads(myLeadsData || []);
        setAllLeads(allLeadsData || []);
        setVehicles(vehiclesData || []);
        setTasks(tasksData || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsApp = (phone, e) => {
    e?.stopPropagation();
    const clean = phone.replace(/\D/g, "");
    const number = clean.startsWith("0") ? "27" + clean.slice(1) : clean;
    window.open(`https://wa.me/${number}`, "_blank");
  };

  const handleCall = (phone, e) => {
    e?.stopPropagation();
    window.location.href = `tel:${phone}`;
  };

  const handleToggleAvailability = async () => {
    if (!consultant?.id) return;
    setTogglingAvailability(true);
    const newVal = !consultant.available;
    try {
      await base44.entities.Consultant.update(consultant.id, { available: newVal });
      setConsultant(prev => ({ ...prev, available: newVal }));
    } finally {
      setTogglingAvailability(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("staffConsultant");
    localStorage.removeItem("mustChangePassword");
    if (authUser) {
      base44.auth.logout("/");
    } else {
      window.location.href = "/staff";
    }
  };

  const handleUpdateStatus = async (lead, newStatus) => {
    setUpdatingStatus(true);
    try {
      await base44.entities.Lead.update(lead.id, { status: newStatus });
      const update = l => l.id === lead.id ? { ...l, status: newStatus } : l;
      setLeads(prev => prev.map(update));
      setAllLeads(prev => prev.map(update));
      if (selectedLead?.id === lead.id) setSelectedLead(prev => ({ ...prev, status: newStatus }));
    } finally {
      setUpdatingStatus(false);
    }
  };

  const loadFollowUps = async (lead) => {
    setLoadingHistory(true);
    setFollowUpHistory([]);
    try {
      if (isLegacyUser) {
        const res = await base44.functions.invoke("getStaffPortalData", { leadId: lead.id });
        setFollowUpHistory(res.data?.followUps || []);
      } else {
        const data = await base44.entities.LeadFollowUp.filter({ lead_id: lead.id }, "-update_date", 100);
        setFollowUpHistory(data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSelectLead = (lead) => {
    setSelectedLead(lead);
    setShowFollowUp(false);
    setFollowUpData({});
    loadFollowUps(lead);
  };

  const handleSaveFollowUp = async () => {
    if (!followUpData.pipeline_stage) return;
    setSavingFollowUp(true);
    try {
      await base44.entities.LeadFollowUp.create({
        lead_id: selectedLead.id,
        lead_name: selectedLead.lead_name,
        update_date: moment().format("YYYY-MM-DD"),
        reported_by: consultant?.name || authUser?.full_name,
        ...followUpData,
      });
      setShowFollowUp(false);
      setFollowUpData({});
      // Refresh history
      await loadFollowUps(selectedLead);
    } finally {
      setSavingFollowUp(false);
    }
  };

  const displayLeads = activeTab === "My Leads" ? leads : allLeads;
  const filteredLeads = displayLeads.filter(l => {
    const matchesStatus = statusFilter === "All" || l.status === statusFilter;
    const matchesSearch = !searchQuery || l.lead_name?.toLowerCase().includes(searchQuery.toLowerCase()) || l.phone?.includes(searchQuery);
    return matchesStatus && matchesSearch;
  });

  const filteredVehicles = vehicles.filter(v =>
    !searchQuery || v.title?.toLowerCase().includes(searchQuery.toLowerCase()) || v.make?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="km-admin-page min-h-screen flex items-center justify-center" style={{ background: "#0D0D0D" }}>
        <div className="w-10 h-10 border-4 border-amber-700 border-t-amber-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="km-admin-page min-h-screen" style={{ background: "#0D0D0D" }}>
      {/* Pull-to-refresh indicator */}
      {(pullIndicator > 0 || refreshing) && (
        <div className="flex justify-center py-2" style={{ background: "#0D0D0D" }}>
          <RefreshCw
            className={`w-5 h-5 text-amber-400 ${refreshing ? "animate-spin" : ""}`}
            style={{ transform: `rotate(${pullIndicator * 180}deg)`, opacity: refreshing ? 1 : pullIndicator }}
          />
        </div>
      )}
      <div className="h-1 w-full" style={{ background: GOLD }} />

      {/* Header */}
      <header className="border-b py-3 px-4" style={{ borderColor: "#C9A84C22", background: "#111111" }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="https://media.base44.com/images/public/69ba4650f213ea0fa82b95fb/fab77c211_KMLogo.png" alt="K&M" className="w-9 h-9 object-contain" />
            <div>
              <h1 className="font-bold text-sm leading-none" style={{ color: GOLD }}>Koos & Mike Cars</h1>
              <p className="text-xs text-white/40">{consultant?.name || authUser?.full_name} · {consultant?.role || "Staff"}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {consultant && (
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
            )}
            <button onClick={() => setShowChangePassword(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-xs" style={{ color: "#C9A84C99" }}>
              <KeyRound className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Password</span>
            </button>
            <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-white/10 transition-colors" title="Sign out">
              <LogOut className="w-4 h-4 text-white/50" />
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b px-4" style={{ borderColor: "#C9A84C22", background: "#0D0D0D" }}>
        <div className="max-w-5xl mx-auto flex gap-1">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setStatusFilter("All"); setSearchQuery(""); setSelectedLead(null); setFollowUpHistory([]); }}
              className="px-4 py-3 text-sm font-semibold border-b-2 transition-all"
              style={{
                borderColor: activeTab === tab ? GOLD : "transparent",
                color: activeTab === tab ? GOLD : "#ffffff50"
              }}
            >
              {tab === "My Leads" && <span>{tab} <span className="text-xs opacity-60">({leads.length})</span></span>}
              {tab === "All Leads" && <span>{tab} <span className="text-xs opacity-60">({allLeads.length})</span></span>}
              {tab === "Vehicles" && <span>{tab} <span className="text-xs opacity-60">({vehicles.length})</span></span>}
              {tab === "Tasks" && <span>{tab} <span className="text-xs opacity-60">({tasks.length})</span></span>}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* Stats (leads tabs only) */}
        {activeTab !== "Vehicles" && activeTab !== "Tasks" && (
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: "Total", value: displayLeads.length },
              { label: "Active", value: displayLeads.filter(l => !["Sold", "Lost"].includes(l.status)).length },
              { label: "Sold", value: displayLeads.filter(l => l.status === "Sold").length },
            ].map(stat => (
              <div key={stat.label} className="rounded-xl p-3 border text-center" style={{ background: "#ffffff08", borderColor: "#C9A84C22" }}>
                <p className="text-xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-white/50 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Search */}
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder={activeTab === "Vehicles" ? "Search vehicles..." : "Search by name or phone..."}
          className="w-full px-4 py-2.5 rounded-xl text-white text-sm outline-none mb-4"
          style={{ background: "#1a1a1a", border: "1px solid #C9A84C22" }}
        />

        {/* Status filter (leads only) */}
        {activeTab !== "Vehicles" && activeTab !== "Tasks" && (
          <div className="flex gap-2 flex-wrap mb-5">
            {["All", ...LEAD_STATUSES].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: statusFilter === s ? GOLD : "#ffffff10",
                  color: statusFilter === s ? "#000" : "#ffffff70"
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* LEADS LIST */}
        {activeTab !== "Vehicles" && activeTab !== "Tasks" && (
          filteredLeads.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-12 h-12 mx-auto text-white/20 mb-3" />
              <p className="text-white/40">{activeTab === "My Leads" ? "No leads assigned to you yet" : "No leads found"}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLeads.map(lead => {
                const sc = STATUS_COLORS[lead.status] || { bg: "#ffffff10", color: "#ffffff80" };
                return (
                  <div
                    key={lead.id}
                    onClick={() => handleSelectLead(lead)}
                    className="rounded-xl p-4 border flex items-center gap-4 cursor-pointer hover:border-amber-600/40 transition-all"
                    style={{ background: "#ffffff06", borderColor: selectedLead?.id === lead.id ? GOLD : "#ffffff10" }}
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#C9A84C20" }}>
                      <span className="text-amber-400 font-bold text-sm">{lead.lead_name?.charAt(0) || "?"}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-white font-semibold text-sm">{lead.lead_name}</p>
                        <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ background: sc.bg, color: sc.color }}>{lead.status}</span>
                        {lead.assigned_consultant && activeTab === "All Leads" && (
                          <span className="text-xs text-white/30">{lead.assigned_consultant}</span>
                        )}
                      </div>
                      <p className="text-white/40 text-xs mt-0.5">{lead.car_interested || "No car specified"} · {lead.phone}</p>
                      <p className="text-white/25 text-xs">{moment(lead.created_date).fromNow()}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0 items-center">
                      {lead.phone && (
                        <>
                          <button onClick={(e) => handleCall(lead.phone, e)} className="p-2 rounded-lg transition-colors hover:bg-white/10" title="Call">
                            <Phone className="w-4 h-4 text-amber-400" />
                          </button>
                          <button onClick={(e) => handleWhatsApp(lead.phone, e)} className="p-2 rounded-lg transition-colors hover:bg-white/10" title="WhatsApp">
                            <MessageCircle className="w-4 h-4 text-green-400" />
                          </button>
                        </>
                      )}
                      <ChevronRight className="w-4 h-4 text-white/20" />
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* TASKS LIST */}
        {activeTab === "Tasks" && (
          tasks.length === 0 ? (
            <div className="text-center py-16">
              <CheckSquare className="w-12 h-12 mx-auto text-white/20 mb-3" />
              <p className="text-white/40">No tasks found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map(t => (
                <div key={t.id} className="rounded-xl p-4 border flex items-start gap-3" style={{ background: "#ffffff06", borderColor: "#ffffff10" }}>
                  <div className={`w-5 h-5 rounded-full flex-shrink-0 mt-0.5 border-2 flex items-center justify-center ${t.completed ? "bg-amber-500 border-amber-500" : "border-white/30"}`}>
                    {t.completed && <Check className="w-3 h-3 text-black" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-sm font-semibold ${t.completed ? "line-through text-white/40" : "text-white"}`}>{t.description}</p>
                      <span className="px-2 py-0.5 rounded text-xs" style={{ background: "#C9A84C20", color: "#C9A84C" }}>{t.task_type}</span>
                    </div>
                    <div className="flex gap-3 mt-1 flex-wrap">
                      <p className="text-xs text-white/30">{t.task_date}</p>
                      {t.assigned_to && <p className="text-xs text-white/40">→ {t.assigned_to}</p>}
                      {t.platform && t.platform !== "N/A" && <p className="text-xs text-white/30">{t.platform}</p>}
                    </div>
                    {t.notes && <p className="text-xs text-white/30 mt-1">{t.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* VEHICLES LIST */}
        {activeTab === "Vehicles" && (
          filteredVehicles.length === 0 ? (
            <div className="text-center py-16">
              <Car className="w-12 h-12 mx-auto text-white/20 mb-3" />
              <p className="text-white/40">No available vehicles</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredVehicles.map(v => (
                <div key={v.id} className="rounded-xl border overflow-hidden" style={{ background: "#ffffff06", borderColor: "#ffffff10" }}>
                  {v.images?.[0] && (
                    <img src={v.images[0]} alt={v.title} className="w-full h-40 object-cover" />
                  )}
                  <div className="p-4">
                    <p className="text-white font-semibold text-sm">{v.title}</p>
                    <p className="text-amber-400 font-bold mt-1">R {v.price?.toLocaleString()}</p>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-xs" style={{ background: "#22c55e20", color: "#22c55e" }}>{v.status}</span>
                      {v.stand && <span className="px-2 py-0.5 rounded text-xs text-white/40" style={{ background: "#ffffff10" }}>{v.stand}</span>}
                      {v.mileage && <span className="text-xs text-white/40">{v.mileage?.toLocaleString()} km</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Lead Detail Drawer */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex" style={{ background: "rgba(0,0,0,0.7)" }} onClick={() => { setSelectedLead(null); setShowFollowUp(false); setFollowUpHistory([]); }}>
          <div className="ml-auto w-full max-w-md h-full overflow-y-auto flex flex-col" style={{ background: "#111", borderLeft: `1px solid #C9A84C33` }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "#C9A84C22" }}>
              <h2 className="text-white font-bold text-lg">{selectedLead.lead_name}</h2>
              <button onClick={() => { setSelectedLead(null); setShowFollowUp(false); setFollowUpHistory([]); }} className="p-2 rounded-lg hover:bg-white/10">
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            <div className="p-5 space-y-5 flex-1">
              {/* Status badge */}
              <div className="flex items-center gap-2 flex-wrap">
                {LEAD_STATUSES.map(s => {
                  const sc = STATUS_COLORS[s] || { bg: "#ffffff10", color: "#fff" };
                  const isActive = selectedLead.status === s;
                  return (
                    <button
                      key={s}
                      disabled={updatingStatus}
                      onClick={() => handleUpdateStatus(selectedLead, s)}
                      className="px-3 py-1 rounded-lg text-xs font-semibold transition-all border"
                      style={{
                        background: isActive ? sc.bg : "transparent",
                        color: isActive ? sc.color : "#ffffff40",
                        borderColor: isActive ? sc.color + "60" : "#ffffff15"
                      }}
                    >
                      {isActive && <Check className="w-3 h-3 inline mr-1" />}{s}
                    </button>
                  );
                })}
              </div>

              {/* Details */}
              <div className="space-y-3 text-sm">
                {[
                  { label: "Phone", value: selectedLead.phone },
                  { label: "Email", value: selectedLead.email },
                  { label: "Car Interested In", value: selectedLead.car_interested },
                  { label: "Source", value: selectedLead.source },
                  { label: "Assigned To", value: selectedLead.assigned_consultant },
                  { label: "Notes", value: selectedLead.notes },
                ].filter(f => f.value).map(f => (
                  <div key={f.label}>
                    <p className="text-white/40 text-xs">{f.label}</p>
                    <p className="text-white">{f.value}</p>
                  </div>
                ))}
              </div>

              {/* Quick actions */}
              <div className="flex gap-3">
                {selectedLead.phone && (
                  <>
                    <button onClick={() => handleCall(selectedLead.phone)} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all" style={{ background: "#C9A84C20", color: GOLD }}>
                      <Phone className="w-4 h-4" /> Call
                    </button>
                    <button onClick={() => handleWhatsApp(selectedLead.phone)} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all" style={{ background: "#22c55e15", color: "#22c55e" }}>
                      <MessageCircle className="w-4 h-4" /> WhatsApp
                    </button>
                  </>
                )}
              </div>

              {/* Log follow-up */}
              {!showFollowUp ? (
                <button onClick={() => setShowFollowUp(true)} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm border transition-all hover:bg-white/5" style={{ borderColor: "#C9A84C33", color: GOLD }}>
                  <ClipboardList className="w-4 h-4" /> Log Follow-Up
                </button>
              ) : (
                <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: "#C9A84C33", background: "#C9A84C08" }}>
                  <p className="text-white font-semibold text-sm">Log Follow-Up</p>

                  <div>
                    <label className="text-xs text-white/40 block mb-1">Contact Method</label>
                    <select value={followUpData.contact_method || ""} onChange={e => setFollowUpData(p => ({ ...p, contact_method: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-white text-sm outline-none" style={{ background: "#1a1a1a", border: "1px solid #C9A84C33" }}>
                      <option value="">— Select —</option>
                      {CONTACT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-white/40 block mb-1">Lead Response</label>
                    <select value={followUpData.lead_response || ""} onChange={e => setFollowUpData(p => ({ ...p, lead_response: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-white text-sm outline-none" style={{ background: "#1a1a1a", border: "1px solid #C9A84C33" }}>
                      <option value="">— Select —</option>
                      {LEAD_RESPONSES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-white/40 block mb-1">Pipeline Stage *</label>
                    <select value={followUpData.pipeline_stage || ""} onChange={e => setFollowUpData(p => ({ ...p, pipeline_stage: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-white text-sm outline-none" style={{ background: "#1a1a1a", border: "1px solid #C9A84C33" }}>
                      <option value="">— Select —</option>
                      {PIPELINE_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-white/40 block mb-1">Notes</label>
                    <textarea value={followUpData.notes || ""} onChange={e => setFollowUpData(p => ({ ...p, notes: e.target.value }))} rows={3} className="w-full px-3 py-2 rounded-lg text-white text-sm outline-none resize-none" style={{ background: "#1a1a1a", border: "1px solid #C9A84C33" }} placeholder="Add notes..." />
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => { setShowFollowUp(false); setFollowUpData({}); }} className="flex-1 py-2 rounded-lg border text-sm font-semibold text-white/50 hover:bg-white/5 transition-all" style={{ borderColor: "#ffffff20" }}>
                      Cancel
                    </button>
                    <button onClick={handleSaveFollowUp} disabled={savingFollowUp || !followUpData.pipeline_stage} className="flex-1 py-2 rounded-xl font-semibold text-sm transition-all" style={{ background: followUpData.pipeline_stage ? GOLD : "#ffffff15", color: followUpData.pipeline_stage ? "#000" : "#ffffff40" }}>
                      {savingFollowUp ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              )}

              {/* Follow-up History */}
              <div>
                <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-3">Update History</p>
                {loadingHistory ? (
                  <div className="flex justify-center py-4">
                    <div className="w-5 h-5 border-2 border-amber-600 border-t-amber-300 rounded-full animate-spin" />
                  </div>
                ) : followUpHistory.length === 0 ? (
                  <p className="text-white/25 text-xs text-center py-4">No follow-ups logged yet</p>
                ) : (
                  <div className="space-y-2">
                    {followUpHistory.map(fu => (
                      <div key={fu.id} className="rounded-lg p-3 border" style={{ background: "#ffffff05", borderColor: "#ffffff10" }}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-semibold" style={{ color: GOLD }}>{fu.pipeline_stage}</span>
                          <span className="text-xs text-white/30">{fu.update_date}</span>
                        </div>
                        <div className="flex gap-2 flex-wrap mb-1">
                          {fu.contact_method && <span className="text-xs text-white/50">{fu.contact_method}</span>}
                          {fu.contact_method && fu.lead_response && <span className="text-xs text-white/30">·</span>}
                          {fu.lead_response && <span className="text-xs text-white/50">{fu.lead_response}</span>}
                        </div>
                        {fu.notes && <p className="text-xs text-white/40">{fu.notes}</p>}
                        <p className="text-xs text-white/20 mt-1">by {fu.reported_by}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change password dialog */}
      {consultant && (
        <ChangePasswordDialog
          consultantId={consultant.id}
          open={showChangePassword}
          onClose={() => {
            setMustChangePassword(false);
            setShowChangePassword(false);
          }}
          forced={mustChangePassword}
        />
      )}
    </div>
  );
}