import { useEffect, useState } from "react";
import { api } from "@/api/supabaseClient";
import { isAdminUser } from "@/lib/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import GlassCard from "@/components/premium/GlassCard";
import StatusPill from "@/components/premium/StatusPill";
import moment from "moment";
import {
  Facebook, Instagram, Music2, KeyRound, ExternalLink, ChevronDown, ChevronUp,
  Eye, EyeOff, Check, Loader2, CircleAlert, Plug,
} from "lucide-react";

const GOLD = "#ff9d00";

const STATUS_LABEL = { active: "Active", inactive: "Inactive", disabled: "Disabled" };
const STATUS_HINT = {
  active: "Posting is switched on for this platform.",
  inactive: "Set up but switched off — posts won't publish here.",
  disabled: "Blocked by an admin until it is activated again.",
};

// Everything the dashboard needs to know about each platform: the credential
// fields an admin fills in and the steps for finding those values.
const PLATFORM_SPECS = [
  {
    key: "facebook",
    name: "Facebook",
    icon: Facebook,
    accent: "#1877F2",
    blurb: "Post to your Facebook Page straight from Social Posts.",
    docs: "https://developers.facebook.com/apps",
    docsLabel: "Meta for Developers",
    fields: [
      { key: "app_id", label: "App ID" },
      { key: "app_secret", label: "App Secret", secret: true },
      { key: "page_id", label: "Page ID" },
      { key: "page_access_token", label: "Page Access Token", secret: true },
    ],
    steps: [
      "Open developers.facebook.com/apps and create an app with the “Business” use case.",
      "In App settings → Basic, copy the App ID and App Secret into the fields above.",
      "Add the “Facebook Login for Business” product and connect the Page you post from.",
      "Create a Page Access Token with the pages_manage_posts and pages_read_engagement permissions (Graph API Explorer or a system user in Meta Business Suite).",
      "Copy the Page ID from your Page's About section.",
    ],
  },
  {
    key: "instagram",
    name: "Instagram",
    icon: Instagram,
    accent: "#E1306C",
    blurb: "Publish posts, reels and stories to Instagram.",
    docs: "https://developers.facebook.com/docs/instagram-platform/content-publishing",
    docsLabel: "Instagram content publishing docs",
    fields: [
      { key: "app_id", label: "Meta App ID" },
      { key: "app_secret", label: "Meta App Secret", secret: true },
      { key: "ig_business_account_id", label: "Instagram Business Account ID" },
      { key: "access_token", label: "Access Token", secret: true },
    ],
    steps: [
      "Convert the Instagram account to a Professional (Business) account and link it to your Facebook Page.",
      "Reuse the same Meta app as Facebook: copy its App ID and App Secret here.",
      "Add the Instagram Graph API and request the instagram_basic and instagram_content_publish permissions.",
      "Call GET /me/accounts?fields=instagram_business_account on the Graph API and copy the Instagram Business Account ID.",
      "Generate a long-lived access token for that Page and paste it above.",
    ],
  },
  {
    key: "tiktok",
    name: "TikTok",
    icon: Music2,
    accent: "#25F4EE",
    blurb: "Push videos and photo posts to your TikTok account.",
    docs: "https://developers.tiktok.com/apps",
    docsLabel: "TikTok for Developers",
    fields: [
      { key: "client_key", label: "Client Key" },
      { key: "client_secret", label: "Client Secret", secret: true },
      { key: "access_token", label: "Access Token", secret: true },
      { key: "open_id", label: "Open ID", optional: true },
    ],
    steps: [
      "Sign in at developers.tiktok.com and create a new app.",
      "Add the “Content Posting API” product and complete the app details.",
      "Copy the Client Key and Client Secret from the app's credentials page.",
      "Run the OAuth authorisation flow with the video.publish scope to get an Access Token and Open ID.",
      "Submit the app for review — posting only goes live once TikTok approves it.",
    ],
  },
];

const emptyCredentials = (spec) =>
  Object.fromEntries(spec.fields.map((f) => [f.key, ""]));

