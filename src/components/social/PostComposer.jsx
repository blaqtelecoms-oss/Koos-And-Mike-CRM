import { useEffect, useMemo, useState } from "react";
import moment from "moment";
import { api } from "@/api/supabaseClient";
import GlassCard from "@/components/premium/GlassCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { AUDIENCES, PLATFORMS, PLATFORM_META, POST_TYPES, SITE_URL, INTEGRATION_DOT } from "./meta";
import MediaGrid from "./MediaGrid";
import { Car, Check, Image as ImageIcon, ImagePlus, Link2, Loader2, MessageSquare, Send, Sparkles, X } from "lucide-react";

const emptyForm = (date) => ({
  title: "",
  body: "",
  media: [],
  thumbnail_url: "",
  audience: "public",
  audience_note: "",
  platforms: ["Facebook Page"],
  post_type: "Car Post",
  vehicle_featured: "",
  link_url: SITE_URL,
  includes_website_link: true,
  includes_cta: true,
  post_date: date,
});

export default function PostComposer({ user, integrations = {}, onSaved }) {
  const [form, setForm] = useState(() => emptyForm(moment().format("YYYY-MM-DD")));
  const [vehicles, setVehicles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [thumbUploading, setThumbUploading] = useState(false);
  const [saving, setSaving] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    api.entities.Vehicle.list("-created_date", 100).then(setVehicles).catch(() => {});
  }, []);

  const targets = form.platforms.map((platform) => {
    const meta = PLATFORM_META[platform];
    const integration = meta.integration ? integrations[meta.integration] : null;
    return { platform, meta, integration, canPublish: meta.publishable && integration?.status === "active" };
  });
  const publishableTargets = targets.filter((target) => target.canPublish);
  const manualTargets = targets.filter((target) => !target.canPublish);

  const togglePlatform = (platform) => {
    setForm((current) => {
      const selected = current.platforms.includes(platform);
      if (selected && current.platforms.length === 1) return current;
      return {
        ...current,
        platforms: selected
          ? current.platforms.filter((item) => item !== platform)
          : [...current.platforms, platform],
      };
    });
  };

  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.title === form.vehicle_featured),
    [vehicles, form.vehicle_featured]
  );

  const set = (patch) => setForm((current) => ({ ...current, ...patch }));

  const handleFiles = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        const { file_url } = await api.integrations.Core.UploadFile({ file, bucket: "social-media" });
        setForm((current) => ({ ...current, media: [...current.media, file_url] }));
      }
    } catch (err) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleThumbnail = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setThumbUploading(true);
    try {
      const { file_url } = await api.integrations.Core.UploadFile({ file, bucket: "social-media" });
      setForm((current) => ({ ...current, thumbnail_url: file_url }));
    } catch (err) {
      toast({ title: "Thumbnail upload failed", description: err.message, variant: "destructive" });
    } finally {
      setThumbUploading(false);
      event.target.value = "";
    }
  };

  const attachVehiclePhoto = () => {
    const photo = selectedVehicle?.images?.[0];
    if (!photo) return;
    if (form.media.includes(photo)) return;
    set({ media: [...form.media, photo] });
  };

  const save = async (publish) => {
    if (!form.title.trim() && !form.body.trim() && form.media.length === 0) {
      toast({ title: "Add a headline, some text or media first", variant: "destructive" });
      return;
    }
    setSaving(publish ? "publish" : "draft");
    try {
      // One post per chosen channel, so each platform gets its own status and insights.
      const fields = { ...form };
      delete fields.platforms;
      const created = [];
      for (const target of targets) {
        const row = await api.entities.SocialPost.create({
          ...fields,
          platform: target.platform,
          posted_by: user?.full_name || user?.email || "",
          status: "draft",
          includes_website_link: form.includes_website_link && !!form.link_url.trim(),
        });
        created.push({ target, row });
      }

      const published = [];
      const failed = [];
      if (publish) {
        for (const { target, row } of created) {
          if (!target.canPublish) continue;
          try {
            await api.functions.invoke("publishSocialPost", { post_id: row.id });
            published.push(target.meta.label);
          } catch (err) {
            failed.push(`${target.meta.label}: ${err.message}`);
          }
        }
      }

      if (!publish) {
        toast({
          title: "Draft saved",
          description: targets.length > 1 ? `Saved for ${targets.map((target) => target.meta.label).join(" and ")}.` : undefined,
        });
      } else {
        const manualLabels = manualTargets.map((target) => target.meta.label).join(" and ");
        const parts = [];
        if (published.length) parts.push(`Published to ${published.join(" and ")}.`);
        if (manualLabels) parts.push(`${manualLabels} saved as drafts — post those by hand.`);
        if (failed.length) parts.push(`Failed: ${failed.join("; ")}.`);
        toast({
          title: failed.length ? "Saved, but publishing failed" : published.length ? "Post published" : "Saved as a draft",
          description: parts.join(" "),
          variant: failed.length ? "destructive" : undefined,
        });
      }

      setForm(emptyForm(form.post_date));
      onSaved?.();
    } catch (err) {
      toast({ title: "Could not save the post", description: err.message, variant: "destructive" });
    } finally {
      setSaving(null);
    }
  };

  const initials = (user?.full_name || "KM")
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <GlassCard className="sp-composer">
      <div className="sp-composer-head">
        <div className="sp-avatar">{initials}</div>
        <div style={{ minWidth: 0 }}>
          <div className="sp-composer-name">{user?.full_name || "Koos & Mike Cars"}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
            <Select value={form.audience} onValueChange={(value) => set({ audience: value })}>
              <SelectTrigger className="sp-audience-trigger">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AUDIENCES.map((audience) => (
                  <SelectItem key={audience.value} value={audience.value}>
                    {audience.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="sp-note">{AUDIENCES.find((a) => a.value === form.audience)?.hint}</span>
          </div>
        </div>
        <span className="sp-composer-badge">
          <Sparkles style={{ width: 12, height: 12 }} /> Studio
        </span>
      </div>

      <input
        className="sp-title-input"
        value={form.title}
        onChange={(event) => set({ title: event.target.value })}
        placeholder="Headline — e.g. 2021 Toyota Hilux Legend RS now in stock"
        maxLength={140}
      />
      <textarea
        className="sp-body-input"
        value={form.body}
        onChange={(event) => set({ body: event.target.value })}
        placeholder="Tell your customers what makes this special…"
        rows={3}
      />

      {form.audience === "custom" && (
        <input
          className="sp-audience-note"
          value={form.audience_note}
          onChange={(event) => set({ audience_note: event.target.value })}
          placeholder="Who should see this? e.g. Hilux buyers in Polokwane"
        />
      )}

      <MediaGrid media={form.media} onRemove={(index) => set({ media: form.media.filter((_, i) => i !== index) })} />

      {form.thumbnail_url && (
        <div className="sp-thumb-row">
          <img src={form.thumbnail_url} alt="Post thumbnail preview" className="sp-thumb" />
          <span className="sp-note">Thumbnail — shown on the post card.</span>
          <button type="button" className="sp-icon-x" onClick={() => set({ thumbnail_url: "" })} aria-label="Remove thumbnail">
            <X style={{ width: 13, height: 13 }} />
          </button>
        </div>
      )}

      {form.includes_website_link && (
        <div className="sp-link-row">
          <Link2 style={{ width: 14, height: 14, color: "var(--mut)", flexShrink: 0 }} />
          <input
            value={form.link_url}
            onChange={(event) => set({ link_url: event.target.value })}
            placeholder={SITE_URL}
          />
        </div>
      )}

      <div className="sp-toolbar">
        <label className={`sp-tool ${uploading ? "active" : ""}`}>
          {uploading ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> : <ImagePlus style={{ width: 14, height: 14 }} />}
          {uploading ? "Uploading…" : "Photo"}
          <input type="file" accept="image/*,video/mp4,video/quicktime" multiple hidden onChange={handleFiles} disabled={uploading} />
        </label>

        <label className={`sp-tool ${thumbUploading ? "active" : ""}`}>
          {thumbUploading ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> : <ImageIcon style={{ width: 14, height: 14 }} />}
          {thumbUploading ? "Uploading…" : form.thumbnail_url ? "Change thumbnail" : "Thumbnail"}
          <input type="file" accept="image/*" hidden onChange={handleThumbnail} disabled={thumbUploading} />
        </label>

        <Select value={form.vehicle_featured || "none"} onValueChange={(value) => set({ vehicle_featured: value === "none" ? "" : value })}>
          <SelectTrigger className="sp-tool sp-tool-select">
            <Car style={{ width: 14, height: 14 }} />
            <SelectValue placeholder="Feature a vehicle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No vehicle</SelectItem>
            {vehicles.map((vehicle) => (
              <SelectItem key={vehicle.id} value={vehicle.title}>{vehicle.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedVehicle?.images?.length > 0 && (
          <button type="button" className="sp-tool" onClick={attachVehiclePhoto}>
            <ImagePlus style={{ width: 14, height: 14 }} /> Use vehicle photo
          </button>
        )}

        <button
          type="button"
          className={`sp-tool ${form.includes_cta ? "active" : ""}`}
          onClick={() => set({ includes_cta: !form.includes_cta })}
        >
          <MessageSquare style={{ width: 14, height: 14 }} /> Contact CTA
        </button>
        <button
          type="button"
          className={`sp-tool ${form.includes_website_link ? "active" : ""}`}
          onClick={() => set({ includes_website_link: !form.includes_website_link })}
        >
          <Link2 style={{ width: 14, height: 14 }} /> Website link
        </button>

        <Select value={form.post_type} onValueChange={(value) => set({ post_type: value })}>
          <SelectTrigger className="sp-tool sp-tool-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {POST_TYPES.map((type) => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="sp-composer-foot">
        <div className="sp-platforms">
          <span className="sp-note" style={{ alignSelf: "center", marginRight: 2 }}>Publish to</span>
          {PLATFORMS.map((platform) => {
            const meta = PLATFORM_META[platform];
            const Icon = meta.icon;
            const status = meta.integration ? integrations[meta.integration]?.status || "inactive" : null;
            return (
              <button
                key={platform}
                type="button"
                className={`sp-platform-chip ${form.platforms.includes(platform) ? "active" : ""}`}
                onClick={() => togglePlatform(platform)}
                aria-pressed={form.platforms.includes(platform)}
                title={meta.publishable ? meta.label : `${meta.label} — logged only, no direct posting`}
              >
                <Icon style={{ width: 13, height: 13, color: meta.color }} />
                {meta.label}
                {status && <span className="sp-dot" style={{ background: INTEGRATION_DOT[status] }} />}
                {form.platforms.includes(platform) && <Check style={{ width: 11, height: 11 }} />}
              </button>
            );
          })}
        </div>

        <input
          type="date"
          className="sp-date"
          value={form.post_date}
          onChange={(event) => set({ post_date: event.target.value })}
          aria-label="Post date"
        />

        <div className="sp-actions-right">
          <button type="button" className="sp-tool" onClick={() => save(false)} disabled={!!saving}>
            {saving === "draft" ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> : "Save draft"}
          </button>
          <button type="button" className="km-btn-primary" onClick={() => save(true)} disabled={!!saving}>
            {saving === "publish" ? <Loader2 style={{ width: 15, height: 15 }} className="animate-spin" /> : <Send style={{ width: 15, height: 15 }} />}
            {publishableTargets.length ? "Publish now" : "Save post"}
          </button>
        </div>
      </div>

      <div className="sp-composer-hint">
        {targets.map(({ platform, meta, integration, canPublish }) => (
          <div key={platform}>
            {canPublish ? (
              <span className="sp-note-ok">
                {meta.label}: publishing directly to {integration.account_name || meta.label}.
              </span>
            ) : meta.publishable ? (
              <span className="sp-note-warn">
                {meta.label}: direct posting is {integration?.status || "inactive"} — saved so you can post it by hand.
              </span>
            ) : (
              <span className="sp-note">
                {meta.label}: logged here only — copy the caption across when you post.
              </span>
            )}
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
