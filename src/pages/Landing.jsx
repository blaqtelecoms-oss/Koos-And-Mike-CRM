import { Car, BarChart2, ArrowRight, Star } from "lucide-react";
import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import AdminPasswordGate from "@/components/AdminPasswordGate";

const GOLD = "#C9A84C";

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
    <div className="min-h-screen flex flex-col" style={{ background: "#0D0D0D" }}>
      {/* Gold top bar */}
      <div className="h-1 w-full" style={{ background: GOLD }} />

      {/* Header */}
      <header className="border-b py-4 px-6" style={{ borderColor: "#C9A84C22", background: "#111111" }}>
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <img
            src="https://media.base44.com/images/public/69ba4650f213ea0fa82b95fb/fab77c211_KMLogo.png"
            alt="Koos & Mike Cars"
            className="w-11 h-11 object-contain"
          />
          <div>
            <h1 className="font-bold text-base leading-none" style={{ color: GOLD }}>Koos & Mike Cars</h1>
            <p className="text-xs" style={{ color: "#C9A84C66" }}>Quality Vehicles, Trusted Service</p>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="text-center mb-14 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium mb-5 border" style={{ background: "#C9A84C18", borderColor: "#C9A84C44", color: GOLD }}>
            <Star className="w-4 h-4" /> Welcome — Choose Your Portal
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
            How Can We<br /><span style={{ color: GOLD }}>Help You Today?</span>
          </h2>
          <p className="text-white/50 text-lg">
            Select the portal that applies to you to get started.
          </p>
        </div>

        {/* Two portal cards */}
        <div className="grid md:grid-cols-2 gap-6 w-full max-w-5xl">
          {/* Client Card */}
          <button
            onClick={handleClientClick}
            className="group text-left rounded-2xl p-8 border transition-all duration-200 hover:scale-[1.02] hover:shadow-2xl cursor-pointer"
            style={{ background: "#ffffff08", borderColor: "#ffffff15" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "#C9A84C55"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "#ffffff15"}
          >
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ background: "#C9A84C18" }}>
              <Car className="w-8 h-8" style={{ color: GOLD }} />
            </div>
            <h3 className="text-white text-2xl font-bold mb-2">I'm a Client</h3>
            <p className="text-white/50 text-sm mb-6 leading-relaxed">
              Browse our vehicles, submit a trade-in, register your interest, or request a specific car.
            </p>
            <div className="flex items-center gap-2 font-semibold text-sm" style={{ color: GOLD }}>
              Enter Client Portal <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          </button>



          {/* Sales Card */}
          <button
            onClick={() => setShowAdminGate(true)}
            className="group text-left rounded-2xl p-8 border transition-all duration-200 hover:scale-[1.02] hover:shadow-2xl cursor-pointer"
            style={{ background: "#ffffff08", borderColor: "#ffffff15" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "#C9A84C55"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "#ffffff15"}
          >
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ background: "#C9A84C18" }}>
              <BarChart2 className="w-8 h-8" style={{ color: GOLD }} />
            </div>
            <h3 className="text-white text-2xl font-bold mb-2">Sales / Admin</h3>
            <p className="text-white/50 text-sm mb-6 leading-relaxed">
              Access the full CRM — manage leads, vehicles, tasks, social posts and more.
            </p>
            <div className="flex items-center gap-2 font-semibold text-sm" style={{ color: GOLD }}>
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

      <footer className="border-t py-5 text-center text-xs" style={{ borderColor: "#C9A84C22", color: "#ffffff25" }}>
        © 2026 Koos & Mike Cars · Quality Vehicles, Trusted Service.
      </footer>
    </div>
  );
}