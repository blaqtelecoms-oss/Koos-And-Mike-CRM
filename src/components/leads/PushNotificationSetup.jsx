import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, BellRing } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushNotificationSetup() {
  const [status, setStatus] = useState('unknown'); // unknown, unsupported, denied, default, subscribed
  const { toast } = useToast();

  useEffect(() => {
    checkStatus();
  }, []);

  async function checkStatus() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported');
      return;
    }
    const perm = Notification.permission;
    if (perm === 'denied') { setStatus('denied'); return; }
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setStatus(sub ? 'subscribed' : 'default');
    } catch {
      setStatus('default');
    }
  }

  async function subscribe() {
    try {
      // Register service worker
      await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setStatus('denied');
        toast({ title: "Notifications blocked", description: "Please enable notifications in your browser/phone settings.", variant: "destructive" });
        return;
      }

      // Fetch VAPID public key from backend
      const res = await base44.functions.invoke('getVapidPublicKey', {});
      const publicKey = res.data?.publicKey;
      if (!publicKey) {
        toast({ title: "Setup error", description: "VAPID public key not configured.", variant: "destructive" });
        return;
      }

      // Subscribe to push
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });

      const subJson = sub.toJSON();
      await base44.functions.invoke('savePushSubscription', {
        endpoint: subJson.endpoint,
        p256dh: subJson.keys.p256dh,
        auth: subJson.keys.auth
      });

      setStatus('subscribed');
      toast({ title: "✅ Notifications enabled!", description: "You'll get notified about new leads even with the app closed." });
    } catch (err) {
      toast({ title: "Error enabling notifications", description: err.message, variant: "destructive" });
    }
  }

  async function unsubscribe() {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
      setStatus('default');
      toast({ title: "Notifications disabled" });
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  }

  if (status === 'unsupported' || status === 'unknown') return null;

  return (
    <div className="flex items-center">
      {status === 'subscribed' ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={unsubscribe}
          className="text-amber-400 hover:text-amber-300 gap-2"
          title="Push notifications ON — click to disable"
        >
          <BellRing className="w-4 h-4" />
          <span className="hidden sm:inline text-xs">Alerts ON</span>
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={subscribe}
          disabled={status === 'denied'}
          className="text-amber-600/60 hover:text-amber-400 gap-2"
          title={status === 'denied' ? 'Notifications blocked — enable in phone settings' : 'Tap to enable push notifications'}
        >
          {status === 'denied' ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
          <span className="hidden sm:inline text-xs">{status === 'denied' ? 'Alerts Blocked' : 'Enable Alerts'}</span>
        </Button>
      )}
    </div>
  );
}