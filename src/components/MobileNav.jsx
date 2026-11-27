import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { LogOut, Menu, X } from "lucide-react";
import { isAdminUser } from "@/lib/admin";
import Avatar from "@/components/premium/Avatar";
import DeleteAccountDialog from "@/components/DeleteAccountDialog";

// The tabs that stay one tap away on a phone; everything else lives in "More".
const PRIMARY_PAGES = ["Dashboard", "Leads", "Vehicles", "Social Posts"];

export default function MobileNav({ navigation = [], clientNav = [], adminNav = [], user, newLeadsCount = 0, onLogout }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Navigating from the sheet closes it.
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const primary = PRIMARY_PAGES
    .map((name) => navigation.find((item) => item.name === name))
    .filter(Boolean);
  const rest = navigation.filter((item) => !PRIMARY_PAGES.includes(item.name));

  const groups = [
    { label: "Workspace", items: rest },
    { label: "Client Submissions", items: clientNav },
    ...(isAdminUser(user) ? [{ label: "Admin Only", items: adminNav }] : []),
  ];

  const href = (item) => (item.path ? item.path : createPageUrl(item.page));
  const isActive = (item) => (item.path ? location.pathname === item.path : location.pathname === createPageUrl(item.page));
  const badgeFor = (item) => (item.page === "Leads" && newLeadsCount > 0 ? newLeadsCount : null);

  return (
    <>
      {open && <div className="km-mnav-backdrop" onClick={() => setOpen(false)} />}

      {open && (
        <div className="km-mnav-sheet" role="dialog" aria-label="All pages">
          <div className="km-mnav-sheet-head">
            {user && (
              <div className="km-user-card" style={{ flex: 1 }}>
                <Avatar name={user.full_name || user.email || "?"} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <b>{user.full_name || "User"}</b>
                  <small>{user.email}</small>
                </div>
                <button
                  onClick={onLogout}
                  style={{ background: "none", border: 0, cursor: "pointer", color: "#b8b095", padding: 4 }}
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogOut style={{ width: 18, height: 18 }} />
                </button>
              </div>
            )}
            <button className="km-mnav-close" onClick={() => setOpen(false)} aria-label="Close menu">
              <X style={{ width: 18, height: 18 }} />
            </button>
          </div>

          <div className="km-mnav-groups">
            {groups.map(({ label, items }) => (
              items.length > 0 && (
                <div key={label}>
                  <div className="km-nav-group-label">{label}</div>
                  {items.map((item) => {
                    const Icon = item.icon;
                    const badge = badgeFor(item);
                    return (
                      <Link
                        key={item.name}
                        to={href(item)}
                        onClick={() => setOpen(false)}
                        className={`km-nav-item ${isActive(item) ? "active" : ""}`}
                      >
                        <Icon style={{ width: 18, height: 18, strokeWidth: 1.6 }} />
                        <span>{item.name}</span>
                        {badge != null && <span className="km-nav-badge">{badge}</span>}
                      </Link>
                    );
                  })}
                </div>
              )
            ))}
          </div>

          {user && <DeleteAccountDialog />}
        </div>
      )}

      <nav className="km-mnav" aria-label="Main navigation">
        {primary.map((item) => {
          const Icon = item.icon;
          const badge = badgeFor(item);
          return (
            <Link
              key={item.name}
              to={href(item)}
              className={`km-mnav-item ${isActive(item) ? "active" : ""}`}
            >
              <span className="km-mnav-icon">
                <Icon />
                {badge != null && <span className="km-mnav-badge">{badge}</span>}
              </span>
              <span>{item.name}</span>
            </Link>
          );
        })}
        <button
          type="button"
          className={`km-mnav-item ${open ? "active" : ""}`}
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
        >
          <span className="km-mnav-icon">{open ? <X /> : <Menu />}</span>
          <span>More</span>
        </button>
      </nav>
    </>
  );
}