export default function Integrations() {
  const [records, setRecords] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const load = async () => {
    const user = await api.auth.me().catch(() => null);
    if (!isAdminUser(user)) {
      window.location.href = "/";
      return;
    }
    try {
      const rows = await api.entities.SocialIntegration.list("platform", 20);
      setRecords(Object.fromEntries((rows || []).map((r) => [r.platform, r])));
      setLoadError("");
    } catch (error) {
      setLoadError(error?.message || "Could not load integrations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const activeCount = Object.values(records).filter((r) => r.status === "active").length;

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 400 }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: GOLD }} />
      </div>
    );
  }

  return (
    <div>
      <div className="km-hero">
        <div>
          <h1 className="km-h1">Social Integrations</h1>
          <div className="km-sub">
            Connect Facebook, Instagram and TikTok so posts can go out directly from the Social Posts page.
          </div>
        </div>
        <span className="km-chip" style={{ cursor: "default" }}>
          <Plug style={{ width: 14, height: 14 }} />
          {activeCount} of {PLATFORM_SPECS.length} active
        </span>
      </div>

      {loadError && (
        <GlassCard style={{ marginBottom: 14, borderColor: "rgba(229,72,77,.35)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#f87171" }}>
            <CircleAlert style={{ width: 16, height: 16 }} />
            {loadError}
          </div>
        </GlassCard>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(330px, 1fr))", gap: 14, alignItems: "start" }}>
        {PLATFORM_SPECS.map((spec) => (
          <IntegrationCard key={spec.key} spec={spec} record={records[spec.key]} onSaved={load} />
        ))}
      </div>
    </div>
  );
}

