import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock } from "lucide-react";

const ADMIN_PASSWORD = "Admin2026";

export default function AdminPasswordGate({ open, onClose, onSuccess }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setPassword("");
      setError(false);
      onSuccess();
    } else {
      setError(true);
      setPassword("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { setPassword(""); setError(false); onClose(); } }}>
      <DialogContent className="max-w-sm bg-[#111] border border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Lock className="w-5 h-5 text-amber-400" /> Admin Access
          </DialogTitle>
        </DialogHeader>

        <p className="text-white/50 text-sm">
          This portal is restricted to staff only. Please enter the admin password to continue.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <Input
            type="password"
            placeholder="Enter password..."
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false); }}
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
            autoFocus
          />
          {error && (
            <p className="text-red-400 text-sm font-medium">Incorrect password. Please try again.</p>
          )}
          <Button
            type="submit"
            disabled={!password}
            className="w-full font-semibold"
            style={{ background: "#C9A84C", color: "#000" }}
          >
            Unlock Admin Portal
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}