import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { MessageCircle, Phone, RefreshCw } from "lucide-react";

const GOLD = "#C9A84C";

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
  "Application Failed",
];

const STAGE_COLORS = {
  "Initial Contact": "#3b82f6",
  "Engaged": "#8b5cf6",
  "Test Drive Booked": "#f59e0b",
  "Test Drive Done": "#f97316",
  "With Sales Department": "#C9A84C",
  "With Finance": "#06b6d4",
  "Application Submitted": "#6366f1",
  "Application Approved": "#22c55e",
  "Deal Closed - Sold": "#10b981",
  "Deal Closed - Not Buying": "#ef4444",
  "Application Failed": "#f43f5e",
};

const STATUS_COLORS = {
  New: "#C9A84C",
  Contacted: "#3b82f6",
  "Test Drive": "#a855f7",
  Approved: "#22c55e",
  Sold: "#10b981",
  Lost: "#ef4444",
};

function LeadCard({ lead, index }) {
  const waNumber = (lead.phone || "").replace(/\D/g, "");
  const internationalWa = waNumber.startsWith("0") ? "27" + waNumber.slice(1) : waNumber;
  const sc = STATUS_COLORS[lead.status] || "#ffffff60";

  return (
    <Draggable draggableId={lead.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="rounded-xl p-3 border mb-2 cursor-grab active:cursor-grabbing transition-shadow"
          style={{
            background: snapshot.isDragging ? "#1e1a0e" : "#141414",
            borderColor: snapshot.isDragging ? GOLD : "#ffffff12",
            boxShadow: snapshot.isDragging ? `0 8px 24px #C9A84C30` : "none",
          }}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-gray-900 font-semibold text-sm leading-tight">{lead.lead_name}</p>
            <span className="px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0"
              style={{ background: sc + "20", color: sc }}>
              {lead.status}
            </span>
          </div>
          {lead.car_interested && (
            <p className="text-gray-400 text-xs mt-1 truncate">{lead.car_interested}</p>
          )}
          {lead.assigned_consultant && (
            <p className="text-gray-400 text-xs mt-0.5">→ {lead.assigned_consultant}</p>
          )}
          <div className="flex gap-1.5 mt-2">
            {lead.phone && (
              <>
                <a href={`tel:${lead.phone}`} onClick={e => e.stopPropagation()}>
                  <button className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: "#C9A84C18" }}>
                    <Phone className="w-3 h-3" style={{ color: GOLD }} />
                  </button>
                </a>
                <a href={`https://wa.me/${internationalWa}`} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>
                  <button className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: "#16a34a18" }}>
                    <MessageCircle className="w-3 h-3 text-green-400" />
                  </button>
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}

export default function LeadKanban() {
  const [followUps, setFollowUps] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterConsultant, setFilterConsultant] = useState("All");
  const [consultants, setConsultants] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [leadsData, followUpsData, consultantsData] = await Promise.all([
      base44.entities.Lead.list("-created_date", 500),
      base44.entities.LeadFollowUp.list("-update_date", 1000),
      base44.entities.Consultant.filter({ active: true }, "name", 100),
    ]);
    setLeads(leadsData);
    setFollowUps(followUpsData);
    setConsultants(consultantsData);
    setLoading(false);
  };

  // Derive each lead's latest pipeline stage from follow-up history
  const getLeadStage = (leadId) => {
    const history = followUps.filter(f => f.lead_id === leadId);
    if (history.length === 0) return "Initial Contact";
    // Sort by update_date desc and pick most recent
    const sorted = [...history].sort((a, b) => b.update_date?.localeCompare(a.update_date));
    return sorted[0].pipeline_stage || "Initial Contact";
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    const newStage = destination.droppableId;
    const lead = leads.find(l => l.id === draggableId);
    if (!lead) return;

    // Optimistically update UI
    setFollowUps(prev => [
      ...prev,
      {
        id: "temp-" + Date.now(),
        lead_id: draggableId,
        pipeline_stage: newStage,
        update_date: new Date().toISOString().split("T")[0],
        reported_by: "Admin (Kanban)",
      }
    ]);

    // Persist to backend
    await base44.entities.LeadFollowUp.create({
      lead_id: draggableId,
      lead_name: lead.lead_name,
      pipeline_stage: newStage,
      update_date: new Date().toISOString().split("T")[0],
      reported_by: "Admin (Kanban)",
    });
  };

  const filteredLeads = filterConsultant === "All"
    ? leads
    : leads.filter(l => l.assigned_consultant === filterConsultant);

  // Group leads by stage
  const leadsByStage = {};
  PIPELINE_STAGES.forEach(stage => {
    leadsByStage[stage] = filteredLeads.filter(l => getLeadStage(l.id) === stage);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-amber-700 border-t-amber-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-gray-500 text-sm">Consultant:</label>
          <select
            value={filterConsultant}
            onChange={e => setFilterConsultant(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-gray-900 text-sm outline-none"
            style={{ background: "var(--glass)", border: "1px solid #C9A84C33" }}
          >
            <option value="All">All Consultants</option>
            {consultants.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all hover:bg-white/70"
          style={{ color: GOLD, border: "1px solid #C9A84C33" }}
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
        <p className="text-gray-400 text-xs ml-auto">{filteredLeads.length} leads · drag cards to move pipeline stage</p>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: "70vh" }}>
          {PIPELINE_STAGES.map(stage => {
            const color = STAGE_COLORS[stage] || GOLD;
            const stageLeads = leadsByStage[stage] || [];
            return (
              <div key={stage} className="flex-shrink-0 w-60 rounded-xl flex flex-col"
                style={{ background: "transparent", border: "1px solid #ffffff0a" }}>
                {/* Column header */}
                <div className="px-3 py-2.5 rounded-t-xl border-b flex items-center justify-between"
                  style={{ borderColor: color + "30", background: color + "12" }}>
                  <p className="text-xs font-bold truncate" style={{ color }}>{stage}</p>
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: color + "20", color }}>
                    {stageLeads.length}
                  </span>
                </div>

                {/* Droppable area */}
                <Droppable droppableId={stage}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="flex-1 p-2 overflow-y-auto transition-colors"
                      style={{
                        minHeight: 80,
                        background: snapshot.isDraggingOver ? color + "08" : "transparent",
                      }}
                    >
                      {stageLeads.map((lead, index) => (
                        <LeadCard key={lead.id} lead={lead} index={index} />
                      ))}
                      {provided.placeholder}
                      {stageLeads.length === 0 && !snapshot.isDraggingOver && (
                        <p className="text-center text-gray-300 text-xs mt-4">Drop here</p>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}