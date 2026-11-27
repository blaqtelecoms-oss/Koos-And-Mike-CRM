import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/supabaseClient";
import GlassCard from "@/components/premium/GlassCard";
import EmptyState from "@/components/premium/EmptyState";
import Avatar from "@/components/premium/Avatar";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, ChevronLeft, Inbox, MessageCircle, Search, Send, Users } from "lucide-react";
import moment from "moment";

const BATCH = 25;
const digits = (value) => (value || "").replace(/\D/g, "");
const QUICK_REPLIES = ["Thanks for your enquiry!", "Are you still interested?", "When can we call you?"];

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
  const [threadOpen, setThreadOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [reply, setReply] = useState("");
  const [replying, setReplying] = useState(false);
  const messagesRef = useRef(null);

  const { data: leads = [] } = useQuery({
    queryKey: ["leads", "whatsapp"],
    queryFn: () => api.entities.Lead.listAll("-created_date"),
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["whatsapp-messages"],
    queryFn: () => api.entities.WhatsAppMessage.list("-created_at", 500),
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

  const visibleConversations = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) =>
      (c.lead?.lead_name || "").toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      (c.last.body || "").toLowerCase().includes(q)
    );
  }, [conversations, search]);

  const active = conversations.find((c) => c.phone === activePhone) || conversations[0] || null;
  const threadLength = active?.thread?.length || 0;

  useEffect(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [active?.phone, threadLength, threadOpen]);

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
        <span className={`km-chip ${tab === "broadcast" ? "active" : ""}`} onClick={() => { setTab("broadcast"); setThreadOpen(false); }}>
          <Users style={{ width: 14, height: 14 }} /> Send to leads
        </span>
        <span className={`km-chip ${tab === "inbox" ? "active" : ""}`} onClick={() => { setTab("inbox"); setThreadOpen(false); }}>
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
                <SelectTrigger style={{ width: "100%", maxWidth: 260, background: "var(--glass)", border: "1px solid var(--glass-border)", borderRadius: 30, height: 40 }}>
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
        <div className="wa-inbox">
          <div className="wa-list">
            <div className="wa-list-head">
              <div className="wa-list-title">Chats <span>{conversations.length}</span></div>
            </div>
            <div className="wa-search">
              <Search style={{ width: 14, height: 14 }} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search conversations" />
            </div>
            <div className="wa-list-scroll">
              {visibleConversations.length === 0 ? (
                <div className="wa-empty">No conversations match “{search}”.</div>
              ) : visibleConversations.map((conversation) => (
                <button
                  key={conversation.phone}
                  type="button"
                  className={`wa-row ${active?.phone === conversation.phone ? "active" : ""}`}
                  onClick={() => { setActivePhone(conversation.phone); setThreadOpen(true); }}
                >
                  <Avatar name={conversation.lead?.lead_name || conversation.phone} size={44} />
                  <div className="wa-row-body">
                    <div className="wa-row-top">
                      <span className="wa-row-name">{conversation.lead?.lead_name || `+${conversation.phone}`}</span>
                      <span className="wa-row-time">{moment(conversation.last.created_at).format("HH:mm")}</span>
                    </div>
                    <div className="wa-row-msg">
                      {conversation.last.direction === "out" ? "You: " : ""}{conversation.last.body}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {active && (
            <div className={`wa-thread ${threadOpen ? "wa-open" : ""}`}>
              <div className="wa-thread-head">
                <button type="button" className="wa-back" onClick={() => setThreadOpen(false)} aria-label="Back to conversations">
                  <ChevronLeft style={{ width: 22, height: 22 }} />
                </button>
                <Avatar name={active.lead?.lead_name || active.phone} size={36} />
                <div className="wa-thread-id">
                  <b>{active.lead?.lead_name || `+${active.phone}`}</b>
                  <span>+{active.phone}</span>
                </div>
              </div>

              <div className="wa-messages" ref={messagesRef}>
                {active.thread.map((item, index) => {
                  const day = moment(item.created_at).format("DD MMM YYYY");
                  const prevDay = index > 0 ? moment(active.thread[index - 1].created_at).format("DD MMM YYYY") : null;
                  return (
                    <Fragment key={item.id}>
                      {day !== prevDay && (
                        <div className="wa-day">
                          {moment(item.created_at).calendar(null, { sameDay: "[Today]", lastDay: "[Yesterday]", lastWeek: "dddd", sameElse: "DD MMM YYYY" })}
                        </div>
                      )}
                      <div className={`wa-bubble ${item.direction === "out" ? "out" : "in"}`}>
                        {item.body}
                        <span className="wa-time">
                          {moment(item.created_at).format("HH:mm")}
                          {item.direction === "out" && item.status ? ` · ${item.status}` : ""}
                        </span>
                      </div>
                    </Fragment>
                  );
                })}
              </div>

              <div className="wa-quick">
                {QUICK_REPLIES.map((text) => (
                  <button key={text} type="button" className="wa-quick-chip" onClick={() => setReply(text)}>{text}</button>
                ))}
              </div>
              <div className="wa-composer">
                <textarea
                  className="wa-input"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                  rows={1}
                  placeholder="Message"
                />
                <button type="button" className="wa-send" onClick={sendReply} disabled={replying || !reply.trim()} aria-label="Send message">
                  <Send style={{ width: 18, height: 18 }} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
