import { Car, BarChart2, ArrowRight, Star } from "lucide-react";
import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import AdminPasswordGate from "@/components/AdminPasswordGate";

const GOLD = "#f6c635";
const GOLD_DEEP = "#f59e0b";
const INK = "#f7f3e4";
const MUT = "#a39d84";
const GLASS = "rgba(255,255,255,0.06)";
const GLASS_BORDER = "rgba(255,255,255,0.1)";
const CANVAS = "linear-gradient(135deg, #1d1b14, #2a2412 60%, #3d3213 130%)";
const SHADOW = "0 10px 30px rgba(0,0,0,0.4)";

export default function Landing() {
  const navigate = useNavigate();
  const [showAdminGate, setShowAdminGate] = useState(false);

  const handleClientClick = () => {
    navigate("/ClientPortal");
  };

  const handleSalesLogin = () => {
    base44.auth.redirectToLogin("/Dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: CANVAS, fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Header */}
      <header className="py-5 px-6" style={{ borderBottom: `1px solid rgba(120,105,50,0.14)` }}>
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <img
            src="https://media.base44.com/images/public/69ba4650f213ea0fa82b95fb/fab77c211_KMLogo.png"
            alt="Koos & Mike Cars"
            className="w-11 h-11 object-contain"
          />
          <div>
            <h1 className="font-bold text-base leading-none" style={{ color: INK }}>Koos & Mike Cars</h1>
            <p className="text-xs mt-1" style={{ color: GOLD_DEEP }}>Quality Vehicles, Trusted Service</p>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="text-center mb-14 max-w-2xl">
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium mb-5"
            style={{ background: GLASS, border: `1px solid ${GLASS_BORDER}`, color: GOLD_DEEP, boxShadow: SHADOW, backdropFilter: "blur(16px)" }}
          >
            <Star className="w-4 h-4" /> Welcome — Choose Your Portal
          </div>
          <h2 className="text-4xl md:text-5xl font-light mb-4 leading-tight" style={{ color: INK, letterSpacing: "-1.4px" }}>
            How Can We<br /><b style={{ fontWeight: 600, color: GOLD_DEEP }}>Help You Today?</b>
          </h2>
          <p className="text-lg" style={{ color: MUT }}>
            Select the portal that applies to you to get started.
          </p>
        </div>

        {/* Two portal cards */}
        <div className="grid md:grid-cols-2 gap-6 w-full max-w-5xl">
          {/* Client Card */}
          <button
            onClick={handleClientClick}
            className="group text-left rounded-3xl p-8 transition-all duration-200 hover:scale-[1.02] cursor-pointer"
            style={{ background: GLASS, border: `1px solid ${GLASS_BORDER}`, boxShadow: SHADOW, backdropFilter: "blur(18px)" }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
              style={{ background: "rgba(246,198,53,0.15)" }}
            >
              <Car className="w-8 h-8" style={{ color: GOLD_DEEP }} />
            </div>
            <h3 className="text-2xl font-semibold mb-2" style={{ color: INK }}>I'm a Client</h3>
            <p className="text-sm mb-6 leading-relaxed" style={{ color: MUT }}>
              Browse our vehicles, submit a trade-in, register your interest, or request a specific car.
            </p>
            <div
              className="inline-flex items-center gap-2 font-semibold text-sm rounded-full px-5 py-2.5"
              style={{ background: "linear-gradient(145deg, #ffe082, #f6c635)", color: "#1c1400", boxShadow: "0 8px 20px rgba(246,198,53,0.35)" }}
            >
              Enter Client Portal <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          </button>

          {/* Sales Card */}
          <button
            onClick={() => setShowAdminGate(true)}
            className="group text-left rounded-3xl p-8 transition-all duration-200 hover:scale-[1.02] cursor-pointer"
            style={{ background: GLASS, border: `1px solid ${GLASS_BORDER}`, boxShadow: SHADOW, backdropFilter: "blur(18px)" }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
              style={{ background: "rgba(246,198,53,0.15)" }}
            >
              <BarChart2 className="w-8 h-8" style={{ color: GOLD_DEEP }} />
            </div>
            <h3 className="text-2xl font-semibold mb-2" style={{ color: INK }}>Sales / Admin</h3>
            <p className="text-sm mb-6 leading-relaxed" style={{ color: MUT }}>
              Access the full CRM — manage leads, vehicles, tasks, social posts and more.
            </p>
            <div
              className="inline-flex items-center gap-2 font-semibold text-sm rounded-full px-5 py-2.5"
              style={{ background: "linear-gradient(145deg, #ffe082, #f6c635)", color: "#1c1400", boxShadow: "0 8px 20px rgba(246,198,53,0.35)" }}
            >
              Enter Sales Dashboard <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          </button>
        </div>
      </main>

      <AdminPasswordGate
        open={showAdminGate}
        onClose={() => setShowAdminGate(false)}
        onSuccess={handleSalesLogin}
      />

      <footer className="py-5 text-center text-xs" style={{ color: MUT, borderTop: `1px solid rgba(120,105,50,0.14)` }}>
        © 2026 Koos & Mike Cars · Quality Vehicles, Trusted Service.
      </footer>
    </div>
  );
}