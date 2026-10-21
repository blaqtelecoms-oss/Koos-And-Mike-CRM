import { MessageCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";

const GOLD = "#C9A84C";

const navItems = [
  { label: "Home", path: "/ClientPortal" },
  { label: "🎵 K&M Music Station", path: null, href: "https://zeno.fm/radio/KM-radio-neog/", external: true },
  { label: "Register Interest", path: "/ClientRegister" },
  { label: "Trade-In", path: "/ClientTradeIn" },
  { label: "Request a Car", path: "/ClientCarRequest" },
];

export default function ClientLayout({ children }) {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen" style={{ background: "var(--app-canvas)" }}>
      {/* Gold top bar */}
      <div className="h-1 w-full" style={{ background: GOLD }} />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b" style={{ background: "rgba(255,255,255,0.85)", borderColor: "#C9A84C22" }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/ClientPortal" className="flex items-center gap-3">
            <img
              src="https://media.base44.com/images/public/69ba4650f213ea0fa82b95fb/fab77c211_KMLogo.png"
              alt="Koos & Mike Cars"
              className="w-10 h-10 object-contain"
            />
            <div>
              <h1 className="font-bold text-base leading-none" style={{ color: GOLD }}>Koos & Mike Cars</h1>
              <p className="text-xs" style={{ color: "#C9A84C88" }}>Client Portal</p>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(item => item.external ? (
              <a key={item.href} href={item.href} target="_blank" rel="noreferrer">
                <Button variant="ghost" size="sm" className="text-sm transition-colors" style={{ color: GOLD }}>
                  {item.label}
                </Button>
              </a>
            ) : (
              <Link key={item.path} to={item.path}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-sm transition-colors"
                  style={pathname === item.path
                    ? { color: GOLD, background: "#C9A84C18" }
                    : { color: "#ffffff99" }
                  }
                >
                  {item.label}
                </Button>
              </Link>
            ))}
          </nav>

          <div className="flex gap-2 items-center">
            <a href="https://www.koosandmike.co.za" target="_blank" rel="noreferrer" className="hidden sm:block">
              <Button size="sm" variant="outline" className="gap-1 text-xs" style={{ borderColor: "#C9A84C55", color: GOLD, background: "transparent" }}>
                <ExternalLink className="w-3 h-3" /> Website
              </Button>
            </a>
            <a href="https://wa.me/27695498731" target="_blank" rel="noreferrer">
              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-1 text-xs">
                <MessageCircle className="w-3 h-3" /> WhatsApp
              </Button>
            </a>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="md:hidden flex gap-1 px-4 pb-2 overflow-x-auto">
          {navItems.map(item => item.external ? (
            <a key={item.href} href={item.href} target="_blank" rel="noreferrer" className="shrink-0">
              <Button variant="ghost" size="sm" className="text-xs whitespace-nowrap transition-colors" style={{ color: GOLD }}>
                {item.label}
              </Button>
            </a>
          ) : (
            <Link key={item.path} to={item.path} className="shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs whitespace-nowrap transition-colors"
                style={pathname === item.path
                  ? { color: GOLD, background: "#C9A84C18" }
                  : { color: "#ffffff55" }
                }
              >
                {item.label}
              </Button>
            </Link>
          ))}
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t py-6 text-center text-xs mt-10" style={{ borderColor: "#C9A84C22", color: "#ffffff33" }}>
        © 2026 Koos & Mike Cars · Quality Vehicles, Trusted Service.
      </footer>
    </div>
  );
}