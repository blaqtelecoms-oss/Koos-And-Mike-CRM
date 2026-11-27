import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import Avatar from "@/components/premium/Avatar";
import StatusPill from "@/components/premium/StatusPill";
import { Phone, Mail, Car, Clock, Edit, ClipboardList, MessageCircle } from "lucide-react";
import moment from "moment";

export default function LeadDetailSheet({ lead, platform, open, onClose, onEdit, onFollowUp, onLogCall, onWhatsApp }) {
  if (!lead) return null;

  const created = lead.created_date ? moment(lead.created_date) : null;
  const age = created && created.isValid() ? created.fromNow() : null;
  const added = created && created.isValid() ? created.format("DD MMM YYYY, HH:mm") : "—";
  const hasResponseTime = lead.response_time_minutes !== null && lead.response_time_minutes !== undefined && lead.response_time_minutes !== "";

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent className="lead-sheet">
        <DialogTitle className="sr-only">{lead.lead_name || "Lead"} details</DialogTitle>

        <div className="lead-sheet-head">
          <Avatar name={lead.lead_name || "?"} size={46} />
          <div className="lead-sheet-id">
            <div className="lead-sheet-name">{lead.lead_name || "Unnamed lead"}</div>
            <div className="lead-sheet-sub">{lead.phone || "No phone number"}</div>
          </div>
          <StatusPill status={lead.status} />
        </div>

        <div className="lead-sheet-facts">
          <div><span>In system</span><b>{age || "—"}</b></div>
          <div><span>Added</span><b>{added}</b></div>
          <div><span>Source</span><b>{lead.source || "—"}</b></div>
          <div><span>Consultant</span><b>{lead.assigned_consultant || "Unassigned"}</b></div>
        </div>

        {lead.car_interested && (
          <div className="lead-sheet-interest">
            <span>Interested in</span>
            <div>
              <Car />
              <b>{lead.car_interested}</b>
              {platform && <em style={{ background: platform.color + "22", color: platform.color }}>{platform.name}</em>}
            </div>
          </div>
        )}

        <div className="lead-sheet-links">
          {lead.phone && <a href={`tel:${lead.phone}`}><Phone /> {lead.phone}</a>}
          {lead.email && <a href={`mailto:${lead.email}`}><Mail /> {lead.email}</a>}
          {hasResponseTime && <div><Clock /> Responded in {lead.response_time_minutes} min</div>}
        </div>

        {lead.notes && <div className="lead-sheet-notes">{lead.notes}</div>}

        <div className="lead-sheet-actions">
          <button type="button" className="lead-sheet-action primary" onClick={() => onLogCall(lead)}>
            <Phone /> Log call
          </button>
          {lead.phone && (
            <button type="button" className="lead-sheet-action" onClick={() => onWhatsApp(lead)}>
              <MessageCircle /> WhatsApp
            </button>
          )}
          <button type="button" className="lead-sheet-action" onClick={() => onFollowUp(lead)}>
            <ClipboardList /> Follow-up
          </button>
          <button type="button" className="lead-sheet-action" onClick={() => onEdit(lead)}>
            <Edit /> Edit lead
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
