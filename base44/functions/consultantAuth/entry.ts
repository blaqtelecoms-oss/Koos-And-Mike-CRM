import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const DEFAULT_PASSWORD = 'Leads2026';

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(password, hash) {
  const testHash = await hashPassword(password);
  return testHash === hash;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { action, consultantId, password, newPassword } = body;

    // LOGIN
    if (action === 'login') {
      if (!consultantId || !password) {
        return Response.json({ error: 'Consultant and password required' }, { status: 400 });
      }

      let consultant = null;
      try {
        const results = await base44.asServiceRole.entities.Consultant.filter({ id: consultantId });
        consultant = results?.[0] || null;
      } catch {
        consultant = null;
      }
      if (!consultant) {
        return Response.json({ error: 'Consultant not found' }, { status: 401 });
      }

      if (!consultant.active) {
        return Response.json({ error: 'Account is inactive' }, { status: 403 });
      }

      // If no password hash set yet, allow login with default password
      if (!consultant.password_hash) {
        if (password !== DEFAULT_PASSWORD) {
          return Response.json({ error: 'Incorrect password' }, { status: 401 });
        }
        // Mark that they logged in with default — they'll be prompted to change
        return Response.json({
          success: true,
          mustChangePassword: true,
          consultant: {
            id: consultant.id,
            name: consultant.name,
            role: consultant.role,
            email: consultant.email,
          }
        });
      }

      const match = await verifyPassword(password, consultant.password_hash);
      if (!match) {
        return Response.json({ error: 'Incorrect password' }, { status: 401 });
      }

      return Response.json({
        success: true,
        mustChangePassword: false,
        consultant: {
          id: consultant.id,
          name: consultant.name,
          role: consultant.role,
          email: consultant.email,
        }
      });
    }

    // CHANGE PASSWORD (staff changing their own)
    if (action === 'changePassword') {
      if (!consultantId || !newPassword) {
        return Response.json({ error: 'Consultant ID and new password required' }, { status: 400 });
      }

      if (newPassword.length < 6) {
        return Response.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
      }

      // Fetch existing consultant to ensure required fields are preserved
      let consultant = null;
      try {
        const results = await base44.asServiceRole.entities.Consultant.filter({ id: consultantId });
        consultant = results?.[0] || null;
      } catch { consultant = null; }
      if (!consultant) {
        return Response.json({ error: 'Consultant not found' }, { status: 404 });
      }

      const hash = await hashPassword(newPassword);
      await base44.asServiceRole.entities.Consultant.update(consultantId, {
        name: consultant.name || '',
        email: consultant.email || '',
        password_hash: hash,
        password_setup_required: false
      });

      return Response.json({ success: true, message: 'Password updated successfully' });
    }

    // RESET PASSWORD (admin only — resets to default)
    if (action === 'resetPassword') {
      const user = await base44.auth.me();
      if (!user || user.role !== 'admin') {
        return Response.json({ error: 'Admin access required' }, { status: 403 });
      }

      if (!consultantId) {
        return Response.json({ error: 'Consultant ID required' }, { status: 400 });
      }

      // Verify consultant exists
      let exists = null;
      try {
        const results = await base44.asServiceRole.entities.Consultant.filter({ id: consultantId });
        exists = results?.[0] || null;
      } catch { exists = null; }
      if (!exists) {
        return Response.json({ error: 'Consultant not found' }, { status: 404 });
      }

      await base44.asServiceRole.entities.Consultant.update(consultantId, {
        name: exists.name || '',
        email: exists.email || '',
        password_hash: '',
        password_setup_required: true
      });

      return Response.json({ success: true, message: `Password reset to default (${DEFAULT_PASSWORD})` });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});