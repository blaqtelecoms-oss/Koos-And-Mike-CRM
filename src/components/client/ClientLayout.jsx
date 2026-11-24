import { MessageCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import ClientNav from "@/components/client/ClientNav";

const GOLD = "var(--gold)";

export default function ClientLayout({ children }) {
  return (
    <div className="min-h-screen" style={{ background: "var(--app-canvas)" }}>
      {/* Gold top bar */}
      <div className="h-1 w-full" style={{ background: GOLD }} />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b backdrop-blur-sm" style={{ background: "rgba(255,255,255,0.9)", borderColor: "#C9A84C22" }}>
        <div className="max-w-6xl mx-auto px-4 pt-3 pb-2 flex items-center justify-between gap-3">
          <Link to="/ClientPortal" className="flex items-center gap-3 min-w-0">
            <img
              src="https://xiqwiiwyjuwrfdezvnoi.supabase.co/storage/v1/object/public/app-assets/km-logo.png"
              alt="Koos & Mike Cars"
              className="w-10 h-10 object-contain shrink-0"
            />
            <div className="min-w-0">
              <h1 className="font-bold text-base leading-none truncate" style={{ color: GOLD }}>Koos &amp; Mike Cars</h1>
              <p className="text-xs" style={{ color: "#C9A84C99" }}>Client Portal</p>
            </div>
          </Link>

          <div className="flex gap-2 items-center shrink-0">
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

        {/* Page menu — always visible, wraps on small screens */}
        <div className="max-w-6xl mx-auto px-4 pb-2.5">
          <ClientNav />
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t py-6 text-center text-xs mt-10" style={{ borderColor: "#C9A84C22", color: "var(--mut)" }}>
        © 2026 Koos &amp; Mike Cars · Quality Vehicles, Trusted Service.
      </footer>
    </div>
  );
}
