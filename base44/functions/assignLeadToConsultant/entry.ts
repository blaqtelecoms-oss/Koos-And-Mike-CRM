import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // Extract lead ID from automation event
    const leadId = body.event?.entity_id;
    if (!leadId) {
      return Response.json({ error: 'No lead ID provided' }, { status: 400 });
    }

    // Get the new lead
    const lead = await base44.asServiceRole.entities.Lead.get(leadId);
    
    // If already assigned, skip
    if (lead.assigned_consultant) {
      return Response.json({ message: 'Lead already assigned', leadId });
    }

    // Get all active, available consultants with Sales role
    const consultants = await base44.asServiceRole.entities.Consultant.filter({
      active: true,
      available: true,
      role: "Sales"
    }, "-created_date", 100);

    if (consultants.length === 0) {
      return Response.json({ message: 'No available consultants', leadId });
    }

    // Get all assigned leads to calculate load per consultant
    const allLeads = await base44.asServiceRole.entities.Lead.list("-created_date", 500);
    
    const consultantLoad = {};
    consultants.forEach(c => {
      consultantLoad[c.name] = 0;
    });

    // Count leads per consultant
    allLeads.forEach(l => {
      if (l.assigned_consultant && consultantLoad.hasOwnProperty(l.assigned_consultant)) {
        consultantLoad[l.assigned_consultant]++;
      }
    });

    // Find consultant with lowest load
    let selectedConsultant = null;
    let lowestLoad = Infinity;

    for (const consultant of consultants) {
      if (consultantLoad[consultant.name] < lowestLoad) {
        lowestLoad = consultantLoad[consultant.name];
        selectedConsultant = consultant;
      }
    }

    if (!selectedConsultant) {
      selectedConsultant = consultants[0];
    }

    // Assign the lead
    await base44.asServiceRole.entities.Lead.update(leadId, {
      assigned_consultant: selectedConsultant.name
    });

    return Response.json({
      success: true,
      leadId,
      assignedTo: selectedConsultant.name,
      currentLoad: consultantLoad[selectedConsultant.name] + 1
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});