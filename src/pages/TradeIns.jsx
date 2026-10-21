import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RefreshCw, Phone, MessageCircle, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";

const statusColors = {
  "Pending Review": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  "Reviewed": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Accepted": "bg-green-500/20 text-green-400 border-green-500/30",
  "Declined": "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function TradeIns() {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(null);

  const { data: tradeIns = [], isLoading } = useQuery({
    queryKey: ["tradeins"],
    queryFn: () => base44.entities.TradeIn.list("-created_date"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TradeIn.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tradeins"] }),
  });

  const counts = {
    total: tradeIns.length,
    pending: tradeIns.filter(t => t.status === "Pending Review").length,
    accepted: tradeIns.filter(t => t.status === "Accepted").length,
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
          <RefreshCw className="w-5 h-5 text-green-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Trade-In Submissions</h1>
          <p className="text-slate-400 text-sm">Vehicles submitted by clients for trade-in review</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total", value: counts.total, color: "text-slate-300" },
          { label: "Pending Review", value: counts.pending, color: "text-yellow-400" },
          { label: "Accepted", value: counts.accepted, color: "text-green-400" },
        ].map(s => (
          <div key={s.label} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <p className="text-slate-400 text-xs mb-1">{s.label}</p>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-slate-400">Loading...</div>
      ) : tradeIns.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <RefreshCw className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No trade-in submissions yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tradeIns.map(t => (
            <div key={t.id} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
              {/* Header Row */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-750"
                onClick={() => setExpanded(expanded === t.id ? null : t.id)}
              >
                <div className="flex items-center gap-4 flex-wrap">
                  <div>
                    <p className="text-slate-100 font-semibold">{t.owner_name}</p>
                    <p className="text-slate-400 text-sm">{t.phone}</p>
                  </div>
                  <div>
                    <p className="text-slate-300 font-medium">{t.car_year} {t.car_make} {t.car_model}</p>
                    <p className="text-slate-400 text-sm">{t.mileage ? `${t.mileage.toLocaleString()} km` : ""} · {t.condition}</p>
                  </div>
                  {t.asking_price && <p className="text-amber-400 font-bold">R {t.asking_price.toLocaleString()}</p>}
                  <Badge className={`border text-xs ${statusColors[t.status]}`}>{t.status}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-xs">{t.created_date ? format(new Date(t.created_date), "dd MMM yyyy") : ""}</span>
                  {expanded === t.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
              </div>

              {/* Expanded Details */}
              {expanded === t.id && (
                <div className="px-4 pb-4 border-t border-slate-700 pt-4 space-y-4">
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    {[
                      { label: "Email", value: t.email },
                      { label: "Preferred Contact", value: t.contact_preference },
                      { label: "Colour", value: t.color },
                      { label: "Condition", value: t.condition },
                    ].filter(f => f.value).map(f => (
                      <div key={f.label}>
                        <p className="text-slate-500 text-xs">{f.label}</p>
                        <p className="text-slate-200">{f.value}</p>
                      </div>
                    ))}
                  </div>
                  {t.description && (
                    <div>
                      <p className="text-slate-500 text-xs mb-1">Client Notes</p>
                      <p className="text-slate-300 text-sm bg-slate-900 rounded-lg p-3">{t.description}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3 items-end">
                    <div className="flex flex-col gap-1">
                      <p className="text-slate-500 text-xs">Update Status</p>
                      <Select value={t.status} onValueChange={v => updateMutation.mutate({ id: t.id, data: { status: v } })}>
                        <SelectTrigger className="bg-slate-900 border-slate-600 text-slate-200 w-44">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["Pending Review", "Reviewed", "Accepted", "Declined"].map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1 flex flex-col gap-1">
                      <p className="text-slate-500 text-xs">Admin Notes</p>
                      <Textarea
                        defaultValue={t.admin_notes || ""}
                        onBlur={e => updateMutation.mutate({ id: t.id, data: { admin_notes: e.target.value } })}
                        rows={2}
                        className="bg-slate-900 border-slate-600 text-slate-200 text-sm"
                        placeholder="Add notes..."
                      />
                    </div>
                    <div className="flex gap-2">
                      <a href={`tel:${t.phone}`}>
                        <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 gap-1">
                          <Phone className="w-3 h-3" /> Call
                        </Button>
                      </a>
                      <a href={`https://wa.me/${t.phone?.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-1">
                          <MessageCircle className="w-3 h-3" /> WhatsApp
                        </Button>
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}