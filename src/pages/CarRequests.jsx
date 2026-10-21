import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Car, Phone, MessageCircle, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";

const statusColors = {
  "New": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Searching": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  "Found": "bg-green-500/20 text-green-400 border-green-500/30",
  "Closed": "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

export default function CarRequests() {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(null);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["car-requests"],
    queryFn: () => base44.entities.CarRequest.list("-created_date"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CarRequest.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["car-requests"] }),
  });

  const counts = {
    total: requests.length,
    new: requests.filter(r => r.status === "New").length,
    searching: requests.filter(r => r.status === "Searching").length,
    found: requests.filter(r => r.status === "Found").length,
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
          <Car className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Car Requests</h1>
          <p className="text-slate-400 text-sm">Clients looking for specific vehicles — find & match them</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total", value: counts.total, color: "text-slate-300" },
          { label: "New", value: counts.new, color: "text-blue-400" },
          { label: "Searching", value: counts.searching, color: "text-yellow-400" },
          { label: "Found", value: counts.found, color: "text-green-400" },
        ].map(s => (
          <div key={s.label} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <p className="text-slate-400 text-xs mb-1">{s.label}</p>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-slate-400">Loading...</div>
      ) : requests.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Car className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No car requests yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(r => (
            <div key={r.id} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-750"
                onClick={() => setExpanded(expanded === r.id ? null : r.id)}
              >
                <div className="flex items-center gap-4 flex-wrap">
                  <div>
                    <p className="text-slate-100 font-semibold">{r.requester_name}</p>
                    <p className="text-slate-400 text-sm">{r.phone}</p>
                  </div>
                  <div>
                    <p className="text-slate-300 font-medium">
                      {[r.make, r.model].filter(Boolean).join(" ") || "Any vehicle"}
                    </p>
                    <p className="text-slate-400 text-sm">
                      {r.year_from && r.year_to ? `${r.year_from}–${r.year_to}` : r.year_from || r.year_to || ""}
                      {r.max_price ? ` · Budget: R ${r.max_price.toLocaleString()}` : ""}
                    </p>
                  </div>
                  {r.finance_required && <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs border">Finance Needed</Badge>}
                  <Badge className={`border text-xs ${statusColors[r.status]}`}>{r.status}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-xs">{r.created_date ? format(new Date(r.created_date), "dd MMM yyyy") : ""}</span>
                  {expanded === r.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
              </div>

              {expanded === r.id && (
                <div className="px-4 pb-4 border-t border-slate-700 pt-4 space-y-4">
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    {[
                      { label: "Email", value: r.email },
                      { label: "Preferred Contact", value: r.contact_preference },
                      { label: "Colour Preference", value: r.colour_preference },
                      { label: "Finance Required", value: r.finance_required ? "Yes" : "No" },
                    ].filter(f => f.value).map(f => (
                      <div key={f.label}>
                        <p className="text-slate-500 text-xs">{f.label}</p>
                        <p className="text-slate-200">{f.value}</p>
                      </div>
                    ))}
                  </div>
                  {r.additional_requirements && (
                    <div>
                      <p className="text-slate-500 text-xs mb-1">Client Requirements</p>
                      <p className="text-slate-300 text-sm bg-slate-900 rounded-lg p-3">{r.additional_requirements}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3 items-end">
                    <div className="flex flex-col gap-1">
                      <p className="text-slate-500 text-xs">Update Status</p>
                      <Select value={r.status} onValueChange={v => updateMutation.mutate({ id: r.id, data: { status: v } })}>
                        <SelectTrigger className="bg-slate-900 border-slate-600 text-slate-200 w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["New", "Searching", "Found", "Closed"].map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1 flex flex-col gap-1">
                      <p className="text-slate-500 text-xs">Admin Notes</p>
                      <Textarea
                        defaultValue={r.admin_notes || ""}
                        onBlur={e => updateMutation.mutate({ id: r.id, data: { admin_notes: e.target.value } })}
                        rows={2}
                        className="bg-slate-900 border-slate-600 text-slate-200 text-sm"
                        placeholder="Add notes about search progress..."
                      />
                    </div>
                    <div className="flex gap-2">
                      <a href={`tel:${r.phone}`}>
                        <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 gap-1">
                          <Phone className="w-3 h-3" /> Call
                        </Button>
                      </a>
                      <a href={`https://wa.me/${r.phone?.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">
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