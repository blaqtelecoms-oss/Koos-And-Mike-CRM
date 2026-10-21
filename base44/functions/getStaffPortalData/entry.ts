import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const consultantName = body.consultantName || null;
    const leadId = body.leadId || null;

    // If leadId is provided, return follow-ups for that lead only
    if (leadId) {
      const followUps = await base44.asServiceRole.entities.LeadFollowUp.filter(
        { lead_id: leadId }, "-update_date", 100
      );
      return Response.json({ followUps });
    }

    const [myLeads, allLeads, vehicles, tasks] = await Promise.all([
      consultantName
        ? base44.asServiceRole.entities.Lead.filter({ assigned_consultant: consultantName }, "-created_date", 300)
        : Promise.resolve([]),
      base44.asServiceRole.entities.Lead.list("-created_date", 300),
      base44.asServiceRole.entities.Vehicle.filter({ status: "Available" }, "-created_date", 100),
      base44.asServiceRole.entities.DailyTask.list("-task_date", 100),
    ]);

    return Response.json({ myLeads, allLeads, vehicles, tasks });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});