function IntegrationCard({ spec, record, onSaved }) {
  const Icon = spec.icon;
  const status = record?.status || "inactive";
  const [form, setForm] = useState({ account_name: record?.account_name || "", credentials: emptyCredentials(spec) });
  const [showSecrets, setShowSecrets] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Pick up the saved row (first load, or after a save refreshed it).
  useEffect(() => {
    setForm({
      account_name: record?.account_name || "",
      credentials: Object.fromEntries(
        spec.fields.map((f) => [f.key, record?.credentials?.[f.key] || ""])
      ),
    });
  }, [record?.id, record?.updated_date]);

  const setField = (key, value) =>
    setForm((f) => ({ ...f, credentials: { ...f.credentials, [key]: value } }));

  const persist = async (patch, successMessage) => {
    setSaving(true);
    setMessage(null);
    const payload = {
      platform: spec.key,
      account_name: form.account_name.trim(),
      credentials: form.credentials,
      status: patch.status ?? status,
      updated_date: new Date().toISOString(),
      ...patch,
    };
    try {
      if (record?.id) await api.entities.SocialIntegration.update(record.id, payload);
      else await api.entities.SocialIntegration.create(payload);
      setMessage({ ok: true, text: successMessage });
      await onSaved();
    } catch (error) {
      setMessage({ ok: false, text: error?.message || "Could not save the integration." });
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (next) => {
    if (next === "active") {
      const missing = spec.fields.filter((f) => !String(form.credentials[f.key] || "").trim());
      if (missing.length) {
        setMessage({ ok: false, text: `Add ${missing.map((m) => m.label).join(", ")} before activating.` });
        return;
      }
    }
    await persist({ status: next }, `${spec.name} is now ${next}.`);
  };

  return (
    <GlassCard>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 4 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", minWidth: 0 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, display: "grid", placeItems: "center", flexShrink: 0,
            background: `color-mix(in srgb, ${spec.accent} 18%, transparent)`, color: spec.accent,
          }}>
            <Icon style={{ width: 20, height: 20 }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, color: "var(--ink)", fontSize: 15 }}>{spec.name}</div>
            <div style={{ fontSize: 11.5, color: "var(--mut)" }}>{spec.blurb}</div>
          </div>
        </div>
        <StatusPill status={STATUS_LABEL[status]} />
      </div>

      <div style={{ fontSize: 11.5, color: "var(--mut)", margin: "10px 0 14px" }}>{STATUS_HINT[status]}</div>

      {/* Account + credentials */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div>
          <label style={{ fontSize: 11.5, color: "var(--mut)", display: "block", marginBottom: 4 }}>Account / Page name</label>
          <Input
            value={form.account_name}
            onChange={(e) => setForm((f) => ({ ...f, account_name: e.target.value }))}
            placeholder="Koos & Mike Cars"
            autoComplete="off"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {spec.fields.map((field) => (
            <div key={field.key}>
              <label style={{ fontSize: 11.5, color: "var(--mut)", display: "block", marginBottom: 4 }}>
                {field.label}{field.optional ? " (optional)" : ""}
              </label>
              <Input
                type={field.secret && !showSecrets ? "password" : "text"}
                value={form.credentials[field.key]}
                onChange={(e) => setField(field.key, e.target.value)}
                placeholder={field.secret ? "••••••••" : ""}
                autoComplete="off"
              />
            </div>
          ))}
        </div>
        {spec.fields.some((f) => f.secret) && (
          <button
            type="button"
            className="km-chip"
            onClick={() => setShowSecrets((s) => !s)}
            style={{ alignSelf: "flex-start", fontSize: 11.5 }}
          >
            {showSecrets ? <EyeOff style={{ width: 13, height: 13 }} /> : <Eye style={{ width: 13, height: 13 }} />}
            {showSecrets ? "Hide secret values" : "Show secret values"}
          </button>
        )}
      </div>

      {/* Credential steps */}
      <button
        type="button"
        className="km-chip"
        onClick={() => setShowSteps((s) => !s)}
        style={{ width: "100%", justifyContent: "space-between", marginTop: 14 }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <KeyRound style={{ width: 14, height: 14 }} />
          How to get these credentials
        </span>
        {showSteps ? <ChevronUp style={{ width: 14, height: 14 }} /> : <ChevronDown style={{ width: 14, height: 14 }} />}
      </button>
      {showSteps && (
        <div style={{ marginTop: 10 }}>
          <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "var(--mut)", lineHeight: 1.65 }}>
            {spec.steps.map((step, i) => (
              <li key={i} style={{ marginBottom: 6 }}>{step}</li>
            ))}
          </ol>
          <a
            href={spec.docs}
            target="_blank"
            rel="noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--gold)", marginTop: 4 }}
          >
            {spec.docsLabel} <ExternalLink style={{ width: 13, height: 13 }} />
          </a>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--line)" }}>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => persist({}, "Credentials saved.")}
          disabled={saving}
          style={{ borderColor: "var(--glass-border)", color: "var(--ink)" }}
        >
          Save credentials
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={() => changeStatus("active")}
          disabled={saving || status === "active"}
          className="text-black font-semibold border-0"
          style={{ background: GOLD, opacity: status === "active" ? 0.5 : 1 }}
        >
          Activate
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => changeStatus("inactive")}
          disabled={saving || status === "inactive"}
          style={{ borderColor: "var(--glass-border)", color: "var(--ink)" }}
        >
          Set inactive
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => changeStatus("disabled")}
          disabled={saving || status === "disabled"}
          className="text-red-500 hover:bg-red-500/10"
          style={{ borderColor: "rgba(229,72,77,.35)" }}
        >
          Disable
        </Button>
      </div>

      {(message || record?.updated_date) && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, fontSize: 11.5 }}>
          {message ? (
            <span style={{ display: "flex", alignItems: "center", gap: 6, color: message.ok ? "#22c55e" : "#f87171" }}>
              {message.ok ? <Check style={{ width: 13, height: 13 }} /> : <CircleAlert style={{ width: 13, height: 13 }} />}
              {message.text}
            </span>
          ) : (
            <span style={{ color: "var(--faint)" }}>Last updated {moment(record.updated_date).fromNow()}</span>
          )}
        </div>
      )}
    </GlassCard>
  );
}
