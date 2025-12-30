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

    const { action, documentId, stepId, decision, notes, fileUrl } = await req.json();

    // Get document and verify access
    const { data: document } = await supabase
      .from("project_documents")
      .select("*, retrofit_project_id")
      .eq("id", documentId)
      .single();

    if (!document) {
      throw new Error("Document not found");
    }

    // Verify project membership
    const { data: membership } = await supabase
      .from("project_members")
      .select("role, organization_id")
      .eq("retrofit_project_id", document.retrofit_project_id)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      throw new Error("Not a project member");
    }

    let result;

    if (action === "submit") {
      // Check permission
      const { data: permission } = await supabase
        .from("project_permissions")
        .select("allowed")
        .eq("organization_id", membership.organization_id)
        .eq("role", membership.role)
        .eq("module", "documents")
        .eq("action", "edit")
        .single();

      if (!permission?.allowed) {
        throw new Error("Permission denied");
      }

      // Update document status to Submitted
      const { data, error } = await supabase
        .from("project_documents")
        .update({ workflow_status: "Submitted", updated_at: new Date().toISOString() })
        .eq("id", documentId)
        .select()
        .single();

      if (error) throw error;
      result = data;

      // Audit log
      await supabase.from("audit_log").insert({
        organization_id: membership.organization_id,
        entity_type: "document",
        entity_id: documentId,
        action: "submit",
        new_value: { workflow_status: "Submitted" },
        created_by: user.id,
      });

    } else if (action === "approve" || action === "reject" || action === "request_revision") {
      // Check if user is assigned to this step
      const { data: step } = await supabase
        .from("document_workflow_steps")
        .select("*")
        .eq("id", stepId)
        .single();

      if (!step) {
        throw new Error("Workflow step not found");
      }

      if (step.assigned_to_user_id && step.assigned_to_user_id !== user.id) {
        // Check if user has approve permission
        const { data: permission } = await supabase
          .from("project_permissions")
          .select("allowed")
          .eq("organization_id", membership.organization_id)
          .eq("role", membership.role)
          .eq("module", "documents")
          .eq("action", "approve")
          .single();

        if (!permission?.allowed) {
          throw new Error("Not authorized to make this decision");
        }
      }

      const decisionValue = action === "approve" ? "Approved" : action === "reject" ? "Rejected" : "Revision Requested";

      // Update workflow step
      await supabase
        .from("document_workflow_steps")
        .update({
          decision: decisionValue,
          decision_by: user.id,
          decision_at: new Date().toISOString(),
          decision_notes: notes,
        })
        .eq("id", stepId);

      // Check if all required steps are complete
      const { data: allSteps } = await supabase
        .from("document_workflow_steps")
        .select("*")
        .eq("document_id", documentId)
        .order("step_order");

      let newStatus = "Under Review";
      const allRequired = allSteps?.filter(s => !s.is_optional);
      const allRequiredApproved = allRequired?.every(s => s.decision === "Approved");
      const anyRejected = allSteps?.some(s => s.decision === "Rejected");

      if (anyRejected) {
        newStatus = "Rejected";
      } else if (allRequiredApproved) {
        newStatus = "Approved";
      }

      // Update document status
      const { data, error } = await supabase
        .from("project_documents")
        .update({ workflow_status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", documentId)
        .select()
        .single();

      if (error) throw error;
      result = data;

      // Audit log
      await supabase.from("audit_log").insert({
        organization_id: membership.organization_id,
        entity_type: "document",
        entity_id: documentId,
        action: action,
        new_value: { decision: decisionValue, notes },
        created_by: user.id,
      });

    } else if (action === "resubmit") {
      // Check permission
      const { data: permission } = await supabase
        .from("project_permissions")
        .select("allowed")
        .eq("organization_id", membership.organization_id)
        .eq("role", membership.role)
        .eq("module", "documents")
        .eq("action", "edit")
        .single();

      if (!permission?.allowed) {
        throw new Error("Permission denied");
      }

      // Get current max version
      const { data: versions } = await supabase
        .from("document_versions")
        .select("version_number")
        .eq("document_id", documentId)
        .order("version_number", { ascending: false })
        .limit(1);

      const newVersionNumber = (versions?.[0]?.version_number || 0) + 1;

      // Create new version
      const { data: newVersion } = await supabase
        .from("document_versions")
        .insert({
          organization_id: membership.organization_id,
          document_id: documentId,
          version_number: newVersionNumber,
          file_url: fileUrl,
          uploaded_by: user.id,
          notes: notes,
        })
        .select()
        .single();

      // Reset workflow steps
      await supabase
        .from("document_workflow_steps")
        .update({
          decision: "Pending",
          decision_by: null,
          decision_at: null,
          decision_notes: null,
        })
        .eq("document_id", documentId);

      // Update document
      const { data, error } = await supabase
        .from("project_documents")
        .update({
          workflow_status: "Resubmitted",
          current_version_id: newVersion.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", documentId)
        .select()
        .single();

      if (error) throw error;
      result = data;

      // Audit log
      await supabase.from("audit_log").insert({
        organization_id: membership.organization_id,
        entity_type: "document",
        entity_id: documentId,
        action: "resubmit",
        new_value: { version: newVersionNumber },
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