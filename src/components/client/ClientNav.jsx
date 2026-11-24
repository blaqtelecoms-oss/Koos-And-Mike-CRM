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
    <nav aria-label="Client portal pages" className="hidden min-[980px]:flex items-center gap-0.5">
      {CLIENT_NAV.map(({ label, path, href, external }) => {
        const active = path === pathname;

        const inner = (
          <span
            className="relative inline-flex items-center gap-1.5 px-2.5 py-2 text-[13px] font-medium whitespace-nowrap transition-colors"
            style={{ color: active ? "#17130a" : "#6b6355" }}
          >
            {label}
            {external && <ExternalLink className="w-3 h-3 opacity-45" />}
            {active && (
              <span
                className="absolute left-2.5 right-2.5 -bottom-px h-[2px] rounded-full"
                style={{ background: GOLD }}
              />
            )}
          </span>
        );

        const className = "group hover:opacity-100 [&>span]:hover:!text-[#17130a]";

        return external ? (
          <a key={label} href={href} target="_blank" rel="noreferrer" className={className}>
            {inner}
          </a>
        ) : (
          <Link key={label} to={path} aria-current={active ? "page" : undefined} className={className}>
            {inner}
          </Link>
        );
      })}
    </nav>
  );
}
