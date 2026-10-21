import { useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

// Plays a notification chime using Web Audio API
function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const times = [0, 0.15, 0.3];
    const freqs = [880, 1100, 1320];
    times.forEach((t, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freqs[i];
      osc.type = "sine";
      gain.gain.setValueAtTime(0.4, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.4);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.5);
    });
  } catch (_) {}
}

export default function NewLeadNotifier({ onNewLead }) {
  const { toast } = useToast();
  const mountedAt = useRef(Date.now());
  const knownIds = useRef(new Set());

  useEffect(() => {
    const unsubscribe = base44.entities.Lead.subscribe((event) => {
      // Only fire for newly created leads AFTER page load
      if (event.type !== "create") return;
      if (Date.now() - mountedAt.current < 3000) return; // ignore initial load burst
      if (knownIds.current.has(event.id)) return;
      knownIds.current.add(event.id);

      playNotificationSound();
      toast({
        title: "🚨 New Lead!",
        description: `${event.data?.lead_name || "Unknown"} — ${event.data?.car_interested || "No vehicle specified"}`,
        duration: 60000,
      });

      if (onNewLead) onNewLead(event.data);
    });

    return unsubscribe;
  }, []);

  return null;
}