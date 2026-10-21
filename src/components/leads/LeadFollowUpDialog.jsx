import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Plus, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import moment from "moment";

const CONTACT_METHODS = ["Called", "WhatsApp Messaged", "Email Sent", "In Person", "No Contact Attempted"];
const LEAD_RESPONSES = ["Answered - Interested", "Answered - Not Interested", "No Answer", "Callback Requested", "WhatsApp Replied", "No Response"];
const PIPELINE_STAGES = [
  "Initial Contact",
  "Engaged",
  "Test Drive Booked",
  "Test Drive Done",
  "With Sales Department",
  "With Finance",
  "Application Submitted",
  "Application Approved",
  "Deal Closed - Sold",
  "Deal Closed - Not Buying",
  "Application Failed"
];
const CONSULTANTS = ["Jaco", "Vuyo", "Marius", "Leandri", "Koos", "Call Center"];

const CLOSED_STAGES = ["Deal Closed - Sold", "Deal Closed - Not Buying", "Application Failed"];

const stageColor = (stage) => {
  if (stage === "Deal Closed - Sold") return "text-emerald-400 bg-emerald-900/30 border-emerald-700/40";
  if (stage === "Deal Closed - Not Buying" || stage === "Application Failed") return "text-red-400 bg-red-900/30 border-red-700/40";
  if (stage?.includes("Finance") || stage?.includes("Application")) return "text-purple-400 bg-purple-900/30 border-purple-700/40";
  if (stage?.includes("Sales")) return "text-blue-400 bg-blue-900/30 border-blue-700/40";
  return "text-amber-400 bg-amber-900/30 border-amber-700/40";
};

const stageIcon = (stage) => {
  if (stage === "Deal Closed - Sold") return <CheckCircle2 className="w-3.5 h-3.5" />;
  if (CLOSED_STAGES.includes(stage)) return <XCircle className="w-3.5 h-3.5" />;
  return <Clock className="w-3.5 h-3.5" />;
};

export default function LeadFollowUpDialog({ lead, open, onClose }) {
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    contact_method: "Called",
    lead_response: "No Answer",
    pipeline_stage: "Initial Contact",
    reported_by: "",
    notes: "",
    update_date: moment().format("YYYY-MM-DD")
  });

  useEffect(() => {
    if (open && lead) {
      loadFollowUps();
    }
  }, [open, lead]);

  const loadFollowUps = async () => {
    setLoading(true);
    const data = await base44.entities.LeadFollowUp.filter({ lead_id: lead.id }, "-update_date", 50);
    setFollowUps(data);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await base44.entities.LeadFollowUp.create({
      ...form,
      lead_id: lead.id,
      lead_name: lead.lead_name
    });
    setShowForm(false);
    resetForm();
    await loadFollowUps();
    setSubmitting(false);
  };

  const resetForm = () => {
    setForm({
      contact_method: "Called",
      lead_response: "No Answer",
      pipeline_stage: "Initial Contact",
      reported_by: "",
      notes: "",
      update_date: moment().format("YYYY-MM-DD")
    });
  };

  const latestStage = followUps[0]?.pipeline_stage;
  const isClosed = CLOSED_STAGES.includes(latestStage);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto bg-white/90 backdrop-blur-xl border border-amber-200/60 text-gray-900">
        <DialogHeader>
          <DialogTitle className="text-gray-900 text-lg">
            Follow-Up Log — <span className="text-amber-400">{lead?.lead_name}</span>
          </DialogTitle>
          <p className="text-gray-500 text-sm">{lead?.car_interested || "No vehicle specified"} · {lead?.phone}</p>
        </DialogHeader>

        {/* Current stage banner */}
        {latestStage && (
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium ${stageColor(latestStage)}`}>
            {stageIcon(latestStage)}
            Current Stage: {latestStage}
          </div>
        )}

        {/* Add update button */}
        {!isClosed && (
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-amber-600 hover:bg-amber-700 text-black font-semibold w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            {showForm ? "Cancel Update" : "Add Daily Update"}
          </Button>
        )}

        {isClosed && (
          <div className="flex items-center gap-2 text-gray-400 text-sm text-center justify-center py-2">
            <AlertCircle className="w-4 h-4" />
            This lead is closed — no further updates required.
          </div>
        )}

        {/* Add Update Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-3 bg-white/70 p-4 rounded-xl border border-amber-200/60">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-700 text-xs">Date</Label>
                <Input
                  type="date"
                  value={form.update_date}
                  onChange={(e) => setForm({ ...form, update_date: e.target.value })}
                  className="bg-white/70 border-amber-200/60 text-gray-900"
                />
              </div>
              <div>
                <Label className="text-gray-700 text-xs">Reported By</Label>
                <Select value={form.reported_by} onValueChange={(v) => setForm({ ...form, reported_by: v })}>
                  <SelectTrigger className="bg-white/70 border-amber-200/60 text-gray-900">
                    <SelectValue placeholder="Consultant..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CONSULTANTS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-700 text-xs">Contact Method</Label>
                <Select value={form.contact_method} onValueChange={(v) => setForm({ ...form, contact_method: v })}>
                  <SelectTrigger className="bg-white/70 border-amber-200/60 text-gray-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTACT_METHODS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-700 text-xs">Lead Response</Label>
                <Select value={form.lead_response} onValueChange={(v) => setForm({ ...form, lead_response: v })}>
                  <SelectTrigger className="bg-white/70 border-amber-200/60 text-gray-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_RESPONSES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label className="text-gray-700 text-xs">Pipeline Stage *</Label>
                <Select value={form.pipeline_stage} onValueChange={(v) => setForm({ ...form, pipeline_stage: v })}>
                  <SelectTrigger className="bg-white/70 border-amber-200/60 text-gray-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PIPELINE_STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label className="text-gray-700 text-xs">Notes</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="What happened today with this lead?"
                  rows={3}
                  className="bg-white/70 border-amber-200/60 text-gray-900 placeholder:text-gray-400"
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={submitting || !form.reported_by}
              className="w-full bg-amber-600 hover:bg-amber-700 text-black font-semibold"
            >
              {submitting ? "Saving..." : "Save Update"}
            </Button>
          </form>
        )}

        {/* Follow-up History */}
        <div className="space-y-3 mt-2">
          <h4 className="text-gray-600 text-xs uppercase tracking-wider font-semibold">Update History</h4>
          {loading ? (
            <div className="text-center py-6 text-gray-400 text-sm">Loading...</div>
          ) : followUps.length === 0 ? (
            <div className="text-center py-6 text-gray-400 text-sm">No updates yet. Add the first daily update.</div>
          ) : (
            followUps.map((fu) => (
              <div key={fu.id} className="bg-white/70 rounded-xl p-3 border border-amber-200/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-amber-400 font-semibold text-sm">{moment(fu.update_date).format("DD MMM YYYY")}</span>
                  <span className="text-gray-400 text-xs">by {fu.reported_by}</span>
                </div>
                <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium ${stageColor(fu.pipeline_stage)}`}>
                  {stageIcon(fu.pipeline_stage)}
                  {fu.pipeline_stage}
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                  {fu.contact_method && <span className="bg-white/70 px-2 py-0.5 rounded">{fu.contact_method}</span>}
                  {fu.lead_response && <span className="bg-white/70 px-2 py-0.5 rounded">{fu.lead_response}</span>}
                </div>
                {fu.notes && <p className="text-gray-700 text-sm">{fu.notes}</p>}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}