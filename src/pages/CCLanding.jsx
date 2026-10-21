import { useState, useEffect } from "react";
import { Star, ChevronDown, Eye, EyeOff, ArrowRight, Phone } from "lucide-react";
import { base44 } from "@/api/base44Client";

const BLUE = "#3b82f6";

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

    base44.functions.invoke("getConsultants", { role: "Call Centre" })
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
      const res = await base44.functions.invoke("consultantAuth", {
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
    <div className="min-h-screen flex flex-col" style={{ background: "#0D0D0D" }}>
      <div className="h-1 w-full" style={{ background: BLUE }} />

      <header className="border-b py-4 px-6" style={{ borderColor: "#3b82f622", background: "#111111" }}>
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <img
            src="https://media.base44.com/images/public/69ba4650f213ea0fa82b95fb/fab77c211_KMLogo.png"
            alt="Koos & Mike Cars"
            className="w-11 h-11 object-contain"
          />
          <div>
            <h1 className="font-bold text-base leading-none" style={{ color: BLUE }}>Koos & Mike Cars</h1>
            <p className="text-xs" style={{ color: "#3b82f666" }}>Call Centre Portal</p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="text-center mb-10 max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium mb-5 border" style={{ background: "#3b82f618", borderColor: "#3b82f644", color: BLUE }}>
            <Phone className="w-4 h-4" /> Call Centre Access
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
            Welcome Back<br /><span style={{ color: BLUE }}>Call Centre Portal</span>
          </h2>
          <p className="text-white/50 text-base">
            Select your name and enter your password to access your dashboard.
          </p>
        </div>

        <form onSubmit={handleLogin} className="w-full max-w-md space-y-4">
          <div
            className="rounded-2xl p-8 border space-y-5"
            style={{ background: "#ffffff08", borderColor: "#3b82f633" }}
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "#3b82f618" }}>
              <Phone className="w-7 h-7" style={{ color: BLUE }} />
            </div>

            {/* Name dropdown */}
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Your Name</label>
              {loading ? (
                <div className="flex justify-center py-4">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-blue-300 rounded-full animate-spin" />
                </div>
              ) : (
                <div className="relative">
                  <select
                    value={selectedId}
                    onChange={e => { setSelectedId(e.target.value); setError(""); }}
                    className="w-full appearance-none px-4 py-3 pr-10 rounded-xl text-white outline-none text-sm font-medium"
                    style={{
                      background: "#1a1a1a",
                      border: `1px solid ${selectedId ? BLUE : "#3b82f633"}`,
                      color: selectedId ? "#fff" : "#ffffff66"
                    }}
                  >
                    <option value="" disabled style={{ color: "#888" }}>— Select your name —</option>
                    {consultants.map(c => (
                      <option key={c.id} value={c.id} style={{ background: "#1a1a1a", color: "#fff" }}>{c.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: BLUE }} />
                </div>
              )}
            </div>

            {/* Password field */}
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(""); }}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 pr-12 rounded-xl text-white text-sm outline-none"
                  style={{
                    background: "#1a1a1a",
                    border: `1px solid ${error ? "#ef4444" : password ? BLUE : "#3b82f633"}`
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword
                    ? <EyeOff className="w-4 h-4" style={{ color: "#ffffff40" }} />
                    : <Eye className="w-4 h-4" style={{ color: "#ffffff40" }} />
                  }
                </button>
              </div>
              {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
              <p className="text-white/30 text-xs mt-2">Default password: <span style={{ color: BLUE }}>Leads2026</span></p>
            </div>

            <button
              type="submit"
              disabled={!selectedId || !password || logging}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all"
              style={{
                background: selectedId && password && !logging ? BLUE : "#ffffff15",
                color: selectedId && password && !logging ? "#fff" : "#ffffff40",
                cursor: selectedId && password && !logging ? "pointer" : "not-allowed"
              }}
            >
              {logging ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Go to My Dashboard <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </form>

        <p className="mt-6 text-white/20 text-xs text-center">
          This portal is for Koos & Mike Cars call centre staff only.
        </p>
      </main>

      <footer className="border-t py-5 text-center text-xs" style={{ borderColor: "#3b82f622", color: "#ffffff25" }}>
        © 2026 Koos & Mike Cars · Call Centre Portal
      </footer>
    </div>
  );
}