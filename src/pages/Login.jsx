import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { api } from "@/api/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Mail, ArrowLeft } from "lucide-react";

const GOLD = "#C9A84C";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email.trim(), password);
      let destination = redirect;
      if (!destination) {
        try {
          const user = await api.auth.me();
          destination = user?.role === "admin" ? "/Dashboard" : "/MyLeads";
        } catch {
          destination = "/Dashboard";
        }
      }
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err?.message?.includes("Invalid login") ? "Incorrect email or password." : err?.message || "Sign in failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--app-canvas)" }}>
      <div className="h-1 w-full" style={{ background: GOLD }} />

      <header className="border-b backdrop-blur-sm" style={{ background: "rgba(255,255,255,0.85)", borderColor: "#C9A84C22" }}>
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "#C9A84C20" }}>
              <span className="font-bold" style={{ color: GOLD }}>K&amp;M</span>
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none" style={{ color: GOLD }}>Koos &amp; Mike Cars</h1>
              <p className="text-xs" style={{ color: "#C9A84C77" }}>Staff &amp; Client Sign In</p>
            </div>
          </div>
          <Link to="/" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm rounded-2xl border p-8" style={{ background: "rgba(255,255,255,0.9)", borderColor: "#C9A84C33", boxShadow: "0 10px 30px rgba(150,125,30,0.12)" }}>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Sign in</h2>
          <p className="text-sm text-gray-500 mb-6">Use your email address and password.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1.5">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  className="pl-9 bg-white border-amber-200/70 text-gray-900"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  className="pl-9 bg-white border-amber-200/70 text-gray-900"
                  required
                />
              </div>
            </div>

            {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

            <Button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full font-semibold"
              style={{ background: GOLD, color: "#000" }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
