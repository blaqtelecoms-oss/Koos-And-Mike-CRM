import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/supabaseClient";
import GlassCard from "@/components/premium/GlassCard";
import EmptyState from "@/components/premium/EmptyState";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Inbox, MessageCircle, Send, Users } from "lucide-react";
import moment from "moment";

const BATCH = 25;
const digits = (value) => (value || "").replace(/\D/g, "");

export default function WhatsApp() {
  const qc = useQueryClient();
  const [tab, setTab] = useState("broadcast");
  const [audience, setAudience] = useState("new");
  const [message, setMessage] = useState(
    "Hi there, this is Koos & Mike Cars. We received your enquiry — are you still looking for a vehicle? Reply here and a consultant will assist you.",
  );
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(null);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [activePhone, setActivePhone] = useState("");
  const [reply, setReply] = useState("");
  const [replying, setReplying] = useState(false);
  const threadRef = useRef(null);

  const { data: leads = [] } = useQuery({
    queryKey: ["leads", "whatsapp"],
    queryFn: () => api.entities.Lead.listAll("-created_date"),
    refetchInterval: 60000,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["whatsapp-messages"],
    queryFn: () => api.entities.WhatsAppMessage.list("-created_at", 500),
    // New replies arrive through the WhatsApp webhook; poll so they appear
    // without the user reloading or clicking refresh.
    refetchInterval: 15000,
  });

  useEffect(() => {
    const unsubscribe = api.entities.WhatsAppMessage.subscribe(() => qc.invalidateQueries(["whatsapp-messages"]));
    return unsubscribe;
  }, [qc]);

  const recipients = useMemo(
    () => leads.filter((lead) => digits(lead.phone) && (audience === "all" || lead.status === "New")),
    [leads, audience],
  );

  const conversations = useMemo(() => {
    const groups = new Map();
    for (const item of messages) {
      if (!groups.has(item.phone)) groups.set(item.phone, []);
      groups.get(item.phone).push(item);
    }
    return [...groups.entries()]
      .map(([phone, items]) => {
        const thread = [...items].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        const lead = leads.find((l) => digits(l.phone).slice(-9) === phone.slice(-9));
        return { phone, thread, lead, last: thread[thread.length - 1] };
      })
      .sort((a, b) => new Date(b.last.created_at) - new Date(a.last.created_at));
  }, [messages, leads]);

  const active = conversations.find((c) => c.phone === activePhone) || conversations[0] || null;
  const lastMessageId = active?.thread[active.thread.length - 1]?.id;

  // Open a conversation at its newest message.
  useEffect(() => {
    const node = threadRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [active?.phone]);

  // Follow incoming messages, but never yank the view while reading older ones.
  useEffect(() => {
    const node = threadRef.current;
    if (!node) return;
    if (node.scrollHeight - node.scrollTop - node.clientHeight < 120) node.scrollTop = node.scrollHeight;
  }, [lastMessageId]);

  const sendBroadcast = async () => {
    const text = message.trim();
    if (!text || !recipients.length) return;
    setError("");
    setSummary(null);
    setSending(true);
    setProgress({ done: 0, total: recipients.length });
    const totals = { sent: 0, failed: 0, errors: [] };
    try {
      for (let i = 0; i < recipients.length; i += BATCH) {
        const ids = recipients.slice(i, i + BATCH).map((lead) => lead.id);
        const { data } = await api.functions.invoke("whatsappSend", { lead_ids: ids, text });
        totals.sent += data.sent || 0;
        totals.failed += data.failed || 0;
        for (const result of data.results || []) {
          if (!result.ok && totals.errors.length < 5) totals.errors.push(`${result.phone}: ${result.error}`);
        }
        setProgress({ done: Math.min(i + BATCH, recipients.length), total: recipients.length });
      }
      setSummary(totals);
      qc.invalidateQueries(["whatsapp-messages"]);
    } catch (err) {
      setError(err.message || "Could not send WhatsApp messages");
    } finally {
      setSending(false);
    }
  };

  const sendReply = async () => {
    const text = reply.trim();
    if (!text || !active) return;
    setError("");
    setReplying(true);
    try {
      await api.functions.invoke("whatsappSend", { to: active.phone, lead_id: active.lead?.id ?? null, text });
      setReply("");
      qc.invalidateQueries(["whatsapp-messages"]);
    } catch (err) {
      setError(err.message || "Could not send the reply");
    } finally {
      setReplying(false);
    }
  };

  return (
    <div>
      <div className="km-hero">
        <div>
          <h1 className="km-h1">WhatsApp</h1>
          <div className="km-sub">Message leads on the number they gave us and answer their replies</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <span className={`km-chip ${tab === "broadcast" ? "active" : ""}`} onClick={() => setTab("broadcast")}>
          <Users style={{ width: 14, height: 14 }} /> Send to leads
        </span>
        <span className={`km-chip ${tab === "inbox" ? "active" : ""}`} onClick={() => setTab("inbox")}>
          <Inbox style={{ width: 14, height: 14 }} /> Conversations
        </span>
      </div>

      {error && (
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "10px 14px", marginBottom: 14, borderRadius: 12, background: "#dc26261a", border: "1px solid #dc262655", color: "var(--ink)", fontSize: 12.5 }}>
          <AlertTriangle style={{ width: 15, height: 15, marginTop: 1, color: "#dc2626", flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {tab === "broadcast" ? (
        <GlassCard>
          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: "var(--mut)", marginBottom: 6 }}>Send to</div>
              <Select value={audience} onValueChange={setAudience}>
                <SelectTrigger style={{ width: 260, background: "var(--glass)", border: "1px solid var(--glass-border)", borderRadius: 30, height: 40 }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New leads only</SelectItem>
                  <SelectItem value="all">All leads with a phone number</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <div style={{ fontSize: 12, color: "var(--mut)", marginBottom: 6 }}>Message</div>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                style={{ background: "var(--glass)", border: "1px solid var(--glass-border)", borderRadius: 12, color: "var(--ink)" }}
              />
            </div>

            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <button className="km-btn-primary" onClick={sendBroadcast} disabled={sending || !recipients.length || !message.trim()}>
                <Send style={{ width: 16, height: 16 }} /> {sending ? "Sending…" : `Send to ${recipients.length} lead${recipients.length === 1 ? "" : "s"}`}
              </button>
              <span style={{ fontSize: 11.5, color: "var(--mut)" }}>
                Leads who have not messaged us in the last 24 hours receive your approved message template.
              </span>
            </div>

            {progress && sending && (
              <div style={{ fontSize: 12, color: "var(--mut)" }}>Sending {progress.done} of {progress.total}…</div>
            )}

            {summary && (
              <div style={{ display: "grid", gap: 4, fontSize: 12.5 }}>
                <div style={{ color: "var(--ink)" }}>Sent {summary.sent} · Failed {summary.failed}</div>
                {summary.errors.map((line) => (
                  <div key={line} style={{ color: "#dc2626" }}>{line}</div>
                ))}
              </div>
            )}
          </div>
        </GlassCard>
      ) : conversations.length === 0 ? (
        <EmptyState icon={<MessageCircle style={{ width: 20, height: 20 }} />} message="No WhatsApp conversations yet. Messages you send and replies from leads appear here." />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(220px, 1fr) minmax(0, 1.6fr)", gap: 14 }}>
          <GlassCard tight>
            <div style={{ display: "grid", gap: 2, maxHeight: 460, overflowY: "auto" }}>
              {conversations.map((conversation) => (
                <button
                  key={conversation.phone}
                  onClick={() => setActivePhone(conversation.phone)}
                  style={{
                    textAlign: "left", padding: "9px 10px", borderRadius: 10, border: 0, cursor: "pointer",
                    background: active?.phone === conversation.phone ? "var(--glass-border)" : "transparent",
                  }}
                >
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)" }}>
                    {conversation.lead?.lead_name || `+${conversation.phone}`}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--mut)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {conversation.last.direction === "out" ? "You: " : ""}{conversation.last.body}
                  </div>
                </button>
              ))}
            </div>
          </GlassCard>

          <GlassCard tight>
            {active && (
              <div style={{ display: "grid", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{active.lead?.lead_name || `+${active.phone}`}</div>
                  <div style={{ fontSize: 11.5, color: "var(--mut)" }}>+{active.phone}</div>
                </div>
                <div ref={threadRef} style={{ display: "grid", gap: 8, maxHeight: 330, overflowY: "auto", paddingRight: 4 }}>
                  {active.thread.map((item) => (
                    <div key={item.id} style={{ justifySelf: item.direction === "out" ? "end" : "start", maxWidth: "85%" }}>
                      <div style={{
                        padding: "8px 11px", borderRadius: 12, fontSize: 12.5, lineHeight: 1.45, whiteSpace: "pre-wrap",
                        background: item.direction === "out" ? "var(--gold)" : "var(--glass)",
                        color: item.direction === "out" ? "#1a1300" : "var(--ink)",
                        border: item.direction === "out" ? "none" : "1px solid var(--glass-border)",
                      }}>
                        {item.body}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--mut)", marginTop: 2, textAlign: item.direction === "out" ? "right" : "left" }}>
                        {moment(item.created_at).format("DD MMM, HH:mm")}
                        {item.direction === "out" && item.status ? ` · ${item.status}` : ""}
                      </div>
                    </div>
                  ))}
                </div>
                <Textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  rows={3}
                  placeholder="Reply on WhatsApp…"
                  style={{ background: "var(--glass)", border: "1px solid var(--glass-border)", borderRadius: 12, color: "var(--ink)" }}
                />
                <div>
                  <Button onClick={sendReply} disabled={replying || !reply.trim()} style={{ background: "var(--gold)", color: "#1a1300", fontWeight: 600 }}>
                    {replying ? "Sending…" : "Send reply"}
                  </Button>
                </div>
              </div>
            )}
          </GlassCard>
        </div>
      )}
    </div>
  );
}
