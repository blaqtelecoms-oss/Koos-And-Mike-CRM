import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const roleFilter = body.role || "Sales";
    const consultants = await base44.asServiceRole.entities.Consultant.list("-name", 100);
    const active = (consultants || [])
      .filter(c => c.active !== false && c.role === roleFilter)
      .map(c => ({ id: c.id, name: c.name, role: c.role, available: c.available }));
    return Response.json({ consultants: active });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});