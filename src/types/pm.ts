export type PMStatus = 'Draft' | 'Active' | 'On Hold' | 'Completed' | 'Cancelled';

export type ProjectRole = 'admin' | 'manager' | 'engineer' | 'planner' | 'viewer';

export type PermissionModule = 'project' | 'activities' | 'documents' | 'issues' | 'members';

export type PermissionAction = 'create' | 'edit' | 'delete' | 'review' | 'approve' | 'view';

export interface ProjectMember {
  id: string;
  organization_id: string;
  retrofit_project_id: string;
  user_id: string;
  role: ProjectRole;
  created_at: string;
  updated_at?: string;
}

export interface ProjectPermission {
  id: string;
  organization_id: string;
  role: ProjectRole;
  module: PermissionModule;
  action: PermissionAction;
  allowed: boolean;
  created_at: string;
}

export type ActivityStatus =
  | 'Pending'
  | 'Work in Progress'
  | 'Ready for Inspection'
  | 'Awaiting Client Approval'
  | 'Inspected'
  | 'Closed';

export type AssigneeType = 'employee' | 'client_rep' | 'consultant';

export interface ProjectActivity {
  id: string;
  organization_id: string;
  retrofit_project_id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  progress_percent: number;
  status: ActivityStatus;
  assignee_type?: AssigneeType;
  assignee_user_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type DependencyType = 'FS' | 'SS' | 'FF' | 'SF';

export interface ActivityDependency {
  id: string;
  organization_id: string;
  retrofit_project_id: string;
  predecessor_activity_id: string;
  successor_activity_id: string;
  type: DependencyType;
  lag_days: number;
  created_at: string;
}

export type DocumentCategory =
  | 'Drawings'
  | 'Material Submittal'
  | 'Method Statement'
  | 'Inspection'
  | 'Handover'
  | 'Other';

export type WorkflowStatus =
  | 'Draft'
  | 'Submitted'
  | 'Under Review'
  | 'Approved'
  | 'Rejected'
  | 'Resubmitted';

export interface ProjectDocument {
  id: string;
  organization_id: string;
  retrofit_project_id: string;
  title: string;
  category: DocumentCategory;
  linked_activity_id?: string;
  current_version_id?: string;
  workflow_status: WorkflowStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentVersion {
  id: string;
  organization_id: string;
  document_id: string;
  version_number: number;
  file_url: string;
  uploaded_by: string;
  uploaded_at: string;
  notes?: string;
}

export type WorkflowStepType = 'internal_review' | 'consultant_review' | 'client_approval';

export type WorkflowDecision = 'Pending' | 'Approved' | 'Rejected' | 'Revision Requested';

export interface DocumentWorkflowStep {
  id: string;
  organization_id: string;
  document_id: string;
  step_order: number;
  step_type: WorkflowStepType;
  is_optional: boolean;
  assigned_to_user_id?: string;
  due_date?: string;
  decision: WorkflowDecision;
  decision_by?: string;
  decision_at?: string;
  decision_notes?: string;
  created_at: string;
}

export interface DocumentComment {
  id: string;
  organization_id: string;
  document_id: string;
  version_id?: string;
  comment: string;
  created_by: string;
  created_at: string;
}

export type IssuePriority = 'Low' | 'Medium' | 'High' | 'Critical';

export type IssueStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';

export interface ProjectIssue {
  id: string;
  organization_id: string;
  retrofit_project_id: string;
  title: string;
  description?: string;
  priority: IssuePriority;
  status: IssueStatus;
  due_date?: string;
  linked_activity_id?: string;
  linked_document_id?: string;
  assigned_to_user_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface IssueComment {
  id: string;
  organization_id: string;
  issue_id: string;
  comment: string;
  created_by: string;
  created_at: string;
}

export type AuditEntityType = 'document' | 'activity' | 'issue' | 'project' | 'member';

export interface AuditLog {
  id: string;
  organization_id: string;
  entity_type: AuditEntityType;
  entity_id: string;
  action: string;
  old_value?: any;
  new_value?: any;
  created_by: string;
  created_at: string;
}

export interface RetrofitProjectPM {
  id: string;
  project_name: string;
  client_name?: string;
  pm_status?: PMStatus;
  baseline_locked_at?: string;
  baseline_locked_by?: string;
  forecast_end_date?: string;
  overall_progress?: number;
  calculated_value?: number;
  status: string;
  created_at: string;
  updated_at: string;
}
