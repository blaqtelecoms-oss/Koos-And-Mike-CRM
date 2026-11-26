import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowUpRight, Eye, Heart, RefreshCcw, Users } from "lucide-react";
import moment from "moment";
import { api } from "@/api/supabaseClient";
import { createPageUrl } from "@/utils";
import GlassCard from "@/components/premium/GlassCard";
import { useToast } from "@/components/ui/use-toast";

const WINDOW_DAYS = 28;

const fmt = (value) => {
  if (value == null) return "—";
  if (value >= 1000) return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(value);
};

function Kpi({ label, value, icon }) {
  return (
    <div style={{ background: "var(--glass)", border: "1px solid var(--line)", borderRadius: 12, padding: "10px 12px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11, color: "var(--mut)" }}>
        <span>{label}</span>
        {icon}
      </div>
      <div style={{ fontSize: 20, fontWeight: 400, letterSpacing: "-0.5px", color: "var(--ink)", marginTop: 2 }}>{value}</div>
    </div>
  );
}

export default function SocialAnalyticsCard() {
  const [rows, setRows] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  const load = useCallback(async () => {
    const data = await api.entities.SocialAnalytics.list("-metric_date", 200).catch(() => []);
    setRows(data || []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const sync = async () => {
    setSyncing(true);
    try {
      await api.functions.invoke("fetchSocialAnalytics", { days: WINDOW_DAYS });
      await load();
      toast({ title: "Social analytics updated" });
    } catch (err) {
      toast({ title: "Could not refresh analytics", description: err.message, variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };

  const stats = useMemo(() => {
    const since = moment().subtract(WINDOW_DAYS - 1, "days").format("YYYY-MM-DD");
    const windowRows = rows.filter((row) => row.metric_date >= since);
    const sum = (key) => windowRows.reduce((total, row) => total + (Number(row[key]) || 0), 0);
    const followersFor = (platform) => {
      const row = rows.find((entry) => entry.platform === platform && entry.followers != null);
      return row ? Number(row.followers) : null;
    };
    const facebookFollowers = followersFor("facebook");
    const instagramFollowers = followersFor("instagram");
    const followers = facebookFollowers == null && instagramFollowers == null
      ? null
      : (facebookFollowers || 0) + (instagramFollowers || 0);
    return {
      followers,
      facebookFollowers,
      instagramFollowers,
      reach: windowRows.length ? sum("reach") : null,
      engagements: windowRows.length ? sum("engagements") : null,
      profileVisits: windowRows.length ? sum("profile_visits") : null,
    };
  }, [rows]);

  const chartData = useMemo(() => {
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const date = moment().subtract(i, "days").format("YYYY-MM-DD");
      const reach = rows
        .filter((row) => row.metric_date === date)
        .reduce((total, row) => total + (Number(row.reach) || 0), 0);
      days.push({ day: moment(date).format("D MMM"), reach });
    }
    return days;
  }, [rows]);

  return (
    <GlassCard>
      <div className="km-card-header">
        Social Media
        <div style={{ display: "flex", gap: 6 }}>
          <button className="km-icon-btn" onClick={sync} disabled={syncing} title="Refresh analytics" style={{ cursor: "pointer" }}>
            <RefreshCcw style={{ width: 14, height: 14 }} className={syncing ? "animate-spin" : undefined} />
          </button>
          <Link to={createPageUrl("SocialPosts")} className="km-icon-btn" title="Social posts" style={{ cursor: "pointer" }}>
            <ArrowUpRight style={{ width: 16, height: 16, strokeWidth: 1.6 }} />
          </Link>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
        <Kpi label="Followers" value={fmt(stats.followers)} icon={<Users style={{ width: 14, height: 14, strokeWidth: 1.6 }} />} />
        <Kpi label="Reach" value={fmt(stats.reach)} icon={<Eye style={{ width: 14, height: 14, strokeWidth: 1.6 }} />} />
        <Kpi label="Engagements" value={fmt(stats.engagements)} icon={<Heart style={{ width: 14, height: 14, strokeWidth: 1.6 }} />} />
      </div>

      <div style={{ marginTop: 10, marginLeft: -8, marginRight: -4 }}>
        <ResponsiveContainer width="100%" height={110}>
          <AreaChart data={chartData} margin={{ top: 6, right: 6, bottom: 0, left: -28 }}>
            <defs>
              <linearGradient id="km-social-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff9d00" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#ff9d00" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="currentColor" strokeOpacity={0.08} vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 10, fill: "var(--mut)" }} axisLine={false} tickLine={false} interval={3} />
            <YAxis tick={{ fontSize: 10, fill: "var(--mut)" }} axisLine={false} tickLine={false} width={36} />
            <Tooltip
              contentStyle={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, fontSize: 11 }}
              labelStyle={{ color: "#fff" }}
            />
            <Area type="monotone" dataKey="reach" name="Reach" stroke="#ff9d00" strokeWidth={2} fill="url(#km-social-area)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--mut)", marginTop: 4 }}>
        <span>Facebook {fmt(stats.facebookFollowers)}</span>
        <span>Instagram {fmt(stats.instagramFollowers)}</span>
        <span>Last {WINDOW_DAYS} days</span>
      </div>
    </GlassCard>
  );
}
