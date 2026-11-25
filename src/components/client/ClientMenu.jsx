import { useEffect, useState } from "react";
import { Menu, X, ExternalLink } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { CLIENT_NAV } from "@/components/client/ClientNav";

const GOLD = "var(--gold)";

export default function ClientMenu() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="min-[980px]:hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors"
        style={{ borderColor: "rgba(201,168,76,0.4)", color: "#17130a", background: "rgba(201,168,76,0.08)" }}
      >
        {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 top-full border-b"
          style={{ background: "#fffdf7", borderColor: "rgba(201,168,76,0.22)", boxShadow: "0 24px 48px rgba(60,45,10,0.14)" }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col gap-1">
            {CLIENT_NAV.map(({ label, path, href, icon: Icon, external }) => {
              const active = path === pathname;
              const row = (
                <span
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors"
                  style={active
                    ? { background: "rgba(201,168,76,0.16)", color: "#17130a" }
                    : { color: "#5b5547" }
                  }
                >
                  <Icon className="w-4 h-4" style={{ color: active ? GOLD : "#9a9080" }} />
                  {label}
                  {external && <ExternalLink className="w-3.5 h-3.5 ml-auto opacity-45" />}
                  {active && <span className="ml-auto h-1.5 w-1.5 rounded-full" style={{ background: GOLD }} />}
                </span>
              );

              return external ? (
                <a key={label} href={href} target="_blank" rel="noreferrer">{row}</a>
              ) : (
                <Link key={label} to={path} onClick={() => setOpen(false)}>{row}</Link>
              );
            })}

            <a
              href="https://www.koosandmike.co.za"
              target="_blank"
              rel="noreferrer"
              className="mt-1 flex items-center gap-2 border-t px-3 py-3 text-xs font-semibold uppercase tracking-[0.14em]"
              style={{ borderColor: "rgba(201,168,76,0.22)", color: GOLD }}
            >
              <ExternalLink className="w-3.5 h-3.5" /> Visit our website
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
