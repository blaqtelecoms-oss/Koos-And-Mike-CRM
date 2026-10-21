import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Car, Phone, MessageCircle, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import GlassCard from "@/components/premium/GlassCard";
import StatusPill from "@/components/premium/StatusPill";
import Avatar from "@/components/premium/Avatar";
import StatCard from "@/components/premium/StatCard";
import EmptyState from "@/components/premium/EmptyState";

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
    <div>
      <div className="km-hero">
        <div>
          <h1 className="km-h1">Car Requests</h1>
          <div className="km-sub">Clients looking for specific vehicles — find & match them</div>
        </div>
      </div>

      <div className="km-stats-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <StatCard label="Total" icon={<Car style={{ width: 18, height: 18, strokeWidth: 1.6 }} />} value={counts.total} footer="All requests" />
        <StatCard label="New" icon={<Car style={{ width: 18, height: 18, strokeWidth: 1.6 }} />} value={counts.new} footer="Fresh requests" />
        <StatCard label="Searching" icon={<Car style={{ width: 18, height: 18, strokeWidth: 1.6 }} />} value={counts.searching} footer="In progress" />
        <StatCard label="Found" icon={<Car style={{ width: 18, height: 18, strokeWidth: 1.6 }} />} value={counts.found} footer="Matched" />
      </div>

      {isLoading ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--mut)" }}>Loading…</div>
      ) : requests.length === 0 ? (
        <EmptyState icon={<Car style={{ width: 20, height: 20, strokeWidth: 1.6 }} />} message="No car requests yet." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {requests.map(r => (
            <GlassCard key={r.id} tight>
              <div
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", gap: 12, flexWrap: "wrap" }}
                onClick={() => setExpanded(expanded === r.id ? null : r.id)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <Avatar name={r.requester_name || "?"} />
                  <div>
                    <div style={{ fontWeight: 500, color: "var(--ink)" }}>{r.requester_name}</div>
                    <div style={{ fontSize: 12, color: "var(--mut)" }}>{r.phone}</div>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--ink)" }}>
                    {[r.make, r.model].filter(Boolean).join(" ") || "Any vehicle"}
                    {r.max_price && <span style={{ color: "var(--gold-deep)", fontWeight: 600 }}> · R {r.max_price.toLocaleString()}</span>}
                  </div>
                  {r.finance_required && <span className="km-chip" style={{ fontSize: 10, padding: "3px 8px" }}>Finance Needed</span>}
                  <StatusPill status={r.status} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, color: "var(--mut)" }}>{r.created_date ? format(new Date(r.created_date), "dd MMM yyyy") : ""}</span>
                  {expanded === r.id ? <ChevronUp style={{ width: 16, height: 16, color: "var(--mut)" }} /> : <ChevronDown style={{ width: 16, height: 16, color: "var(--mut)" }} />}
                </div>
              </div>

              {expanded === r.id && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--line)" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12, fontSize: 13, marginBottom: 12 }}>
                    {[
                      { label: "Email", value: r.email },
                      { label: "Preferred Contact", value: r.contact_preference },
                      { label: "Colour Preference", value: r.colour_preference },
                      { label: "Finance Required", value: r.finance_required ? "Yes" : "No" },
                      { label: "Year Range", value: r.year_from && r.year_to ? `${r.year_from}–${r.year_to}` : r.year_from || r.year_to || null },
                    ].filter(f => f.value).map(f => (
                      <div key={f.label}>
                        <div style={{ fontSize: 11, color: "var(--mut)" }}>{f.label}</div>
                        <div style={{ color: "var(--ink)" }}>{f.value}</div>
                      </div>
                    ))}
                  </div>
                  {r.additional_requirements && <div style={{ marginBottom: 12 }}><div style={{ fontSize: 11, color: "var(--mut)", marginBottom: 4 }}>Client Requirements</div><div style={{ fontSize: 13, color: "var(--ink)", padding: 10, borderRadius: 10, background: "var(--glass)" }}>{r.additional_requirements}</div></div>}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "flex-end" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <div style={{ fontSize: 11, color: "var(--mut)" }}>Update Status</div>
                      <Select value={r.status} onValueChange={v => updateMutation.mutate({ id: r.id, data: { status: v } })}>
                        <SelectTrigger style={{ width: 160, background: "var(--glass)", border: "1px solid var(--glass-border)", borderRadius: 30, height: 38 }}><SelectValue /></SelectTrigger>
                        <SelectContent>{["New", "Searching", "Found", "Closed"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                      <div style={{ fontSize: 11, color: "var(--mut)" }}>Admin Notes</div>
                      <Textarea defaultValue={r.admin_notes || ""} onBlur={e => updateMutation.mutate({ id: r.id, data: { admin_notes: e.target.value } })} rows={2} style={{ background: "var(--glass)", border: "1px solid var(--glass-border)", borderRadius: 10, fontSize: 13 }} placeholder="Add notes about search progress…" />
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <a href={`tel:${r.phone}`}><Button size="sm" variant="outline" className="gap-1"><Phone style={{ width: 14, height: 14 }} /> Call</Button></a>
                      <a href={`https://wa.me/${r.phone?.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"><Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-1"><MessageCircle style={{ width: 14, height: 14 }} /> WhatsApp</Button></a>
                    </div>
                  </div>
                </div>
              )}
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
