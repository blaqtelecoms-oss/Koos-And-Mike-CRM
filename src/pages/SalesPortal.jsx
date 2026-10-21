import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit2, Trash2, X, Check, Users, KeyRound, Columns, List, TrendingUp, PhoneMissed, UserCheck } from "lucide-react";
import LeadKanban from "@/components/sales/LeadKanban";

const GOLD = "#ff9d00";

export default function SalesPortal() {
  const navigate = useNavigate();
  const [consultants, setConsultants] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedConsultant, setSelectedConsultant] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [showLeadAssignment, setShowLeadAssignment] = useState(false);
  const [formData, setFormData] = useState({});
  const [error, setError] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const [view, setView] = useState("team"); // "team" | "kanban"

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [consultantsData, leadsData] = await Promise.all([
        base44.entities.Consultant.list("-created_date", 100),
        base44.entities.Lead.list("-created_date", 500)
      ]);
      setConsultants(consultantsData);
      setLeads(leadsData);
      setError("");
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      whatsapp_number: "",
      role: "Sales",
      is_manager: false,
      active: true,
      available: true,
      password_setup_required: true
    });
    setIsAdding(true);
    setIsEditing(false);
    setSelectedConsultant(null);
    setError("");
  };

  const handleSelectConsultant = (consultant) => {
    setSelectedConsultant(consultant);
    setFormData({ ...consultant });
    setIsEditing(false);
    setIsAdding(false);
    setError("");
  };

  const handleDoubleClickConsultant = (consultant) => {
    navigate("/ConsultantWorkspace", { state: { consultant } });
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError("");
  };

  const handleCancel = () => {
    setIsEditing(false);
    setIsAdding(false);
    setFormData({});
    setError("");
  };

  const handleSave = async () => {
    if (!formData.name || !formData.email) {
      setError("Name and email are required");
      return;
    }

    try {
      if (isAdding) {
        await base44.entities.Consultant.create(formData);
        // Invite them as a user in the app so they can log in
        if (formData.email) {
          try {
            await base44.users.inviteUser(formData.email, "user");
          } catch (inviteErr) {
            console.warn("Could not invite user (may already exist):", inviteErr);
          }
        }
        setError("");
        setIsAdding(false);
      } else {
        await base44.entities.Consultant.update(selectedConsultant.id, formData);
        setError("");
        setIsEditing(false);
      }
      await loadData();
      setSelectedConsultant(null);
      setFormData({});
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save consultant");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this consultant?")) return;

    try {
      await base44.entities.Consultant.delete(selectedConsultant.id);
      await loadData();
      setSelectedConsultant(null);
      setFormData({});
      setError("");
    } catch (err) {
      setError("Failed to delete consultant");
    }
  };

  const handleResetPassword = async () => {
    if (!window.confirm(`Reset password for ${selectedConsultant.name} to default (Leads2026)?`)) return;
    try {
      await base44.functions.invoke("consultantAuth", {
        action: "resetPassword",
        consultantId: selectedConsultant.id
      });
      setResetMsg("Password reset to default: Leads2026");
      setTimeout(() => setResetMsg(""), 4000);
    } catch (err) {
      setError("Failed to reset password");
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-4 border-amber-700 border-t-amber-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="km-admin-page space-y-8 min-h-screen" style={{ background: "var(--app-canvas)" }}>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales Portal</h1>
          <p className="text-gray-600 mt-1">Manage consultants and track the pipeline</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: "#C9A84C33" }}>
            <button onClick={() => setView("team")}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold transition-all"
              style={{ background: view === "team" ? GOLD : "transparent", color: view === "team" ? "#000" : "#C9A84C" }}>
              <List className="w-4 h-4" /> Team
            </button>
            <button onClick={() => setView("kanban")}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold transition-all"
              style={{ background: view === "kanban" ? GOLD : "transparent", color: view === "kanban" ? "#000" : "#C9A84C" }}>
              <Columns className="w-4 h-4" /> Kanban
            </button>
          </div>
          {view === "team" && !isAdding && !isEditing && (
            <Button onClick={handleAddNew} style={{ background: GOLD, color: "#000" }} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Consultant
            </Button>
          )}
        </div>
      </div>

      {/* Performance Dashboard */}
      {(() => {
        const salesConsultants = consultants.filter(c => c.role === "Sales" && c.active !== false);
        return (
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Consultant Performance</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {salesConsultants.map(c => {
                const consultantLeads = leads.filter(l => l.assigned_consultant === c.name);
                const newCount = consultantLeads.filter(l => l.status === "New").length;
                const noAnswerCount = consultantLeads.filter(l => l.status === "No Answer").length;
                const totalActive = consultantLeads.filter(l => !["Sold", "Lost"].includes(l.status)).length;
                return (
                  <div key={c.id} className="rounded-xl border border-amber-200/60 bg-white/70 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-black" style={{ background: GOLD }}>
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-gray-900 font-semibold text-sm leading-tight">{c.name}</p>
                        <p className="text-gray-400 text-xs">{totalActive} active leads</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg p-2 text-center" style={{ background: "#3b82f615", border: "1px solid #3b82f630" }}>
                        <p className="text-xl font-bold" style={{ color: "#60a5fa" }}>{newCount}</p>
                        <p className="text-xs text-gray-500 mt-0.5">New</p>
                      </div>
                      <div className="rounded-lg p-2 text-center" style={{ background: noAnswerCount > 0 ? "#f9731615" : "#ffffff08", border: noAnswerCount > 0 ? "1px solid #f9731630" : "1px solid #ffffff10" }}>
                        <p className="text-xl font-bold" style={{ color: noAnswerCount > 0 ? "#fb923c" : "var(--mut)" }}>{noAnswerCount}</p>
                        <p className="text-xs text-gray-500 mt-0.5">No Answer</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              {salesConsultants.length === 0 && (
                <p className="text-gray-400 text-sm col-span-full">No active sales consultants</p>
              )}
            </div>
          </div>
        );
      })()}

      {view === "kanban" && <LeadKanban />}
      {view === "team" && <></>}

      {view === "team" && <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Consultants List */}
        <Card className="lg:col-span-1 border border-amber-200/60 bg-white/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {consultants.length === 0 ? (
                <p className="text-gray-400 text-sm">No consultants yet</p>
              ) : (
                consultants.map(c => (
                  <button
                    key={c.id}
                    onClick={() => handleSelectConsultant(c)}
                    onDoubleClick={() => handleDoubleClickConsultant(c)}
                    className="w-full text-left p-3 rounded-lg border transition-all"
                    style={{
                      background: selectedConsultant?.id === c.id ? GOLD + "20" : "#ffffff05",
                      borderColor: selectedConsultant?.id === c.id ? GOLD : "var(--line)"
                    }}
                  >
                    <p className="font-medium text-gray-900 text-sm">{c.name}</p>
                    <p className="text-xs text-gray-400">{c.role}</p>
                    <div className="flex gap-1 mt-2">
                      <span className="px-2 py-0.5 rounded text-xs" style={{ background: c.active ? "#22c55e20" : "#ef444420", color: c.active ? "#22c55e" : "#ef4444" }}>
                        {c.active ? "Active" : "Inactive"}
                      </span>
                      <span className="px-2 py-0.5 rounded text-xs" style={{ background: c.available ? "#3b82f620" : "#ef444420", color: c.available ? "#3b82f6" : "#ef4444" }}>
                        {c.available ? "Available" : "Unavailable"}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Form Section */}
        <Card className="lg:col-span-2 border border-amber-200/60 bg-white/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              {isAdding ? "Add New Consultant" : isEditing ? "Edit Consultant" : selectedConsultant ? selectedConsultant.name : "Select a consultant"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isAdding || isEditing || selectedConsultant ? (
              <div className="space-y-4">
                {error && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                {(isAdding || isEditing) ? (
                  <>
                    <div>
                      <label className="block text-gray-900 text-sm font-medium mb-2">Name</label>
                      <Input
                        value={formData.name || ""}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        placeholder="Consultant name"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-900 text-sm font-medium mb-2">Email</label>
                      <Input
                        type="email"
                        value={formData.email || ""}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        placeholder="email@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-900 text-sm font-medium mb-2">Phone</label>
                      <Input
                        value={formData.phone || ""}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        placeholder="Phone number"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-900 text-sm font-medium mb-2">WhatsApp Number</label>
                      <Input
                        value={formData.whatsapp_number || ""}
                        onChange={(e) => handleInputChange("whatsapp_number", e.target.value)}
                        placeholder="WhatsApp number"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-900 text-sm font-medium mb-2">Role</label>
                      <select
                        value={formData.role || "Sales"}
                        onChange={(e) => handleInputChange("role", e.target.value)}
                        className="w-full rounded-lg border border-amber-200/60 bg-white/70 text-gray-900 px-3 py-2"
                      >
                        <option value="Sales">Sales</option>
                        <option value="Call Centre">Call Centre</option>
                      </select>
                    </div>

                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-gray-900 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.is_manager || false}
                          onChange={(e) => handleInputChange("is_manager", e.target.checked)}
                          className="rounded"
                        />
                        Is Manager
                      </label>
                      <label className="flex items-center gap-2 text-gray-900 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.active !== false}
                          onChange={(e) => handleInputChange("active", e.target.checked)}
                          className="rounded"
                        />
                        Active
                      </label>
                      <label className="flex items-center gap-2 text-gray-900 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.available !== false}
                          onChange={(e) => handleInputChange("available", e.target.checked)}
                          className="rounded"
                        />
                        Available
                      </label>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button onClick={handleSave} style={{ background: GOLD, color: "#000" }}>
                        <Check className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                      <Button onClick={handleCancel} variant="outline">
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : selectedConsultant ? (
                  <>
                    {!showLeadAssignment ? (
                      <>
                        <div className="space-y-3">
                          <div>
                            <p className="text-gray-600 text-sm">Email</p>
                            <p className="text-gray-900 font-medium">{selectedConsultant.email || "—"}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 text-sm">Phone</p>
                            <p className="text-gray-900 font-medium">{selectedConsultant.phone || "—"}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 text-sm">WhatsApp</p>
                            <p className="text-gray-900 font-medium">{selectedConsultant.whatsapp_number || "—"}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 text-sm">Role</p>
                            <p className="text-gray-900 font-medium">{selectedConsultant.role}</p>
                          </div>
                          <div className="flex gap-3 pt-2">
                            <span className="px-3 py-1 rounded text-xs font-medium" style={{ background: selectedConsultant.is_manager ? "#a855f720" : "var(--line)", color: selectedConsultant.is_manager ? "#a855f7" : "#ffffff66" }}>
                              {selectedConsultant.is_manager ? "Manager" : "Team Member"}
                            </span>
                            <span className="px-3 py-1 rounded text-xs font-medium" style={{ background: selectedConsultant.active ? "#22c55e20" : "#ef444420", color: selectedConsultant.active ? "#22c55e" : "#ef4444" }}>
                              {selectedConsultant.active ? "Active" : "Inactive"}
                            </span>
                          </div>
                          <div>
                            <p className="text-gray-600 text-sm">Assigned Leads</p>
                            <p className="text-gray-900 font-medium">{leads.filter(l => l.assigned_consultant === selectedConsultant.name).length}</p>
                          </div>
                        </div>

                        {resetMsg && (
                          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
                            {resetMsg}
                          </div>
                        )}

                        <div className="flex gap-2 pt-4 flex-wrap">
                          <Button onClick={handleEdit} style={{ background: GOLD, color: "#000" }} className="flex-1 gap-2">
                            <Edit2 className="w-4 h-4" />
                            Edit
                          </Button>
                          <Button onClick={() => setShowLeadAssignment(true)} variant="outline" className="flex-1 gap-2">
                            <Users className="w-4 h-4" />
                            Allocate Leads
                          </Button>
                          <Button onClick={handleResetPassword} variant="outline" className="flex-1 gap-2 text-amber-400 border-amber-400/30 hover:bg-amber-500/10">
                            <KeyRound className="w-4 h-4" />
                            Reset Password
                          </Button>
                          <Button onClick={handleDelete} variant="outline" className="flex-1 gap-2 text-red-400 border-red-400/30 hover:bg-red-500/10">
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          <p className="text-gray-600 text-sm font-medium">Unassigned Leads ({leads.filter(l => !l.assigned_consultant).length})</p>
                          {leads.filter(l => !l.assigned_consultant).length === 0 ? (
                            <p className="text-gray-400 text-sm">No unassigned leads</p>
                          ) : (
                            leads.filter(l => !l.assigned_consultant).map(lead => (
                              <div key={lead.id} className="p-3 rounded-lg border border-amber-200/60 bg-white/70 flex items-center justify-between">
                                <div className="flex-1">
                                  <p className="text-gray-900 font-medium text-sm">{lead.lead_name}</p>
                                  <p className="text-xs text-gray-400">{lead.phone}</p>
                                </div>
                                <Button
                                   onClick={async () => {
                                     await base44.entities.Lead.update(lead.id, { assigned_consultant: selectedConsultant.name });
                                     const updatedLeads = await base44.entities.Lead.list("-created_date", 500);
                                     setLeads(updatedLeads);
                                     // Force re-render by updating selectedConsultant with fresh reference
                                     setSelectedConsultant(curr => ({ ...curr }));
                                   }}
                                   size="sm"
                                   style={{ background: GOLD, color: "#000" }}
                                 >
                                   Assign
                                 </Button>
                              </div>
                            ))
                          )}
                        </div>

                        <div className="flex gap-2 pt-4">
                          <Button onClick={() => setShowLeadAssignment(false)} variant="outline" className="w-full">
                            <X className="w-4 h-4 mr-2" />
                            Done
                          </Button>
                        </div>
                      </>
                    )}
                  </>
                ) : null}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">Select a consultant from the list or add a new one</p>
            )}
          </CardContent>
        </Card>
      </div>}
    </div>
  );
}