import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import moment from "moment";
import {
  Users, Car, TrendingUp, Clock, CheckCircle2, Circle,
  BarChart2, Phone, ArrowUpRight, Plus, Flame, Target
} from "lucide-react";

const ADMIN_EMAILS = ["deon", "heino", "blaqtelecoms@gmail.com"];

function isAdminUser(user) {
  if (!user) return false;
  if (user.role === "admin") return true;
  const email = (user.email || "").toLowerCase();
  return ADMIN_EMAILS.some(a => email.includes(a));
}

const STATUS_DOT = {
  "New":        "bg-amber-400",
  "Contacted":  "bg-yellow-400",
  "Test Drive": "bg-purple-400",
  "Approved":   "bg-blue-400",
  "Sold":       "bg-emerald-400",
  "No Answer":  "bg-slate-400",
  "Lost":       "bg-red-400",
};

const STATUS_PILL = {
  "New":        "bg-amber-500/15 text-amber-300 border border-amber-500/30",
  "Contacted":  "bg-yellow-500/15 text-yellow-300 border border-yellow-500/30",
  "Test Drive": "bg-purple-500/15 text-purple-300 border border-purple-500/30",
  "Approved":   "bg-blue-500/15 text-blue-300 border border-blue-500/30",
  "Sold":       "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
  "No Answer":  "bg-slate-500/15 text-slate-300 border border-slate-500/30",
  "Lost":       "bg-red-500/15 text-red-400 border border-red-500/30",
};

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
  const stats = {
    newLeads: leads.filter(l => l.status === "New").length,
    soldLeads: leads.filter(l => l.status === "Sold").length,
    availableVehicles: vehicles.filter(v => v.status === "Available").length,
    todaysTasks: tasks.length,
    completedTasks: tasks.filter(t => t.completed).length,
  };

  const recentLeads = leads.slice(0, 6);
  const pendingTasks = tasks.filter(t => !t.completed).slice(0, 5);
  const taskProgress = stats.todaysTasks > 0 ? Math.round((stats.completedTasks / stats.todaysTasks) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-7 max-w-7xl">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-amber-500/70 uppercase tracking-widest mb-1">
            {moment().format("dddd, D MMMM YYYY")}
          </p>
          <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
        </div>
        <Link
          to={createPageUrl("Leads") + "?action=new"}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-amber-500/20"
        >
          <Plus className="w-4 h-4" />
          New Lead
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-amber-500/20 bg-[#111] p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-white/40 font-medium uppercase tracking-wider mb-1">New Leads</p>
            <p className="text-4xl font-bold text-white">{stats.newLeads}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
            <Users className="w-5 h-5 text-amber-400" />
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-[#111] p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-white/40 font-medium uppercase tracking-wider mb-1">Deals Closed</p>
            <p className="text-4xl font-bold text-white">{stats.soldLeads}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#111] p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-white/40 font-medium uppercase tracking-wider mb-1">Available Cars</p>
            <p className="text-4xl font-bold text-white">{stats.availableVehicles}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
            <Car className="w-5 h-5 text-white/50" />
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Recent Leads — wider column */}
        <div className="lg:col-span-3 rounded-2xl border border-white/8 bg-[#0f0f0f]">
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/5">
            <h2 className="text-sm font-semibold text-white">Recent Leads</h2>
            <Link to={createPageUrl("Leads")} className="text-xs text-amber-400/80 hover:text-amber-300 font-medium flex items-center gap-1">
              View all <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-white/5">
            {recentLeads.length === 0 ? (
              <div className="py-12 text-center text-white/30 text-sm">No leads yet</div>
            ) : recentLeads.map((lead) => (
              <div key={lead.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-white/[0.03] transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-amber-400 text-xs font-bold">{(lead.lead_name || "?").charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{lead.lead_name}</p>
                    <p className="text-xs text-white/35 truncate">{lead.car_interested || "—"}</p>
                  </div>
                </div>
                <span className={`ml-3 flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-lg ${STATUS_PILL[lead.status] || "bg-white/10 text-white/50"}`}>
                  {lead.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 flex flex-col gap-5">

          {/* Today's Tasks */}
          <div className="rounded-2xl border border-white/8 bg-[#0f0f0f] flex-1">
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/5">
              <h2 className="text-sm font-semibold text-white">Today's Tasks</h2>
              <Link to={createPageUrl("Tasks")} className="text-xs text-amber-400/80 hover:text-amber-300 font-medium flex items-center gap-1">
                View all <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Progress bar */}
            <div className="px-5 pt-4 pb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/40">{stats.completedTasks} / {stats.todaysTasks} done</span>
                <span className="text-xs font-semibold text-amber-400">{taskProgress}%</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all"
                  style={{ width: `${taskProgress}%` }}
                />
              </div>
            </div>

            <div className="px-5 pb-4 space-y-2">
              {pendingTasks.length === 0 ? (
                <div className="py-6 text-center text-white/25 text-xs flex flex-col items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500/40" />
                  All tasks complete
                </div>
              ) : pendingTasks.map((task) => (
                <div key={task.id} className="flex items-start gap-3 py-2">
                  <Circle className="w-4 h-4 text-white/20 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-white/80">{task.description}</p>
                    <p className="text-xs text-white/30">{task.task_type}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Today's Activity */}
          <div className="rounded-2xl border border-white/8 bg-[#0f0f0f] px-5 py-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
              <Flame className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider font-medium">Today's Leads</p>
              <p className="text-2xl font-bold text-white">{todayLeads}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs text-white/30">Target</p>
              <p className="text-sm font-semibold text-amber-400/70">3 – 5</p>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Portals */}
      {isAdminUser(currentUser) && (
        <div>
          <p className="text-xs font-semibold text-white/25 uppercase tracking-widest mb-3">Admin Portals</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { href: "/AdminPerformance", icon: BarChart2, label: "Performance", desc: "Team stats & KPIs" },
              { href: "/SalesPortal",      icon: Users,    label: "Sales Portal",   desc: "Consultants & leads" },
              { href: "/CCLanding",        icon: Phone,    label: "Call Centre",    desc: "Lead outreach" },
            ].map(({ href, icon: Icon, label, desc }) => (
              <a
                key={href}
                href={href}
                className="flex items-center gap-4 px-5 py-4 rounded-2xl border border-white/8 bg-[#0f0f0f] hover:border-amber-500/30 hover:bg-amber-500/5 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center flex-shrink-0 group-hover:border-amber-500/30 group-hover:bg-amber-500/10 transition-all">
                  <Icon className="w-4 h-4 text-white/40 group-hover:text-amber-400 transition-colors" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white/80 group-hover:text-white transition-colors">{label}</p>
                  <p className="text-xs text-white/30">{desc}</p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-white/15 group-hover:text-amber-400/60 ml-auto transition-colors" />
              </a>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}