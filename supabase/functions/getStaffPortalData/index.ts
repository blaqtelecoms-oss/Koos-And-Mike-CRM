import { db, json, serve } from "../_shared/supabase.ts";

serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const consultantName = body.consultantName || null;
    const leadId = body.leadId || null;
    const client = db();

    if (leadId) {
      const { data: followUps, error } = await client
        .from("lead_follow_ups")
        .select("*")
        .eq("lead_id", leadId)
        .order("update_date", { ascending: false })
        .limit(100);
      if (error) throw error;
      return json({ followUps: followUps ?? [] });
    }

    const [myLeads, allLeads, vehicles, tasks] = await Promise.all([
      consultantName
        ? client
            .from("leads")
            .select("*")
            .eq("assigned_consultant", consultantName)
            .order("created_date", { ascending: false })
            .limit(300)
        : Promise.resolve({ data: [] }),
      client.from("leads").select("*").order("created_date", { ascending: false }).limit(300),
      client
        .from("vehicles")
        .select("*")
        .eq("status", "Available")
        .order("created_date", { ascending: false })
        .limit(100),
      client.from("daily_tasks").select("*").order("task_date", { ascending: false }).limit(100),
    ]);

    return json({
      myLeads: myLeads.data ?? [],
      allLeads: allLeads.data ?? [],
      vehicles: vehicles.data ?? [],
      tasks: tasks.data ?? [],
    });
  } catch (error) {
    return json({ error: (error as Error).message }, 500);
  }
});
