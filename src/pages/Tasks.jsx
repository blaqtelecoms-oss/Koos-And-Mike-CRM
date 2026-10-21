import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Calendar, CheckCircle2, Clock, ChevronLeft, ChevronRight, CheckSquare as SquareCheck } from "lucide-react";
import moment from "moment";
import GlassCard from "@/components/premium/GlassCard";
import StatCard from "@/components/premium/StatCard";
import StatusPill from "@/components/premium/StatusPill";
import EmptyState from "@/components/premium/EmptyState";

const TASK_TYPES = ["Inventory Check", "Lead Check", "Social Media Post", "Quality Control", "Other"];
const PLATFORMS = ["Facebook Page", "Facebook Groups", "Instagram", "TikTok", "WhatsApp Status", "N/A"];

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(moment().format("YYYY-MM-DD"));
  const [form, setForm] = useState({ task_date: moment().format("YYYY-MM-DD"), task_type: "Lead Check", description: "", platform: "N/A", notes: "" });

  useEffect(() => { loadTasks(); }, [selectedDate]);

  const loadTasks = async () => {
    setLoading(true);
    const data = await base44.entities.DailyTask.filter({ task_date: selectedDate }, "created_date", 100);
    setTasks(data); setLoading(false);
  };

  const handleSubmit = async (e) => { e.preventDefault(); await base44.entities.DailyTask.create({ ...form, task_date: selectedDate }); setShowForm(false); resetForm(); loadTasks(); };
  const resetForm = () => setForm({ task_date: selectedDate, task_type: "Lead Check", description: "", platform: "N/A", notes: "" });
  const toggleComplete = async (task) => { await base44.entities.DailyTask.update(task.id, { completed: !task.completed }); loadTasks(); };
  const deleteTask = async (id) => { await base44.entities.DailyTask.delete(id); loadTasks(); };
  const navigateDate = (d) => setSelectedDate(moment(selectedDate).add(d, 'days').format("YYYY-MM-DD"));

  const completedCount = tasks.filter(t => t.completed).length;
  const isToday = selectedDate === moment().format("YYYY-MM-DD");
  const taskProgress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const suggestedTasks = [
    { type: "Inventory Check", description: "Check stand vehicles for new arrivals and price changes", platform: "N/A" },
    { type: "Lead Check", description: "Check email inbox for new leads", platform: "N/A" },
    { type: "Lead Check", description: "Check website backend for enquiries", platform: "N/A" },
    { type: "Lead Check", description: "Check WhatsApp business for messages", platform: "WhatsApp Status" },
    { type: "Social Media Post", description: "Post 1 Car Post", platform: "Facebook Page" },
    { type: "Social Media Post", description: "Post 1 Reel/Short Video", platform: "Instagram" },
    { type: "Social Media Post", description: "Update Story", platform: "Instagram" }
  ];
  const addSuggestedTask = async (task) => { await base44.entities.DailyTask.create({ task_date: selectedDate, task_type: task.type, description: task.description, platform: task.platform, completed: false }); loadTasks(); };

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 400 }}><div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-400 rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="km-hero">
        <div>
          <h1 className="km-h1">Daily Tasks</h1>
          <div className="km-sub">{moment(selectedDate).format("dddd, D MMMM YYYY")}{isToday && " · Today"}</div>
        </div>
        <button className="km-btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus style={{ width: 16, height: 16 }} /> Add Task
        </button>
      </div>

      {/* Summary stat cards */}
      <div className="km-3cards">
        <StatCard label="Today" icon={<SquareCheck style={{ width: 18, height: 18, strokeWidth: 1.6 }} />} value={`${completedCount} / ${tasks.length} done`} footer="Progress" />
        <StatCard label="Completion" icon={<CheckCircle2 style={{ width: 18, height: 18, strokeWidth: 1.6 }} />} value={`${taskProgress}%`} footer="Done" />
        <StatCard label="Target Leads" icon={<Clock style={{ width: 18, height: 18, strokeWidth: 1.6 }} />} value="3 – 5" footer="Daily goal" />
      </div>

      {/* Date navigator + progress */}
      <GlassCard style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
          <button className="km-icon-btn" style={{ cursor: "pointer" }} onClick={() => navigateDate(-1)}><ChevronLeft style={{ width: 18, height: 18 }} /></button>
          <div style={{ textAlign: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", fontWeight: 500, color: "var(--ink)", fontSize: 16 }}>
              <Calendar style={{ width: 18, height: 18, color: "var(--gold-deep)" }} />
              {moment(selectedDate).format("dddd, MMMM D, YYYY")}
            </div>
            {isToday && <span style={{ display: "inline-block", marginTop: 4, padding: "2px 8px", background: "rgba(246,198,53,.2)", color: "var(--gold-deep)", borderRadius: 10, fontSize: 11, fontWeight: 500 }}>Today</span>}
          </div>
          <button className="km-icon-btn" style={{ cursor: "pointer" }} onClick={() => navigateDate(1)} disabled={selectedDate >= moment().format("YYYY-MM-DD")}><ChevronRight style={{ width: 18, height: 18 }} /></button>
        </div>
        <div style={{ marginTop: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
            <span style={{ color: "var(--mut)" }}>Progress</span>
            <span style={{ fontWeight: 500, color: "var(--ink)" }}>{completedCount} / {tasks.length} completed</span>
          </div>
          <div style={{ height: 6, background: "rgba(120,105,50,.14)", borderRadius: 6, overflow: "hidden" }}>
            <div style={{ height: "100%", background: "linear-gradient(90deg, var(--gold-light), var(--gold-deep))", borderRadius: 6, transition: "width .5s", width: `${taskProgress}%` }} />
          </div>
        </div>
      </GlassCard>

      <div className="km-main-grid" style={{ gridTemplateColumns: "2fr 1fr" }}>
        {/* Tasks list */}
        <div>
          {tasks.length === 0 ? (
            <EmptyState icon={<CheckCircle2 style={{ width: 20, height: 20, strokeWidth: 1.6 }} />} message="No tasks for this day. Add tasks manually or use quick add." actionLabel="Add Task" onAction={() => { resetForm(); setShowForm(true); }} />
          ) : (
            <GlassCard>
              <div className="km-card-header">Today's Tasks</div>
              <div className="km-table-wrap">
                <table className="km-table">
                  <thead><tr><th>Task</th><th>Category</th><th>Platform</th><th>Status</th><th></th></tr></thead>
                  <tbody>
                    {tasks.map(task => (
                      <tr key={task.id} style={task.completed ? { opacity: 0.5 } : {}}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <Checkbox checked={task.completed} onCheckedChange={() => toggleComplete(task)} />
                            <span style={{ fontWeight: 500, color: "var(--ink)", textDecoration: task.completed ? "line-through" : "none" }}>{task.description}</span>
                          </div>
                        </td>
                        <td style={{ color: "var(--mut)" }}>{task.task_type}</td>
                        <td style={{ color: "var(--mut)" }}>{task.platform !== "N/A" ? task.platform : "—"}</td>
                        <td>{task.completed ? <StatusPill status="Found" /> : <StatusPill status="Pending Review" />}</td>
                        <td>
                          <button onClick={() => deleteTask(task.id)} style={{ background: "none", border: 0, cursor: "pointer", color: "var(--mut)", fontSize: 16, padding: 4 }}>×</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          )}
        </div>

        {/* Quick add */}
        <GlassCard>
          <div className="km-card-header" style={{ fontSize: 13 }}>
            <Clock style={{ width: 18, height: 18, color: "var(--gold-deep)" }} /> Quick Add
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {suggestedTasks.map((task, idx) => (
              <button key={idx} onClick={() => addSuggestedTask(task)} className="km-chip" style={{ textAlign: "left", justifyContent: "flex-start", padding: "10px 12px" }}>
                {task.description}
              </button>
            ))}
          </div>
        </GlassCard>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add New Task</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>Task Type</Label><Select value={form.task_type} onValueChange={(v) => setForm({...form, task_type: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TASK_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Description *</Label><Input required value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} placeholder="What needs to be done?" /></div>
            <div><Label>Platform (for social media)</Label><Select value={form.platform} onValueChange={(v) => setForm({...form, platform: v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PLATFORMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} placeholder="Additional notes..." rows={3} /></div>
            <div className="flex gap-3 pt-4"><Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button><Button type="submit" className="flex-1 bg-amber-600 hover:bg-amber-700 text-black font-semibold">Add Task</Button></div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
