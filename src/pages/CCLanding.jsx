import { useState, useEffect } from "react";
import { Star, ChevronDown, Eye, EyeOff, ArrowRight, Phone } from "lucide-react";
import { api } from "@/api/supabaseClient";

const BLUE = "#ff9d00";

export default function CCLanding() {
  const [consultants, setConsultants] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [logging, setLogging] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Check if already logged in as CC agent
    const stored = localStorage.getItem("ccConsultant");
    if (stored) {
      window.location.href = "/CallCentrePortal";
      return;
    }

    api.functions.invoke("getConsultants", { role: "Call Centre" })
      .then(res => setConsultants(res.data?.consultants || []))
      .catch(() => setConsultants([]))
      .finally(() => setLoading(false));
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!selectedId || !password) return;
    setError("");
    setLogging(true);
    try {
      const res = await api.functions.invoke("consultantAuth", {
        action: "login",
        consultantId: selectedId,
        password
      });
      const data = res.data;
      if (data.success) {
        localStorage.setItem("ccConsultant", JSON.stringify(data.consultant));
        if (data.mustChangePassword) {
          localStorage.setItem("ccMustChangePassword", "1");
        } else {
          localStorage.removeItem("ccMustChangePassword");
        }
        window.location.href = "/CallCentrePortal";
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      setError(err?.response?.data?.error || "Incorrect password or account not found");
    } finally {
      setLogging(false);
    }
  };

  return (
    <div className="km-admin-page min-h-screen flex flex-col" style={{ background: "var(--app-canvas)" }}>
      <div className="h-1 w-full" style={{ background: BLUE }} />

      <header className="border-b py-4 px-6" style={{ borderColor: "#ff9d0022", background: "var(--glass)" }}>
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <img
            src="https://xiqwiiwyjuwrfdezvnoi.supabase.co/storage/v1/object/public/app-assets/km-logo-round.png"
            alt="Koos & Mike Cars"
            className="w-11 h-11 object-contain"
          />
          <div>
            <h1 className="font-bold text-base leading-none" style={{ color: BLUE }}>Koos & Mike Cars</h1>
            <p className="text-xs" style={{ color: "#ff9d0066" }}>Call Centre Portal</p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="text-center mb-10 max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium mb-5 border" style={{ background: "#ff9d0018", borderColor: "#ff9d0044", color: BLUE }}>
            <Phone className="w-4 h-4" /> Call Centre Access
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 leading-tight">
            Welcome Back<br /><span style={{ color: BLUE }}>Call Centre Portal</span>
          </h2>
          <p className="text-gray-500 text-base">
            Select your name and enter your password to access your dashboard.
          </p>
        </div>

        <form onSubmit={handleLogin} className="w-full max-w-md space-y-4">
          <div
            className="rounded-2xl p-8 border space-y-5"
            style={{ background: "rgba(0,0,0,0.03)", borderColor: "#ff9d0033" }}
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "#ff9d0018" }}>
              <Phone className="w-7 h-7" style={{ color: BLUE }} />
            </div>

            {/* Name dropdown */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Your Name</label>
              {loading ? (
                <div className="flex justify-center py-4">
                  <div className="w-6 h-6 border-2 border-amber-500 border-t-amber-200 rounded-full animate-spin" />
                </div>
              ) : (
                <div className="relative">
                  <select
                    value={selectedId}
                    onChange={e => { setSelectedId(e.target.value); setError(""); }}
                    className="w-full appearance-none px-4 py-3 pr-10 rounded-xl text-gray-900 outline-none text-sm font-medium"
                    style={{
                      background: "var(--glass)",
                      border: `1px solid ${selectedId ? BLUE : "#ff9d0033"}`,
                      color: selectedId ? "#fff" : "#ffffff66"
                    }}
                  >
                    <option value="" disabled style={{ color: "#888" }}>— Select your name —</option>
                    {consultants.map(c => (
                      <option key={c.id} value={c.id} style={{ background: "#fff", color: "var(--ink)" }}>{c.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: BLUE }} />
                </div>
              )}
            </div>

            {/* Password field */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(""); }}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 pr-12 rounded-xl text-gray-900 text-sm outline-none"
                  style={{
                    background: "var(--glass)",
                    border: `1px solid ${error ? "#ef4444" : password ? BLUE : "#ff9d0033"}`
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword
                    ? <EyeOff className="w-4 h-4" style={{ color: "var(--mut)" }} />
                    : <Eye className="w-4 h-4" style={{ color: "var(--mut)" }} />
                  }
                </button>
              </div>
              {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
              <p className="text-gray-400 text-xs mt-2">Default password: <span style={{ color: BLUE }}>Leads2026</span></p>
            </div>

            <button
              type="submit"
              disabled={!selectedId || !password || logging}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all"
              style={{
                background: selectedId && password && !logging ? BLUE : "var(--line)",
                color: selectedId && password && !logging ? "#fff" : "var(--mut)",
                cursor: selectedId && password && !logging ? "pointer" : "not-allowed"
              }}
            >
              {logging ? (
                <span className="w-5 h-5 border-2 border-amber-300/60 border-t-white rounded-full animate-spin" />
              ) : (
                <>Go to My Dashboard <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </form>

        <p className="mt-6 text-gray-300 text-xs text-center">
          This portal is for Koos & Mike Cars call centre staff only.
        </p>
      </main>

      <footer className="border-t py-5 text-center text-xs" style={{ borderColor: "#ff9d0022", color: "var(--mut)" }}>
        © 2026 Koos & Mike Cars · Call Centre Portal
      </footer>
    </div>
  );
}