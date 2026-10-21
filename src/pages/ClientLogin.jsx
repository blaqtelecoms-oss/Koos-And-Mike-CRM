import { useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Car, Star, MessageCircle } from "lucide-react";

const GOLD = "#C9A84C";

export default function ClientLogin() {
  useEffect(() => {
    // If already logged in, redirect to client portal
    base44.auth.isAuthenticated().then((authed) => {
      if (authed) {
        window.location.href = "/ClientPortal";
      }
    });
  }, []);

  const handleLogin = () => {
    base44.auth.redirectToLogin("/ClientPortal");
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0D0D0D" }}>
      {/* Gold top bar */}
      <div className="h-1 w-full" style={{ background: GOLD }} />

      {/* Header */}
      <header className="border-b backdrop-blur-sm" style={{ background: "#111111ee", borderColor: "#C9A84C22" }}>
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="https://media.base44.com/images/public/69ba4650f213ea0fa82b95fb/fab77c211_KMLogo.png"
              alt="Koos & Mike Cars"
              className="w-11 h-11 object-contain"
            />
            <div>
              <h1 className="font-bold text-lg leading-none" style={{ color: GOLD }}>Koos & Mike Cars</h1>
              <p className="text-xs" style={{ color: "#C9A84C77" }}>Client Portal</p>
            </div>
          </div>
          <a href="https://wa.me/27789657049" target="_blank" rel="noreferrer">
            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-2">
              <MessageCircle className="w-4 h-4" /> WhatsApp Us
            </Button>
          </a>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="rounded-2xl border p-8 text-center" style={{ background: "#151515", borderColor: "#C9A84C33" }}>
            {/* Icon */}
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "#C9A84C15" }}>
              <Car className="w-10 h-10" style={{ color: GOLD }} />
            </div>

            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium mb-4 border" style={{ background: "#C9A84C12", borderColor: "#C9A84C40", color: GOLD }}>
              <Star className="w-3 h-3" /> Trusted by thousands of South Africans
            </div>

            <h2 className="text-white text-3xl font-extrabold mb-3">
              Welcome to the<br /><span style={{ color: GOLD }}>Client Portal</span>
            </h2>
            <p className="text-white/60 text-sm mb-8 leading-relaxed">
              Sign in or create a free account to browse our inventory, register your interest, submit a trade-in, or request a specific vehicle.
            </p>

            <Button
              onClick={handleLogin}
              className="w-full py-6 text-lg font-bold rounded-xl text-black gap-2 mb-4"
              style={{ background: GOLD }}
            >
              Sign In / Create Account
            </Button>

            <p className="text-white/30 text-xs">
              By signing in you agree to our terms of service.<br />
              This portal is for customers only.
            </p>
          </div>

          {/* Features */}
          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            {[
              { emoji: "🚗", label: "Browse Inventory" },
              { emoji: "🔁", label: "Trade-In" },
              { emoji: "🔍", label: "Request a Car" },
            ].map(({ emoji, label }) => (
              <div key={label} className="rounded-xl p-3 border" style={{ background: "#ffffff06", borderColor: "#C9A84C20" }}>
                <div className="text-2xl mb-1">{emoji}</div>
                <p className="text-xs font-medium" style={{ color: "#C9A84C99" }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t py-4 text-center text-xs" style={{ borderColor: "#C9A84C22", color: "#ffffff33" }}>
        © 2026 Koos & Mike Cars · Quality Vehicles, Trusted Service.
      </footer>
    </div>
  );
}