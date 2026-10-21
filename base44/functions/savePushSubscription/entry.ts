import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { endpoint, p256dh, auth } = body;

    if (!endpoint || !p256dh || !auth) {
      return Response.json({ error: 'Missing subscription fields' }, { status: 400 });
    }

    // Check if subscription already exists for this endpoint
    const existing = await base44.asServiceRole.entities.PushSubscription.filter({ endpoint });
    if (existing && existing.length > 0) {
      // Update it
      await base44.asServiceRole.entities.PushSubscription.update(existing[0].id, {
        user_email: user.email,
        p256dh,
        auth
      });
    } else {
      await base44.asServiceRole.entities.PushSubscription.create({
        user_email: user.email,
        endpoint,
        p256dh,
        auth
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});