import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import moment from "moment";
import {
  Users, Car, TrendingUp, Flame, Target,
  ArrowUpRight, Plus, CheckSquare as SquareCheck, Share2,
  RefreshCcw, Search, Megaphone, Phone, ChevronLeft, ChevronRight
} from "lucide-react";
import GlassCard from "@/components/premium/GlassCard";
import StatCard from "@/components/premium/StatCard";
import StatusPill from "@/components/premium/StatusPill";
import Avatar from "@/components/premium/Avatar";
import PipelineRing from "@/components/premium/PipelineRing";
import LeadsChart from "@/components/premium/LeadsChart";
import QuickTile from "@/components/premium/QuickTile";

const ADMIN_EMAILS = ["deon", "heino", "blaqtelecoms@gmail.com"];
function isAdminUser(user) {
  if (!user) return false;
  if (user.role === "admin") return true;
  const email = (user.email || "").toLowerCase();
  return ADMIN_EMAILS.some(a => email.includes(a));
}

export default function Dashboard() {
  const [leads, setLeads] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    Promise.all([
      base44.auth.me().catch(() => null),
      loadData()
    ]).then(([user]) => setCurrentUser(user));
    const interval = setInterval(loadData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [leadsData, vehiclesData, tasksData] = await Promise.all([
        base44.entities.Lead.list("-created_date", 100),
        base44.entities.Vehicle.list("-created_date", 100),
        base44.entities.DailyTask.filter({ task_date: moment().format("YYYY-MM-DD") }, "-created_date", 50)
      ]);
      setLeads(leadsData || []);
      setVehicles(vehiclesData || []);
      setTasks(tasksData || []);
    } catch (error) {
      setLeads([]); setVehicles([]); setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const todayLeads = leads.filter(l => moment(l.created_date).isSame(moment(), "day")).length;
  const yesterdayLeads = leads.filter(l => moment(l.created_date).isSame(moment().subtract(1, "day"), "day")).length;
  const newLeads = leads.filter(l => l.status === "New").length;
  const soldLeads = leads.filter(l => l.status === "Sold").length;
  const availableVehicles = vehicles.filter(v => v.status === "Available").length;
  const recentLeads = leads.slice(0, 6);

  // Month-over-month trends
  const thisMonthLeads = leads.filter(l => moment(l.created_date).isSame(moment(), "month")).length;
  const lastMonthLeads = leads.filter(l => moment(l.created_date).isSame(moment().subtract(1, "month"), "month")).length;
  const thisMonthSold = leads.filter(l => l.status === "Sold" && moment(l.created_date).isSame(moment(), "month")).length;
  const lastMonthSold = leads.filter(l => l.status === "Sold" && moment(l.created_date).isSame(moment().subtract(1, "month"), "month")).length;
  const todayTrendPct = yesterdayLeads > 0 ? Math.round(((todayLeads - yesterdayLeads) / yesterdayLeads) * 100) : (todayLeads > 0 ? 100 : 0);
  const newLeadsTrendPct = lastMonthLeads > 0 ? Math.round(((thisMonthLeads - lastMonthLeads) / lastMonthLeads) * 100) : (thisMonthLeads > 0 ? 100 : 0);
  const soldTrendPct = lastMonthSold > 0 ? Math.round(((thisMonthSold - lastMonthSold) / lastMonthSold) * 100) : (thisMonthSold > 0 ? 100 : 0);
  const trendDir = (pct) => pct > 0 ? "up" : pct < 0 ? "dn" : "nu";
  const trendStr = (pct) => (pct > 0 ? "+" : "") + pct + "%";

  // Build chart data: last 8 months of leads & deals
  const chartData = (() => {
    const months = [];
    for (let i = 7; i >= 0; i--) {
      const m = moment().subtract(i, "months");
      const monthLeads = leads.filter(l => moment(l.created_date).isSame(m, "month"));
      months.push({
        month: m.format("MMM"),
        leads: monthLeads.length,
        deals: monthLeads.filter(l => l.status === "Sold").length,
      });
    }
    return months;
  })();

  // Vehicle spotlight: most referenced vehicle
  const spotlightVehicle = vehicles.find(v => v.images?.length > 0) || vehicles[0] || null;

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 400 }}>
        <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "100%" }}>
      {/* Hero */}
      <div className="km-hero">
        <div>
          <h1 className="km-h1">Welcome in, <b>Koos & Mike Cars</b></h1>
          <div className="km-sub">{moment().format("dddd, D MMMM YYYY")}</div>
        </div>
        <Link to={createPageUrl("Leads") + "?action=new"} className="km-btn-primary">
          <Plus style={{ width: 16, height: 16 }} /> New Lead
        </Link>
      </div>

      {/* Stat cards */}
      <div className="km-stats-grid">
        <StatCard label="New Leads" icon={<Users style={{ width: 18, height: 18, strokeWidth: 1.6 }} />} value={newLeads} trend={trendStr(newLeadsTrendPct)} trendDir={trendDir(newLeadsTrendPct)} highlight />
        <StatCard label="Deals Closed" icon={<TrendingUp style={{ width: 18, height: 18, strokeWidth: 1.6 }} />} value={soldLeads} trend={trendStr(soldTrendPct)} trendDir={trendDir(soldTrendPct)} />
        <StatCard label="Available Cars" icon={<Car style={{ width: 18, height: 18, strokeWidth: 1.6 }} />} value={availableVehicles} trend="0%" trendDir="nu" />
        <StatCard label="Today's Leads" icon={<Flame style={{ width: 18, height: 18, strokeWidth: 1.6 }} />} value={todayLeads} trend={trendStr(todayTrendPct)} trendDir={trendDir(todayTrendPct)} />
      </div>

      {/* Main grid */}
      <div className="km-main-grid">
        <div>
          {/* Pipeline + Chart */}
          <div className="km-two-col">
            <GlassCard>
              <div className="km-card-header">Lead Pipeline <span className="km-chip">Today ⌄</span></div>
              <PipelineRing total={leads.length} filled={newLeads} />
            </GlassCard>
            <GlassCard>
              <div className="km-card-header">
                Lead Statistics
                <span className="km-chip">2026</span>
              </div>
              <div style={{ fontSize: "11.5px", color: "var(--mut)", display: "flex", gap: 14, marginBottom: 4 }}>
                <span>● <b style={{ color: "var(--gold)" }}>Leads</b></span>
                <span>● Deals</span>
              </div>
              <LeadsChart data={chartData} callout={{ month: moment().format("MMM"), value: chartData[chartData.length - 1]?.leads || 0 }} />
            </GlassCard>
          </div>

          {/* Recent Leads table */}
          <GlassCard style={{ marginTop: 14 }}>
            <div className="km-card-header">
              <div>
                Recent Leads
                <div style={{ fontSize: 11, color: "var(--mut)", fontWeight: 400 }}>+{newLeads} new leads</div>
              </div>
              <Link to={createPageUrl("Leads")} className="km-icon-btn" style={{ cursor: "pointer", textDecoration: "none" }}>
                <ArrowUpRight style={{ width: 16, height: 16, strokeWidth: 1.6 }} />
              </Link>
            </div>
            {recentLeads.length === 0 ? (
              <div className="km-empty">No leads yet</div>
            ) : (
              <div className="km-table-wrap">
                <table className="km-table">
                  <thead>
                    <tr><th>Lead</th><th>Interest</th><th>Status</th><th></th></tr>
                  </thead>
                  <tbody>
                    {recentLeads.map(lead => (
                      <tr key={lead.id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 500, color: "var(--ink)" }}>
                            <Avatar name={lead.lead_name || "?"} />
                            {lead.lead_name}
                          </div>
                        </td>
                        <td style={{ color: "var(--mut)" }}>{lead.car_interested || "—"}</td>
                        <td><StatusPill status={lead.status} /></td>
                        <td>···</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Vehicle spotlight */}
          <GlassCard>
            <div className="km-card-header">
              Recent Vehicle Listings
              <div style={{ display: "flex", gap: 6 }}>
                <button className="km-icon-btn" style={{ cursor: "pointer" }}><ChevronLeft style={{ width: 16, height: 16 }} /></button>
                <button className="km-icon-btn" style={{ cursor: "pointer" }}><ChevronRight style={{ width: 16, height: 16 }} /></button>
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              {spotlightVehicle?.images?.[0] ? (
                <img src={spotlightVehicle.images[0]} alt={spotlightVehicle.title} style={{ width: "88%", maxWidth: 330, borderRadius: 16, objectFit: "cover", maxHeight: 160 }} />
              ) : (
                <div style={{ width: "88%", maxWidth: 330, margin: "0 auto", aspectRatio: "16/10", display: "grid", placeItems: "center", color: "var(--mut)" }}>
                  <Car style={{ width: 48, height: 48, strokeWidth: 1 }} />
                </div>
              )}
              <h3 style={{ fontWeight: 400, fontSize: 22, margin: "12px 0 0", letterSpacing: "-0.5px", color: "var(--ink)" }}>{spotlightVehicle?.title || "No vehicles"}</h3>
              <p style={{ margin: "4px 0 0", color: "var(--mut)", fontSize: 12 }}>{spotlightVehicle ? "Most requested by leads" : "Add vehicles to your stand"}</p>
            </div>

            {/* Quick tiles */}
            <div className="km-tiles-grid">
              <QuickTile to={createPageUrl("Leads")} icon={<Users style={{ width: 20, height: 20, strokeWidth: 1.6 }} />} label="Leads" />
              <QuickTile to={createPageUrl("Vehicles")} icon={<Car style={{ width: 20, height: 20, strokeWidth: 1.6 }} />} label="Vehicles" />
              <QuickTile to={createPageUrl("Tasks")} icon={<SquareCheck style={{ width: 20, height: 20, strokeWidth: 1.6 }} />} label="Tasks" />
              <QuickTile to={createPageUrl("SocialPosts")} icon={<Share2 style={{ width: 20, height: 20, strokeWidth: 1.6 }} />} label="Posts" />
              <QuickTile to={createPageUrl("TradeIns")} icon={<RefreshCcw style={{ width: 20, height: 20, strokeWidth: 1.6 }} />} label="Trade-In" />
              <QuickTile to={createPageUrl("CarRequests")} icon={<Search style={{ width: 20, height: 20, strokeWidth: 1.6 }} />} label="Requests" />
            </div>

            {/* Call Centre toggle */}
            <div className="km-switch-row">
              <div>
                Call Centre
                <small>Switch on for lead outreach</small>
              </div>
              <div className="km-toggle off" />
            </div>
          </GlassCard>

          {/* Admin portals */}
          {isAdminUser(currentUser) && (
            <GlassCard>
              <div className="km-card-header" style={{ fontSize: 13 }}>Admin Portals</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { href: "/AdminPerformance", icon: <TrendingUp style={{ width: 18, height: 18, strokeWidth: 1.6 }} />, label: "Performance", desc: "Team stats & KPIs" },
                  { href: "/SalesPortal", icon: <Users style={{ width: 18, height: 18, strokeWidth: 1.6 }} />, label: "Sales Portal", desc: "Consultants & leads" },
                  { href: "/CCLanding", icon: <Phone style={{ width: 18, height: 18, strokeWidth: 1.6 }} />, label: "Call Centre", desc: "Lead outreach" },
                ].map(({ href, icon, label, desc }) => (
                  <a key={href} href={href} className="km-chip" style={{ justifyContent: "space-between", padding: "10px 14px", textDecoration: "none" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>{icon} <span>{label}</span></span>
                    <ArrowUpRight style={{ width: 14, height: 14 }} />
                  </a>
                ))}
              </div>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}
