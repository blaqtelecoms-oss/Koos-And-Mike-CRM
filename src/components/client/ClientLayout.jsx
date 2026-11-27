import { PUBLIC_ASSETS } from "@/lib/supabaseUrl";
import { MessageCircle, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import ClientNav from "@/components/client/ClientNav";
import ClientMenu from "@/components/client/ClientMenu";
import ClientBottomNav from "@/components/client/ClientBottomNav";

export default function ClientLayout({ children }) {
  return (
    <div className="min-h-screen" style={{ background: "var(--app-canvas)" }}>
      {/* Gold accent line */}
      <div
        className="h-[3px] w-full"
        style={{ background: "linear-gradient(90deg, var(--gold-deep), var(--gold), var(--gold-light), var(--gold), var(--gold-deep))" }}
      />

      {/* Header */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{ background: "rgba(255,253,247,0.92)", backdropFilter: "blur(14px)", borderColor: "rgba(201,168,76,0.22)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Brand */}
          <Link to="/ClientPortal" className="flex items-center gap-3 shrink-0">
            <img
              src={`${PUBLIC_ASSETS}/km-logo-round.png`}
              alt="Koos & Mike Cars"
              className="h-9 w-9 object-contain"
            />
            <div className="leading-none">
              <div className="text-[13px] font-semibold uppercase tracking-[0.16em]" style={{ color: "#17130a" }}>
                Koos &amp; Mike Cars
              </div>
              <div className="mt-1 text-[9px] font-semibold uppercase tracking-[0.32em]" style={{ color: "#a08a4f" }}>
                Client Portal
              </div>
            </div>
          </Link>

          {/* Primary navigation */}
          <div className="hidden min-[980px]:flex flex-1 justify-center">
            <ClientNav />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <a
              href="https://www.koosandmike.co.za"
              target="_blank"
              rel="noreferrer"
              aria-label="Visit our website"
              className="inline-flex items-center gap-1.5 h-9 px-2.5 lg:px-3 rounded-full text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors hover:bg-[rgba(201,168,76,0.12)]"
              style={{ color: "#6b6355" }}
            >
              <ExternalLink className="w-3.5 h-3.5" /> <span className="hidden lg:inline">Website</span>
            </a>
            <a
              href="https://wa.me/27695498731"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-1.5 h-9 w-9 sm:w-auto sm:px-4 rounded-full text-xs font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "#128C4A", boxShadow: "0 6px 16px rgba(18,140,74,0.22)" }}
            >
              <MessageCircle className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </a>
            <ClientMenu />
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t pt-6 pb-28 min-[980px]:pb-6 text-center text-xs mt-10" style={{ borderColor: "#C9A84C22", color: "var(--mut)" }}>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mb-2">
          <Link to="/ClientPrivacy" className="hover:underline">Privacy Policy</Link>
          <span aria-hidden="true" style={{ color: "#C9A84C55" }}>·</span>
          <Link to="/ClientTerms" className="hover:underline">Terms of Service</Link>
        </div>
        © 2026 Koos &amp; Mike Cars · Quality Vehicles, Trusted Service.
      </footer>

      <ClientBottomNav />
    </div>
  );
}
