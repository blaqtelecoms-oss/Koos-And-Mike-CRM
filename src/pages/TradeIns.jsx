import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RefreshCcw, Phone, MessageCircle, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import GlassCard from "@/components/premium/GlassCard";
import StatusPill from "@/components/premium/StatusPill";
import Avatar from "@/components/premium/Avatar";
import StatCard from "@/components/premium/StatCard";
import EmptyState from "@/components/premium/EmptyState";

const statusColors = {
  "Pending Review": "#e0a800",
  "Reviewed": "#3b82f6",
  "Accepted": "#16833a",
  "Declined": "#e5484d",
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
    <div>
      <div className="km-hero">
        <div>
          <h1 className="km-h1">Trade-In Reviews</h1>
          <div className="km-sub">Vehicles submitted by clients for trade-in review</div>
        </div>
      </div>

      <div className="km-3cards">
        <StatCard label="Total" icon={<RefreshCcw style={{ width: 18, height: 18, strokeWidth: 1.6 }} />} value={counts.total} footer="All submissions" />
        <StatCard label="Pending Review" icon={<RefreshCcw style={{ width: 18, height: 18, strokeWidth: 1.6 }} />} value={counts.pending} footer="Awaiting review" />
        <StatCard label="Accepted" icon={<RefreshCcw style={{ width: 18, height: 18, strokeWidth: 1.6 }} />} value={counts.accepted} footer="Approved" />
      </div>

      {isLoading ? (
        <div style={{ textAlign: "center", padding: 40, color: "var(--mut)" }}>Loading…</div>
      ) : tradeIns.length === 0 ? (
        <EmptyState icon={<RefreshCcw style={{ width: 20, height: 20, strokeWidth: 1.6 }} />} message="No trade-in submissions yet." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {tradeIns.map(t => (
            <GlassCard key={t.id} tight>
              <div
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", gap: 12, flexWrap: "wrap" }}
                onClick={() => setExpanded(expanded === t.id ? null : t.id)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <Avatar name={t.owner_name || "?"} />
                  <div>
                    <div style={{ fontWeight: 500, color: "var(--ink)" }}>{t.owner_name}</div>
                    <div style={{ fontSize: 12, color: "var(--mut)" }}>{t.phone}</div>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--ink)" }}>
                    {t.car_year} {t.car_make} {t.car_model}
                  </div>
                  {t.asking_price && <div style={{ fontWeight: 600, color: "var(--gold-deep)" }}>R {t.asking_price.toLocaleString()}</div>}
                  <StatusPill status={t.status} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, color: "var(--mut)" }}>{t.created_date ? format(new Date(t.created_date), "dd MMM yyyy") : ""}</span>
                  {expanded === t.id ? <ChevronUp style={{ width: 16, height: 16, color: "var(--mut)" }} /> : <ChevronDown style={{ width: 16, height: 16, color: "var(--mut)" }} />}
                </div>
              </div>

              {expanded === t.id && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--line)" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12, fontSize: 13, marginBottom: 12 }}>
                    {[
                      { label: "Email", value: t.email },
                      { label: "Preferred Contact", value: t.contact_preference },
                      { label: "Colour", value: t.color },
                      { label: "Condition", value: t.condition },
                      { label: "Mileage", value: t.mileage ? `${t.mileage.toLocaleString()} km` : null },
                    ].filter(f => f.value).map(f => (
                      <div key={f.label}>
                        <div style={{ fontSize: 11, color: "var(--mut)" }}>{f.label}</div>
                        <div style={{ color: "var(--ink)" }}>{f.value}</div>
                      </div>
                    ))}
                  </div>
                  {t.description && <div style={{ marginBottom: 12 }}><div style={{ fontSize: 11, color: "var(--mut)", marginBottom: 4 }}>Client Notes</div><div style={{ fontSize: 13, color: "var(--ink)", padding: 10, borderRadius: 10, background: "var(--glass)" }}>{t.description}</div></div>}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "flex-end" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <div style={{ fontSize: 11, color: "var(--mut)" }}>Update Status</div>
                      <Select value={t.status} onValueChange={v => updateMutation.mutate({ id: t.id, data: { status: v } })}>
                        <SelectTrigger style={{ width: 176, background: "var(--glass)", border: "1px solid var(--glass-border)", borderRadius: 30, height: 38 }}><SelectValue /></SelectTrigger>
                        <SelectContent>{["Pending Review", "Reviewed", "Accepted", "Declined"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                      <div style={{ fontSize: 11, color: "var(--mut)" }}>Admin Notes</div>
                      <Textarea defaultValue={t.admin_notes || ""} onBlur={e => updateMutation.mutate({ id: t.id, data: { admin_notes: e.target.value } })} rows={2} style={{ background: "var(--glass)", border: "1px solid var(--glass-border)", borderRadius: 10, fontSize: 13 }} placeholder="Add notes…" />
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <a href={`tel:${t.phone}`}><Button size="sm" variant="outline" className="gap-1"><Phone style={{ width: 14, height: 14 }} /> Call</Button></a>
                      <a href={`https://wa.me/${t.phone?.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"><Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-1"><MessageCircle style={{ width: 14, height: 14 }} /> WhatsApp</Button></a>
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
