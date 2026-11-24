import { db, json, serve } from "../_shared/supabase.ts";

// Writes made from the staff portal, which signs in with a consultant password
// (not a Supabase account) and therefore cannot use row-level security.
serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const client = db();

    if (body.action === "updateLeadStatus") {
      const { leadId, status } = body;
      if (!leadId || !status) return json({ error: "leadId and status are required" }, 400);
      const { error } = await client.from("leads").update({ status }).eq("id", leadId);
      if (error) throw error;
      return json({ success: true });
    }

    if (body.action === "createFollowUp") {
      const followUp = body.followUp || {};
      if (!followUp.lead_id || !followUp.pipeline_stage) {
        return json({ error: "lead_id and pipeline_stage are required" }, 400);
      }
      const { data, error } = await client
        .from("lead_follow_ups")
        .insert({
          lead_id: followUp.lead_id,
          lead_name: followUp.lead_name ?? null,
          update_date: followUp.update_date ?? new Date().toISOString().slice(0, 10),
          contact_method: followUp.contact_method ?? null,
          lead_response: followUp.lead_response ?? null,
          pipeline_stage: followUp.pipeline_stage,
          reported_by: followUp.reported_by ?? null,
          notes: followUp.notes ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return json({ success: true, followUp: data });
    }

    if (body.action === "setAvailability") {
      const { consultantId, available } = body;
      if (!consultantId) return json({ error: "consultantId is required" }, 400);
      const { error } = await client
        .from("consultants")
        .update({ available: !!available })
        .eq("id", consultantId);
      if (error) throw error;
      return json({ success: true });
    }

    return json({ error: "Invalid action" }, 400);
  } catch (error) {
    return json({ error: (error as Error).message }, 500);
  }
});
