import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Phone, CheckCircle2, XCircle } from "lucide-react";
import moment from "moment";

const CONSULTANTS = ["Jaco", "Vuyo", "Marius", "Leandri", "Koos", "Call Center"];
const PIPELINE_STAGES = [
  "Initial Contact", "Engaged", "Test Drive Booked", "Test Drive Done",
  "With Sales Department", "With Finance", "Application Submitted",
  "Application Approved", "Deal Closed - Sold", "Deal Closed - Not Buying", "Application Failed"
];

export default function CallDialog({ lead, open, onClose, onSaved, onOptimisticUpdate }) {
  const [step, setStep] = useState("confirm"); // confirm → outcome
  const [leadResponse, setLeadResponse] = useState("Answered - Interested");
  const [pipelineStage, setPipelineStage] = useState("Initial Contact");
  const [reportedBy, setReportedBy] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCall = () => {
    window.location.href = `tel:${lead.phone}`;
    setStep("outcome");
  };

  const handleSave = async () => {
    if (!reportedBy) return;
    setSaving(true);

    // Calculate response time from email_received_date to now
    let responseMinutes = null;
    if (lead.email_received_date) {
      responseMinutes = Math.round(moment().diff(moment(lead.email_received_date), "minutes"));
    } else if (lead.created_date) {
      responseMinutes = Math.round(moment().diff(moment(lead.created_date), "minutes"));
    }

    // Create follow-up log
    await base44.entities.LeadFollowUp.create({
      lead_id: lead.id,
      lead_name: lead.lead_name,
      update_date: moment().format("YYYY-MM-DD"),
      contact_method: "Called",
      lead_response: leadResponse,
      pipeline_stage: pipelineStage,
      reported_by: reportedBy,
      notes: `Called at ${moment().format("HH:mm")} on ${moment().format("DD MMM YYYY")}.`
    });

    // Optimistic update — change status badge immediately
    const newStatus = leadResponse.startsWith("Answered") ? "Contacted" : lead.status;
    if (onOptimisticUpdate && newStatus !== lead.status) {
      onOptimisticUpdate(lead.id, newStatus);
    }

    // Persist to backend
    await base44.entities.Lead.update(lead.id, {
      response_time_minutes: responseMinutes,
      status: newStatus
    });

    setSaving(false);
    onSaved();
    onClose();
    setStep("confirm");
    setReportedBy("");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { onClose(); setStep("confirm"); } }}>
      <DialogContent className="max-w-sm bg-white/90 backdrop-blur-xl border border-amber-200/60 text-gray-900">
        <DialogHeader>
          <DialogTitle className="text-gray-900 flex items-center gap-2">
            <Phone className="w-5 h-5 text-amber-400" />
            Call {lead?.lead_name}
          </DialogTitle>
        </DialogHeader>

        {step === "confirm" && (
          <div className="space-y-4">
            <p className="text-gray-600 text-sm">
              Tap below to call <span className="text-amber-400 font-semibold">{lead?.phone}</span>. The app will record the call time and prompt you for the outcome.
            </p>
            <Button
              onClick={handleCall}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold text-base py-6"
            >
              <Phone className="w-5 h-5 mr-2" />
              Call Now
            </Button>
            <Button variant="ghost" onClick={onClose} className="w-full text-gray-400">
              Cancel
            </Button>
          </div>
        )}

        {step === "outcome" && (
          <div className="space-y-4">
            <p className="text-gray-600 text-sm">Call logged at <span className="text-amber-400">{moment().format("HH:mm")}</span>. What was the outcome?</p>

            <div>
              <Label className="text-gray-700 text-xs mb-1 block">Call Outcome</Label>
              <div className="grid grid-cols-2 gap-2">
                {["Answered - Interested", "Answered - Not Interested", "No Answer", "Callback Requested"].map((r) => (
                  <button
                    key={r}
                    onClick={() => setLeadResponse(r)}
                    className={`text-xs px-3 py-2 rounded-lg border transition-all ${
                      leadResponse === r
                        ? "border-amber-500 bg-amber-600/20 text-amber-300"
                        : "border-amber-200/60 bg-white/70 text-gray-500 hover:border-amber-300/60"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-gray-700 text-xs mb-1 block">Pipeline Stage</Label>
              <Select value={pipelineStage} onValueChange={setPipelineStage}>
                <SelectTrigger className="bg-white/70 border-amber-200/60 text-gray-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PIPELINE_STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-gray-700 text-xs mb-1 block">Who called? *</Label>
              <Select value={reportedBy} onValueChange={setReportedBy}>
                <SelectTrigger className="bg-white/70 border-amber-200/60 text-gray-900">
                  <SelectValue placeholder="Select consultant..." />
                </SelectTrigger>
                <SelectContent>
                  {CONSULTANTS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleSave}
              disabled={saving || !reportedBy}
              className="w-full bg-amber-600 hover:bg-amber-700 text-black font-semibold"
            >
              {saving ? "Saving..." : "Save & Close"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}