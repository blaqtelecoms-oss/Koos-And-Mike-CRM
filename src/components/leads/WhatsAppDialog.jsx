import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import moment from "moment";

const CONSULTANTS = ["Koos", "Jaco", "Vuyo", "Marius", "Leandri"];

export default function WhatsAppDialog({ lead, open, onClose, onSaved }) {
  const [consultant, setConsultant] = useState("");
  const [message, setMessage] = useState(
    `Hi ${lead?.lead_name || "there"}, this is Koos & Mike Cars. I'm reaching out regarding your enquiry about the ${lead?.car_interested || "vehicle"}. How can I assist you?`
  );
  const [saving, setSaving] = useState(false);

  const handleSend = async () => {
    if (!consultant) return;
    setSaving(true);

    const encodedMsg = encodeURIComponent(message);

    // Log the WhatsApp message as a follow-up
    await base44.entities.LeadFollowUp.create({
      lead_id: lead.id,
      lead_name: lead.lead_name,
      update_date: moment().format("YYYY-MM-DD"),
      contact_method: "WhatsApp Messaged",
      lead_response: "No Response",
      pipeline_stage: "Initial Contact",
      reported_by: consultant,
      notes: `[WhatsApp sent at ${moment().format("HH:mm DD MMM YYYY")} by ${consultant}]\n\n${message}`
    });

    // Open WhatsApp to the LEAD's number
    const leadPhone = (lead.phone || "").replace(/\D/g, ""); // strip all non-digits
    const leadNumber = leadPhone.startsWith("27") ? leadPhone
      : leadPhone.startsWith("0") ? "27" + leadPhone.slice(1)
      : "27" + leadPhone;
    window.open(`https://wa.me/${leadNumber}?text=${encodedMsg}`, "_blank");

    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-sm bg-[#111] border border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <span className="text-2xl">💬</span>
            WhatsApp {lead?.lead_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-white/50 text-xs">
            Send from a consultant's number. The message will be logged in the follow-up history visible to the whole team.
          </p>

          <div>
            <Label className="text-white/70 text-xs mb-1 block">Sending as (Consultant) *</Label>
            <Select value={consultant} onValueChange={(v) => {
              setConsultant(v);
              setMessage(`Hi ${lead?.lead_name || "there"}, this is ${v} from Koos & Mike Cars. I'm reaching out regarding your enquiry about the ${lead?.car_interested || "vehicle"}. How can I assist you?`);
            }}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Select consultant..." />
              </SelectTrigger>
              <SelectContent>
                {CONSULTANTS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-white/70 text-xs mb-1 block">Message to send</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 text-sm"
            />
          </div>

          <div className="bg-green-900/20 border border-green-600/30 rounded-lg px-3 py-2 text-xs">
            <p className="text-green-400 font-semibold">✅ Sending TO (lead):</p>
            <p className="text-white font-bold text-sm mt-0.5">{lead?.phone}</p>
          </div>

          <Button
            onClick={handleSend}
            disabled={saving || !consultant || !message.trim()}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
          >
            {saving ? "Logging & Opening..." : "Send WhatsApp & Log"}
          </Button>

          <Button variant="ghost" onClick={onClose} className="w-full text-white/40 text-xs">
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}