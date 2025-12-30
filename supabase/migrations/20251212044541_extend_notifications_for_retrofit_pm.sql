/*
  # Extend Notifications System for Retrofit PM
  
  1. Changes
    - Add new notification types for PM events
    - Create helper functions for creating notifications
    - Add triggers for automatic notification creation
    
  2. New Notification Types
    - activity_assigned: When activity is assigned to user
    - activity_status_changed: When activity status changes
    - document_submitted: When document is submitted for review
    - document_decision: When document is approved/rejected
    - issue_assigned: When issue is assigned to user
    - issue_status_changed: When issue status changes
    - comment_mention: When user is mentioned in comments
    
  3. Notes
    - Leverages existing notifications table from approval system
    - Uses realtime subscriptions for live updates
*/

-- Function to create notifications (reusable)
CREATE OR REPLACE FUNCTION create_pm_notification(
  p_user_id uuid,
  p_organization_id uuid,
  p_type text,
  p_entity_type text,
  p_entity_id uuid,
  p_message text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_id uuid;
BEGIN
  INSERT INTO notifications (
    user_id,
    organization_id,
    type,
    entity_type,
    entity_id,
    message,
    is_read
  ) VALUES (
    p_user_id,
    p_organization_id,
    p_type,
    p_entity_type,
    p_entity_id,
    p_message,
    false
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Trigger function for activity assignment notifications
CREATE OR REPLACE FUNCTION notify_activity_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  activity_name text;
  project_name text;
BEGIN
  -- Only notify if assignee changed and is not null
  IF (TG_OP = 'INSERT' AND NEW.assignee_user_id IS NOT NULL) OR
     (TG_OP = 'UPDATE' AND NEW.assignee_user_id IS NOT NULL AND 
      (OLD.assignee_user_id IS NULL OR OLD.assignee_user_id != NEW.assignee_user_id)) THEN
    
    -- Get activity and project names
    SELECT NEW.name INTO activity_name;
    SELECT project_name INTO project_name
    FROM retrofit_projects
    WHERE id = NEW.retrofit_project_id;
    
    -- Create notification
    PERFORM create_pm_notification(
      NEW.assignee_user_id,
      NEW.organization_id,
      'activity_assigned',
      'activity',
      NEW.id,
      'You have been assigned to activity: ' || activity_name || ' in project ' || project_name
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_activity_assignment
  AFTER INSERT OR UPDATE OF assignee_user_id ON project_activities
  FOR EACH ROW
  EXECUTE FUNCTION notify_activity_assignment();

-- Trigger function for activity status change notifications
CREATE OR REPLACE FUNCTION notify_activity_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  activity_name text;
  project_members uuid[];
BEGIN
  -- Only notify on status change
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    SELECT NEW.name INTO activity_name;
    
    -- Get all project members
    SELECT array_agg(user_id) INTO project_members
    FROM project_members
    WHERE retrofit_project_id = NEW.retrofit_project_id;
    
    -- Notify all members
    IF project_members IS NOT NULL THEN
      FOR i IN 1..array_length(project_members, 1) LOOP
        PERFORM create_pm_notification(
          project_members[i],
          NEW.organization_id,
          'activity_status_changed',
          'activity',
          NEW.id,
          'Activity "' || activity_name || '" status changed to ' || NEW.status
        );
      END LOOP;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_activity_status_change
  AFTER UPDATE OF status ON project_activities
  FOR EACH ROW
  EXECUTE FUNCTION notify_activity_status_change();

-- Trigger function for document submission notifications
CREATE OR REPLACE FUNCTION notify_document_submission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  doc_title text;
  reviewers uuid[];
BEGIN
  -- Notify when document is submitted
  IF OLD.workflow_status = 'Draft' AND NEW.workflow_status = 'Submitted' THEN
    SELECT NEW.title INTO doc_title;
    
    -- Get assigned reviewers from workflow steps
    SELECT array_agg(DISTINCT assigned_to_user_id) INTO reviewers
    FROM document_workflow_steps
    WHERE document_id = NEW.id
    AND assigned_to_user_id IS NOT NULL;
    
    -- Notify reviewers
    IF reviewers IS NOT NULL THEN
      FOR i IN 1..array_length(reviewers, 1) LOOP
        PERFORM create_pm_notification(
          reviewers[i],
          NEW.organization_id,
          'document_submitted',
          'document',
          NEW.id,
          'Document "' || doc_title || '" has been submitted for your review'
        );
      END LOOP;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_document_submission
  AFTER UPDATE OF workflow_status ON project_documents
  FOR EACH ROW
  EXECUTE FUNCTION notify_document_submission();

-- Trigger function for document decision notifications
CREATE OR REPLACE FUNCTION notify_document_decision()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  doc_title text;
  doc_creator uuid;
BEGIN
  -- Notify on approval/rejection
  IF OLD.decision = 'Pending' AND NEW.decision IN ('Approved', 'Rejected', 'Revision Requested') THEN
    -- Get document info
    SELECT pd.title, pd.created_by INTO doc_title, doc_creator
    FROM project_documents pd
    WHERE pd.id = NEW.document_id;
    
    -- Notify document creator
    PERFORM create_pm_notification(
      doc_creator,
      NEW.organization_id,
      'document_decision',
      'document',
      NEW.document_id,
      'Your document "' || doc_title || '" has been ' || NEW.decision
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_document_decision
  AFTER UPDATE OF decision ON document_workflow_steps
  FOR EACH ROW
  EXECUTE FUNCTION notify_document_decision();

-- Trigger function for issue assignment notifications
CREATE OR REPLACE FUNCTION notify_issue_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  issue_title text;
BEGIN
  -- Only notify if assignee changed and is not null
  IF (TG_OP = 'INSERT' AND NEW.assigned_to_user_id IS NOT NULL) OR
     (TG_OP = 'UPDATE' AND NEW.assigned_to_user_id IS NOT NULL AND 
      (OLD.assigned_to_user_id IS NULL OR OLD.assigned_to_user_id != NEW.assigned_to_user_id)) THEN
    
    SELECT NEW.title INTO issue_title;
    
    -- Create notification
    PERFORM create_pm_notification(
      NEW.assigned_to_user_id,
      NEW.organization_id,
      'issue_assigned',
      'issue',
      NEW.id,
      'You have been assigned to issue: ' || issue_title
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_issue_assignment
  AFTER INSERT OR UPDATE OF assigned_to_user_id ON project_issues
  FOR EACH ROW
  EXECUTE FUNCTION notify_issue_assignment();

-- Trigger function for issue status change notifications
CREATE OR REPLACE FUNCTION notify_issue_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  issue_title text;
BEGIN
  -- Only notify on status change
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    SELECT NEW.title INTO issue_title;
    
    -- Notify creator if different from updater
    IF NEW.created_by != auth.uid() THEN
      PERFORM create_pm_notification(
        NEW.created_by,
        NEW.organization_id,
        'issue_status_changed',
        'issue',
        NEW.id,
        'Issue "' || issue_title || '" status changed to ' || NEW.status
      );
    END IF;
    
    -- Notify assignee if different from updater
    IF NEW.assigned_to_user_id IS NOT NULL AND NEW.assigned_to_user_id != auth.uid() THEN
      PERFORM create_pm_notification(
        NEW.assigned_to_user_id,
        NEW.organization_id,
        'issue_status_changed',
        'issue',
        NEW.id,
        'Issue "' || issue_title || '" status changed to ' || NEW.status
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_issue_status_change
  AFTER UPDATE OF status ON project_issues
  FOR EACH ROW
  EXECUTE FUNCTION notify_issue_status_change();