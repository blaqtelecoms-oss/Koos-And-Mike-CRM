import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { base44 } from "@/api/base44Client";

const GOLD = "#C9A84C";

export default function ChangePasswordDialog({ consultantId, open, onClose, forced = false }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await base44.functions.invoke("consultantAuth", {
        action: "changePassword",
        consultantId,
        newPassword
      });
      if (res.data?.success) {
        setSuccess(true);
        localStorage.removeItem("mustChangePassword");
        setTimeout(() => {
          setSuccess(false);
          setNewPassword("");
          setConfirmPassword("");
          onClose();
        }, 1500);
      } else {
        setError(res.data?.error || "Failed to change password");
      }
    } catch (err) {
      setError(err?.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={forced ? undefined : onClose}>
      <DialogContent className="border" style={{ background: "var(--glass)", borderColor: "#C9A84C33", maxWidth: 400 }}>
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#C9A84C18" }}>
              <KeyRound className="w-5 h-5" style={{ color: GOLD }} />
            </div>
            <DialogTitle className="text-white text-lg">
              {forced ? "Set Your Password" : "Change Password"}
            </DialogTitle>
          </div>
          {forced && (
            <p className="text-white/50 text-sm">
              You're using the default password. Please set a personal password before continuing.
            </p>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">New Password</label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={e => { setNewPassword(e.target.value); setError(""); }}
                placeholder="Min. 6 characters"
                className="w-full px-4 py-3 pr-12 rounded-xl text-white text-sm outline-none"
                style={{ background: "var(--glass)", border: `1px solid ${newPassword ? GOLD : "#C9A84C33"}` }}
              />
              <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2">
                {showNew ? <EyeOff className="w-4 h-4 text-white/30" /> : <Eye className="w-4 h-4 text-white/30" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={e => { setConfirmPassword(e.target.value); setError(""); }}
                placeholder="Repeat your new password"
                className="w-full px-4 py-3 pr-12 rounded-xl text-white text-sm outline-none"
                style={{ background: "var(--glass)", border: `1px solid ${confirmPassword ? GOLD : "#C9A84C33"}` }}
              />
              <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2">
                {showConfirm ? <EyeOff className="w-4 h-4 text-white/30" /> : <Eye className="w-4 h-4 text-white/30" />}
              </button>
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}
          {success && <p className="text-green-400 text-sm">Password changed successfully!</p>}

          <div className="flex gap-3 pt-2">
            {!forced && (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border text-sm font-semibold text-white/50 hover:bg-white/5 transition-all"
                style={{ borderColor: "#ffffff20" }}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={loading || !newPassword || !confirmPassword}
              className="flex-1 py-3 rounded-xl font-semibold text-sm transition-all"
              style={{
                background: !loading && newPassword && confirmPassword ? GOLD : "#ffffff15",
                color: !loading && newPassword && confirmPassword ? "#000" : "#ffffff40"
              }}
            >
              {loading ? "Saving..." : "Save Password"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}