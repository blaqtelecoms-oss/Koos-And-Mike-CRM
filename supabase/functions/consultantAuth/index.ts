import { db, json, requireUser, serve } from "../_shared/supabase.ts";

const DEFAULT_PASSWORD = 'Leads2026';

async function hashPassword(password: string) {
  const data = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function verifyPassword(password: string, hash: string) {
  return (await hashPassword(password)) === hash;
}

const getConsultant = async (id: string) => {
  const { data } = await db().from("consultants").select("*").eq("id", id).maybeSingle();
  return data ?? null;
};

serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const { action, consultantId, password, newPassword } = body;

    // LOGIN
    if (action === "login") {
      if (!consultantId || !password) {
        return json({ error: "Consultant and password required" }, 400);
      }

      const consultant = await getConsultant(consultantId);
      if (!consultant) return json({ error: "Consultant not found" }, 401);
      if (!consultant.active) return json({ error: "Account is inactive" }, 403);

      // No password set yet: allow the default password and force a change
      if (!consultant.password_hash) {
        if (password !== DEFAULT_PASSWORD) {
          return json({ error: "Incorrect password" }, 401);
        }
        return json({
          success: true,
          mustChangePassword: true,
          consultant: {
            id: consultant.id,
            name: consultant.name,
            role: consultant.role,
            email: consultant.email,
          },
        });
      }

      const match = await verifyPassword(password, consultant.password_hash);
      if (!match) return json({ error: "Incorrect password" }, 401);

      return json({
        success: true,
        mustChangePassword: false,
        consultant: {
          id: consultant.id,
          name: consultant.name,
          role: consultant.role,
          email: consultant.email,
        },
      });
    }

    // CHANGE PASSWORD (staff changing their own)
    if (action === "changePassword") {
      if (!consultantId || !newPassword) {
        return json({ error: "Consultant ID and new password required" }, 400);
      }
      if (newPassword.length < 6) {
        return json({ error: "Password must be at least 6 characters" }, 400);
      }

      const consultant = await getConsultant(consultantId);
      if (!consultant) return json({ error: "Consultant not found" }, 404);

      const { error } = await db()
        .from("consultants")
        .update({
          password_hash: await hashPassword(newPassword),
          password_setup_required: false,
        })
        .eq("id", consultantId);
      if (error) throw error;

      return json({ success: true, message: "Password updated successfully" });
    }

    // RESET PASSWORD (admin only — resets to default)
    if (action === "resetPassword") {
      const user = await requireUser(req);
      if (!user || user.role !== "admin") {
        return json({ error: "Admin access required" }, 403);
      }
      if (!consultantId) return json({ error: "Consultant ID required" }, 400);

      const consultant = await getConsultant(consultantId);
      if (!consultant) return json({ error: "Consultant not found" }, 404);

      const { error } = await db()
        .from("consultants")
        .update({ password_hash: "", password_setup_required: true })
        .eq("id", consultantId);
      if (error) throw error;

      return json({ success: true, message: "Password reset to the default password" });
    }

    return json({ error: "Invalid action" }, 400);
  } catch (error) {
    return json({ error: (error as Error).message }, 500);
  }
});
