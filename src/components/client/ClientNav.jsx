import { Home, Car, UserPlus, RefreshCw, Search, Radio, ExternalLink } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const GOLD = "var(--gold)";

export const CLIENT_NAV = [
  { label: "Home", path: "/ClientPortal", icon: Home },
  { label: "Inventory", path: "/ClientInventory", icon: Car },
  { label: "Register", path: "/ClientRegister", icon: UserPlus },
  { label: "Trade-In", path: "/ClientTradeIn", icon: RefreshCw },
  { label: "Request a Car", path: "/ClientCarRequest", icon: Search },
  { label: "Music Station", href: "https://zeno.fm/radio/KM-radio-neog/", icon: Radio, external: true },
];

export default function ClientNav() {
  const { pathname } = useLocation();

  return (
    <nav aria-label="Client portal pages" className="flex flex-wrap items-center gap-1.5">
      {CLIENT_NAV.map(({ label, path, href, icon: Icon, external }) => {
        const active = path === pathname;

        const chip = (
          <span
            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors"
            style={active
              ? { background: GOLD, borderColor: GOLD, color: "#151005" }
              : { background: "rgba(201,168,76,0.07)", borderColor: "#C9A84C3D", color: "#4a463c" }
            }
          >
            <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: active ? "#151005" : GOLD }} />
            {label}
            {external && <ExternalLink className="w-3 h-3 opacity-60" />}
          </span>
        );

        return external ? (
          <a key={label} href={href} target="_blank" rel="noreferrer" className="hover:opacity-85 transition-opacity">
            {chip}
          </a>
        ) : (
          <Link key={label} to={path} aria-current={active ? "page" : undefined} className="hover:opacity-85 transition-opacity">
            {chip}
          </Link>
        );
      })}
    </nav>
  );
}
