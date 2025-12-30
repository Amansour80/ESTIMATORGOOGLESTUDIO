import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { action, activityId, activityData } = await req.json();

    // Verify project membership and permissions
    const { data: membership } = await supabase
      .from("project_members")
      .select("role, organization_id")
      .eq("retrofit_project_id", activityData.retrofit_project_id)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      throw new Error("Not a project member");
    }

    // Check permission
    const { data: permission } = await supabase
      .from("project_permissions")
      .select("allowed")
      .eq("organization_id", membership.organization_id)
      .eq("role", membership.role)
      .eq("module", "activities")
      .eq("action", action === "create" ? "create" : action === "delete" ? "delete" : "edit")
      .single();

    if (!permission?.allowed) {
      throw new Error("Permission denied");
    }

    let result;

    if (action === "create") {
      const { data, error } = await supabase
        .from("project_activities")
        .insert({
          ...activityData,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      result = data;

      // Log audit
      await supabase.from("audit_log").insert({
        organization_id: membership.organization_id,
        entity_type: "activity",
        entity_id: data.id,
        action: "create",
        new_value: data,
        created_by: user.id,
      });

    } else if (action === "update") {
      // Get old value for audit
      const { data: oldData } = await supabase
        .from("project_activities")
        .select("*")
        .eq("id", activityId)
        .single();

      const { data, error } = await supabase
        .from("project_activities")
        .update({
          ...activityData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", activityId)
        .select()
        .single();

      if (error) throw error;
      result = data;

      // Log audit
      await supabase.from("audit_log").insert({
        organization_id: membership.organization_id,
        entity_type: "activity",
        entity_id: activityId,
        action: "update",
        old_value: oldData,
        new_value: data,
        created_by: user.id,
      });

    } else if (action === "delete") {
      const { data: oldData } = await supabase
        .from("project_activities")
        .select("*")
        .eq("id", activityId)
        .single();

      const { error } = await supabase
        .from("project_activities")
        .delete()
        .eq("id", activityId);

      if (error) throw error;
      result = { success: true };

      // Log audit
      await supabase.from("audit_log").insert({
        organization_id: membership.organization_id,
        entity_type: "activity",
        entity_id: activityId,
        action: "delete",
        old_value: oldData,
        created_by: user.id,
      });
    }

    return new Response(JSON.stringify(result), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
});