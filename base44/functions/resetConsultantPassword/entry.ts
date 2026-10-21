import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only admin can reset passwords
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { consultant_id } = body;

    if (!consultant_id) {
      return Response.json({ error: 'Consultant ID required' }, { status: 400 });
    }

    // Reset password
    await base44.asServiceRole.entities.Consultant.update(consultant_id, {
      password_setup_required: true,
      password_hash: ''
    });

    return Response.json({
      success: true,
      message: 'Password reset. Consultant must set new password on next login.'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});