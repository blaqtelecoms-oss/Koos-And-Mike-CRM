import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "./utils";
import {
  LayoutGrid, Users, Car, CheckSquare, Share2,
  Menu, X, LogOut, RefreshCcw, Search, BarChart3,
  ShieldCheck, Megaphone, Bell, Plus, Trash2
} from "lucide-react";
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import DeleteAccountDialog from "@/components/DeleteAccountDialog";
import Avatar from "@/components/premium/Avatar";

const TOP_LEVEL_PAGES = ["Dashboard", "Leads", "Vehicles", "Tasks", "SocialPosts", "TradeIns", "CarRequests", "Adverts"];

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [newLeadsCount, setNewLeadsCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const isChildRoute = !TOP_LEVEL_PAGES.includes(currentPageName);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    base44.entities.Lead.filter({ status: "New" }, "-created_date", 500)
      .then(data => setNewLeadsCount(data?.length || 0))
      .catch(() => {});
  }, []);

  const navigation = [
    { name: "Dashboard", page: "Dashboard", icon: LayoutGrid },
    { name: "Leads", page: "Leads", icon: Users, badge: newLeadsCount },
    { name: "Vehicles", page: "Vehicles", icon: Car },
    { name: "Daily Tasks", page: "Tasks", icon: CheckSquare },
    { name: "Social Posts", page: "SocialPosts", icon: Share2 },
    { name: "Adverts", page: "Adverts", icon: Megaphone },
  ];

  const clientNav = [
    { name: "Trade-In Reviews", page: "TradeIns", icon: RefreshCcw },
    { name: "Car Requests", page: "CarRequests", icon: Search },
  ];

  const adminNav = [
    { name: "Performance Monitor", path: "/AdminPerformance", icon: BarChart3 },
    { name: "Sales Portals", path: "/SalesPortal", icon: ShieldCheck },
  ];

  const handleLogout = () => base44.auth.logout();

  const firstName = user?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "?";
  const initials = user?.full_name
    ? user.full_name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : (user?.email?.charAt(0) || "?").toUpperCase();

  return (
    <div className="km-app">
      {/* ===== Sidebar ===== */}
      <aside className="km-sidebar">
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 700, fontSize: 15, letterSpacing: "-0.2px", color: "#fff", padding: "0 6px" }}>
          <span style={{ width: 38, height: 38, borderRadius: 12, background: "linear-gradient(145deg, #2b2a24, #0b0a07)", color: "var(--gold)", display: "grid", placeItems: "center", font: "800 13px Inter", boxShadow: "0 6px 16px rgba(0,0,0,.28), inset 0 1px 0 rgba(255,255,255,.2)" }}>K&M</span>
          <div>
            <div>Koos & Mike Cars</div>
            <small style={{ display: "block", fontWeight: 400, fontSize: "10.5px", color: "var(--mut)", letterSpacing: ".3px" }}>LEAD MANAGEMENT</small>
          </div>
        </div>

        {/* Nav */}
        <nav className="km-nav-scroll">
          {navigation.map(item => {
            const isActive = currentPageName === item.page;
            const Icon = item.icon;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                onClick={() => setSidebarOpen(false)}
                className={`km-nav-item ${isActive ? "active" : ""}`}
              >
                <Icon style={{ width: 18, height: 18, strokeWidth: 1.6 }} />
                <span>{item.name}</span>
                {item.badge != null && item.badge > 0 && (
                  <span className="km-nav-badge">{item.badge}</span>
                )}
              </Link>
            );
          })}

          <div className="km-nav-group-label">Client Submissions</div>
          {clientNav.map(item => {
            const isActive = currentPageName === item.page;
            const Icon = item.icon;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                onClick={() => setSidebarOpen(false)}
                className={`km-nav-item ${isActive ? "active" : ""}`}
              >
                <Icon style={{ width: 18, height: 18, strokeWidth: 1.6 }} />
                <span>{item.name}</span>
              </Link>
            );
          })}

          {user?.role === "admin" && (
            <>
              <div className="km-nav-group-label">Admin Only</div>
              {adminNav.map(item => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <a
                    key={item.path}
                    href={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`km-nav-item ${isActive ? "active" : ""}`}
                  >
                    <Icon style={{ width: 18, height: 18, strokeWidth: 1.6 }} />
                    <span>{item.name}</span>
                  </a>
                );
              })}
            </>
          )}
        </nav>

        {/* User card */}
        {user && (
          <div style={{ marginTop: "auto" }}>
            <div className="km-user-card">
              <Avatar name={user.full_name || user.email || "?"} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <b>{user.full_name || "User"}</b>
                <small>{user.email}</small>
              </div>
              <button onClick={handleLogout} style={{ background: "none", border: 0, cursor: "pointer", color: "#b8b095", padding: 4 }} title="Sign out">
                <LogOut style={{ width: 18, height: 18 }} />
              </button>
            </div>
            <DeleteAccountDialog />
          </div>
        )}
      </aside>

      {/* ===== Main content ===== */}
      <main className="km-content" key={location.pathname} data-page-content>
        {/* Top bar */}
        <div className="km-topbar">
          <div className="km-pill km-pill-search">
            <Search style={{ width: 16, height: 16, strokeWidth: 1.6 }} />
            <span>Search…</span>
          </div>
          <div className="km-pill" style={{ padding: "0 12px" }}>
            <Bell style={{ width: 16, height: 16, strokeWidth: 1.6 }} />
            <span className="km-notification-dot" />
          </div>
          <div className="km-pill" style={{ padding: "0 12px" }}>
            <Avatar name={user?.full_name || user?.email || "?"} size={28} />
            <span>{firstName}</span>
          </div>
        </div>

        {/* Page content */}
        {children}
      </main>
    </div>
  );
}
