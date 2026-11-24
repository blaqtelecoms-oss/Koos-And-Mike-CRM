import { db, json, serve } from "../_shared/supabase.ts";

serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const leadId = body.leadId || body.event?.entity_id || body.record?.id;
    if (!leadId) return json({ error: "No lead ID provided" }, 400);

    const client = db();

    const { data: lead, error: leadError } = await client
      .from("leads")
      .select("id, assigned_consultant")
      .eq("id", leadId)
      .maybeSingle();
    if (leadError) throw leadError;
    if (!lead) return json({ error: "Lead not found" }, 404);
    if (lead.assigned_consultant && lead.assigned_consultant !== "Unassigned") {
      return json({ message: "Lead already assigned", leadId });
    }

    const { data: consultants, error: consultantError } = await client
      .from("consultants")
      .select("id, name")
      .eq("active", true)
      .eq("available", true)
      .eq("role", "Sales")
      .order("created_date", { ascending: false })
      .limit(100);
    if (consultantError) throw consultantError;
    if (!consultants || consultants.length === 0) {
      return json({ message: "No available consultants", leadId });
    }

    const { data: allLeads, error: allLeadsError } = await client
      .from("leads")
      .select("assigned_consultant")
      .order("created_date", { ascending: false })
      .limit(1000);
    if (allLeadsError) throw allLeadsError;

    const load: Record<string, number> = {};
    for (const consultant of consultants) load[consultant.name] = 0;
    for (const row of allLeads ?? []) {
      if (row.assigned_consultant && load[row.assigned_consultant] !== undefined) {
        load[row.assigned_consultant]++;
      }
    }

    let selected = consultants[0];
    let lowest = Infinity;
    for (const consultant of consultants) {
      if (load[consultant.name] < lowest) {
        lowest = load[consultant.name];
        selected = consultant;
      }
    }

    const { error: updateError } = await client
      .from("leads")
      .update({ assigned_consultant: selected.name })
      .eq("id", leadId);
    if (updateError) throw updateError;

    return json({
      success: true,
      leadId,
      assignedTo: selected.name,
      currentLoad: load[selected.name] + 1,
    });
  } catch (error) {
    return json({ error: (error as Error).message }, 500);
  }
});
