import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import webpush from 'npm:web-push@3.6.7';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    const vapidEmail = Deno.env.get('VAPID_EMAIL');

    if (!vapidPublicKey || !vapidPrivateKey || !vapidEmail) {
      return Response.json({ error: 'VAPID keys not configured' }, { status: 500 });
    }

    webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);

    const body = await req.json();
    const { title, message } = body;

    // Get all push subscriptions
    const subscriptions = await base44.asServiceRole.entities.PushSubscription.list();

    if (!subscriptions || subscriptions.length === 0) {
      return Response.json({ message: 'No subscribers', sent: 0 });
    }

    let sent = 0;
    let failed = 0;
    const toDelete = [];

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth
            }
          },
          JSON.stringify({
            title: title || '🚗 New Lead!',
            body: message || 'A new lead has just come in. Open the app to respond.',
            url: '/Leads'
          })
        );
        sent++;
      } catch (err) {
        // 404/410 means subscription is expired/invalid — remove it
        if (err.statusCode === 404 || err.statusCode === 410) {
          toDelete.push(sub.id);
        }
        failed++;
      }
    }

    // Clean up expired subscriptions
    for (const id of toDelete) {
      await base44.asServiceRole.entities.PushSubscription.delete(id);
    }

    return Response.json({ sent, failed, cleaned: toDelete.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});