import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Calendar, CheckCircle2, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import moment from "moment";

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
    setTasks(data);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await base44.entities.DailyTask.create({ ...form, task_date: selectedDate });
    setShowForm(false);
    resetForm();
    loadTasks();
  };

  const resetForm = () => setForm({ task_date: selectedDate, task_type: "Lead Check", description: "", platform: "N/A", notes: "" });

  const toggleComplete = async (task) => {
    await base44.entities.DailyTask.update(task.id, { completed: !task.completed });
    loadTasks();
  };

  const deleteTask = async (id) => {
    await base44.entities.DailyTask.delete(id);
    loadTasks();
  };

  const navigateDate = (direction) => setSelectedDate(moment(selectedDate).add(direction, 'days').format("YYYY-MM-DD"));

  const getTaskTypeIcon = (type) => ({ "Lead Check": "🔍", "Inventory Check": "📋", "Social Media Post": "📱", "Quality Control": "✅", "Other": "📌" }[type] || "📌");

  const completedCount = tasks.filter(t => t.completed).length;
  const isToday = selectedDate === moment().format("YYYY-MM-DD");

  const suggestedTasks = [
    { type: "Inventory Check", description: "Check stand vehicles for new arrivals and price changes", platform: "N/A" },
    { type: "Lead Check", description: "Check email inbox for new leads", platform: "N/A" },
    { type: "Lead Check", description: "Check website backend for enquiries", platform: "N/A" },
    { type: "Lead Check", description: "Check WhatsApp business for messages", platform: "WhatsApp Status" },
    { type: "Social Media Post", description: "Post 1 Car Post", platform: "Facebook Page" },
    { type: "Social Media Post", description: "Post 1 Reel/Short Video", platform: "Instagram" },
    { type: "Social Media Post", description: "Update Story", platform: "Instagram" }
  ];

  const addSuggestedTask = async (task) => {
    await base44.entities.DailyTask.create({ task_date: selectedDate, task_type: task.type, description: task.description, platform: task.platform, completed: false });
    loadTasks();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Daily Tasks</h1>
          <p className="text-white/60 mt-1">Track your daily responsibilities</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="bg-amber-600 hover:bg-amber-700 text-black font-semibold">
          <Plus className="w-4 h-4 mr-2" /> Add Task
        </Button>
      </div>

      <Card className="border border-white/10 bg-white/5 shadow-none">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" className="text-white/60 hover:text-white" onClick={() => navigateDate(-1)}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="text-center">
              <div className="flex items-center gap-2 justify-center">
                <Calendar className="w-5 h-5 text-amber-400" />
                <h2 className="text-xl font-semibold text-white">{moment(selectedDate).format("dddd, MMMM D, YYYY")}</h2>
              </div>
              {isToday && <span className="inline-block mt-1 px-2 py-0.5 bg-amber-600/20 text-amber-400 rounded-full text-xs font-medium">Today</span>}
            </div>
            <Button variant="ghost" className="text-white/60 hover:text-white" onClick={() => navigateDate(1)}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-white/50">Progress</span>
              <span className="font-medium text-white">{completedCount} / {tasks.length} completed</span>
            </div>
            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-500"
                style={{ width: tasks.length > 0 ? `${(completedCount / tasks.length) * 100}%` : '0%' }} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {tasks.length === 0 ? (
            <Card className="border border-white/10 bg-white/5">
              <CardContent className="py-12 text-center">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-white/30" />
                </div>
                <h3 className="text-lg font-medium text-white">No tasks for this day</h3>
                <p className="text-white/50 mt-1">Add tasks manually or use suggested tasks</p>
              </CardContent>
            </Card>
          ) : (
            tasks.map((task) => (
              <Card key={task.id} className={`border border-white/10 bg-white/5 border-l-4 ${
                task.task_type === "Lead Check" ? "border-l-amber-400" :
                task.task_type === "Inventory Check" ? "border-l-amber-600" :
                task.task_type === "Social Media Post" ? "border-l-amber-300" :
                "border-l-white/20"
              } ${task.completed ? 'opacity-60' : ''}`}>
                <CardContent className="py-4">
                  <div className="flex items-start gap-4">
                    <Checkbox checked={task.completed} onCheckedChange={() => toggleComplete(task)} className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span>{getTaskTypeIcon(task.task_type)}</span>
                        <span className={`font-medium ${task.completed ? 'line-through text-white/40' : 'text-white'}`}>{task.description}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-white/50">
                        <span>{task.task_type}</span>
                        {task.platform !== "N/A" && <><span>•</span><span>{task.platform}</span></>}
                      </div>
                      {task.notes && <p className="mt-2 text-sm text-white/60 bg-white/5 p-2 rounded">{task.notes}</p>}
                    </div>
                    <Button variant="ghost" size="sm" className="text-white/30 hover:text-red-400" onClick={() => deleteTask(task.id)}>×</Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Card className="border border-white/10 bg-white/5 h-fit">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-white">
              <Clock className="w-5 h-5 text-amber-400" /> Quick Add
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {suggestedTasks.map((task, idx) => (
              <button key={idx} onClick={() => addSuggestedTask(task)} className="w-full text-left p-3 bg-white/5 hover:bg-amber-600/10 border border-transparent hover:border-amber-600/30 rounded-lg transition-colors group">
                <div className="flex items-center gap-2">
                  <span>{getTaskTypeIcon(task.type)}</span>
                  <span className="text-sm font-medium text-white/70 group-hover:text-amber-300">{task.description}</span>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add New Task</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Task Type</Label>
              <Select value={form.task_type} onValueChange={(v) => setForm({...form, task_type: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TASK_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Description *</Label>
              <Input required value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} placeholder="What needs to be done?" />
            </div>
            <div>
              <Label>Platform (for social media)</Label>
              <Select value={form.platform} onValueChange={(v) => setForm({...form, platform: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PLATFORMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} placeholder="Additional notes..." rows={3} />
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
              <Button type="submit" className="flex-1 bg-amber-600 hover:bg-amber-700 text-black font-semibold">Add Task</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}