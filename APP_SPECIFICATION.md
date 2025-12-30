# Smart Estimator - Complete Application Specification

## 1. APPLICATION OVERVIEW

**Smart Estimator** is a multi-tenant SaaS platform for construction and facilities management professionals. It provides three core estimation modules plus full project management capabilities.

### Core Modules:
1. **FM Estimator** - Facilities maintenance contract estimation with asset-based PPM scheduling
2. **Retrofit Estimator** - Building improvement project estimation (asset-based or BOQ mode)
3. **HK Estimator** - Housekeeping/cleaning service manpower estimation
4. **Retrofit PM** - Complete project management workspace with scheduling, budgeting, documents, and issues

### Tech Stack:
- Frontend: React 18 + TypeScript + Vite + Tailwind CSS
- Database: Supabase (PostgreSQL with RLS)
- Auth: Supabase Authentication (email/password)
- Real-time: Supabase Realtime subscriptions
- Payments: Stripe integration
- Libraries: ExcelJS, jsPDF, React Flow, Gantt-task-react, Lucide React

---

## 2. USER MANAGEMENT & AUTHENTICATION

### Authentication:
- Email/password signup with organization creation
- Auto-create owner role and free subscription on signup
- Session-based authentication with Supabase
- Profile management with full name, avatar, theme preferences

### System Roles:
**Super Admin** (hardcoded user ID in super_admins table):
- Full system access, manage industry standard library, view all orgs

### Organization Roles (4 default system roles):

**Owner:**
- All permissions across all modules
- Manage subscriptions, billing, team members
- Configure approval workflows and roles
- Full CRUD on all projects regardless of status

**Admin:**
- Create/edit all projects at any stage
- Approve projects, manage team members
- Configure settings, access all modules
- Cannot modify billing or owner-level settings

**Estimator:**
- Create/edit draft and revision_requested projects
- Submit projects for approval
- View assigned projects
- Access estimation modules
- Cannot approve or manage team

**Viewer:**
- Read-only access to all projects
- View dashboards and reports
- No create/edit permissions

**Custom Roles:**
- Organizations can create unlimited custom roles
- Granular module permissions: can_view, can_edit per module
- Used in approval workflows for routing

### Module Permission System:
Modules: dashboard, fm_estimator, retrofit_estimator, retrofit_pm, hk_estimator, inquiries, approvals, asset_library, labor_library, settings, notifications, user_profile

Each role has `can_view` and `can_edit` boolean flags per module.

### Project-Level Roles (Retrofit PM):
5 roles: Admin, Manager, Engineer, Planner, Viewer

Permissions matrix (create, edit, delete, review, approve, view) across:
- project, activities, documents, issues, members

---

## 3. DATABASE SCHEMA

### Organizations & Users:
```sql
organizations:
  id, name, industry, company_size, country, phone, website, logo_url,
  theme_color, accent_color, created_at, updated_at

organization_members:
  id, organization_id, user_id, role (owner/admin/member), joined_at

user_profiles:
  id (FK auth.users), organization_id, email, full_name, avatar_url,
  theme, custom_colors, created_at, updated_at

super_admins:
  id, user_id, granted_at, granted_by

subscriptions:
  id, organization_id, plan (free/starter/professional/enterprise),
  status, stripe_customer_id, stripe_subscription_id, current_period_start/end,
  cancel_at_period_end, created_at, updated_at

usage_tracking:
  id, organization_id, fm_projects_count, retrofit_projects_count,
  hk_projects_count, inquiries_count, last_reset_at, created_at, updated_at
```

### Projects:
```sql
fm_projects:
  id, user_id, organization_id, project_name, client_name, location,
  status (draft/pending/approved/rejected/revision_requested/archived),
  project_data (JSONB - complete project state),
  calculated_value, submission_date, pm_conversion_date,
  created_at, updated_at

retrofit_projects:
  id, user_id, organization_id, project_name, client_name, location,
  status, boq_mode (boolean), project_data (JSONB),
  calculated_value, submission_date, pm_conversion_date,
  is_pm_mode (boolean), start_date, end_date, pm_status (planning/in_progress/on_hold/completed/cancelled),
  created_at, updated_at

hk_projects:
  id, user_id, organization_id, project_name, client_name, location,
  status, project_data (JSONB), calculated_value,
  submission_date, pm_conversion_date, created_at, updated_at
```

### Inquiries:
```sql
inquiries:
  id, organization_id, client_name, contact_person, email, phone,
  inquiry_type (fm/retrofit/hk), description, estimated_value,
  status (new/qualified/quoted/won/lost/archived),
  source, priority, expected_close_date, notes,
  converted_to_project_id, converted_at, client_inquiry_reference,
  created_by, created_at, updated_at
```

### Roles & Permissions:
```sql
organization_roles:
  id, organization_id, name, description, is_system_role, created_at, updated_at

user_role_assignments:
  id, user_id, role_id, organization_id, assigned_at, assigned_by

modules:
  id, name, description, category (core/management/settings/library)

role_module_permissions:
  id, role_id, module_id, can_view, can_edit
```

### Approval Workflows:
```sql
approval_workflows:
  id, organization_id, name, description, is_active, is_default,
  trigger_conditions (JSONB), created_at, updated_at

approval_workflow_canvas:
  id, workflow_id, nodes (JSONB - array of node objects),
  edges (JSONB - array of edge objects)

approval_workflow_rules:
  id, workflow_id, field_name, operator, value, logic_operator (and/or),
  priority, created_at

project_approvals:
  id, project_id, project_type (fm/retrofit/hk), workflow_id,
  current_node_id, status (draft/pending/approved/rejected/revision_requested),
  submitted_by, submitted_at, completed_at, metadata (JSONB),
  created_at, updated_at

project_approval_history:
  id, project_approval_id, node_id, step_name, user_id, role_id,
  action (submitted/approved/rejected/revision_requested/delegated/commented),
  comments, metadata (JSONB), created_at
```

### Asset & Labor Libraries:
```sql
industry_standard_asset_library:
  id, category, asset_type_code, asset_name, description,
  maintenance_type, standard_code (unique), created_at, updated_at

industry_standard_ppm_tasks:
  id, asset_id, task_name, frequency (daily/weekly/monthly/quarterly/semiannual/annual),
  estimated_hours, required_skills (text[]), created_at

organization_asset_libraries:
  id, organization_id, category, asset_name, ppm_tasks (JSONB array),
  reactive_maintenance (JSONB), notes, created_at, updated_at

organization_labor_libraries:
  id, organization_id, technician_type, trade, skill_tags (text[]),
  base_rate, overtime_rate, currency, can_supervise, deployment_model (resident/rotating),
  notes, created_at, updated_at

asset_matching_corrections:
  id, organization_id, user_input, normalized_input, matched_asset_id,
  correction_count, last_corrected_by, created_at, updated_at
```

### Retrofit PM Tables:
```sql
project_members:
  id, project_id, user_id, role (admin/manager/engineer/planner/viewer),
  added_by, added_at

project_permissions:
  id, role_name (matches project_members.role), resource_type,
  can_create, can_edit, can_delete, can_review, can_approve, can_view

project_activities:
  id, project_id, name, description, phase,
  planned_start_date, planned_end_date, actual_start_date, actual_end_date,
  duration_days, estimated_hours, status (not_started/in_progress/completed/on_hold),
  progress_percent, assigned_to (user_id), created_by,
  created_at, updated_at

activity_dependencies:
  id, activity_id, depends_on_activity_id,
  dependency_type (finish_to_start/start_to_start/finish_to_finish/start_to_finish),
  lag_days, created_at

activity_templates:
  id, organization_id, template_name, activities (JSONB array),
  dependencies (JSONB array), created_at, updated_at

project_documents:
  id, project_id, document_name, document_type, version, file_path,
  current_version, status (draft/under_review/approved/rejected/archived),
  uploaded_by, created_at, updated_at

document_versions:
  id, document_id, version_number, file_path, changes_description,
  uploaded_by, created_at

document_workflow_steps:
  id, document_id, step_number, reviewer_user_id,
  status (pending/approved/rejected), comments, reviewed_at

document_comments:
  id, document_id, user_id, comment, parent_comment_id, created_at

project_issues:
  id, project_id, issue_type (defect/query/change_request/rfi),
  title, description, priority (low/medium/high/critical),
  status (open/in_progress/resolved/closed),
  reported_by, assigned_to, related_activity_id, related_document_id,
  resolution, resolved_at, created_at, updated_at

issue_comments:
  id, issue_id, user_id, comment, created_at

activity_time_tracking:
  id, activity_id, user_id, date, hours_worked, description, created_at
```

### Budget Management:
```sql
budget_baselines:
  id, project_id, baseline_version, total_budget, labor_budget,
  material_budget, equipment_budget, subcontractor_budget, other_budget,
  approved_by, approved_at, notes, is_current, created_at

activity_budget_allocations:
  id, baseline_id, activity_id, allocated_amount, category,
  notes, created_at, updated_at

actual_costs:
  id, project_id, activity_id, cost_type (labor/material/equipment/subcontractor/asset/overhead/other),
  description, amount, date, status (draft/pending_review/approved/rejected),
  submitted_by, reviewed_by, reviewed_at, review_comments,
  created_at, updated_at

labor_cost_entries:
  id, actual_cost_id, technician_name, trade, hours_worked,
  hourly_rate, overtime_hours, overtime_rate, total_cost

material_cost_entries:
  id, actual_cost_id, material_name, quantity, unit, unit_cost, total_cost

equipment_cost_entries:
  id, actual_cost_id, equipment_name, rental_duration, rental_rate,
  purchase_cost, maintenance_cost, total_cost

subcontractor_cost_entries:
  id, actual_cost_id, subcontractor_name, scope_of_work, contract_amount,
  invoice_number, invoice_date, payment_status

asset_cost_entries:
  id, actual_cost_id, asset_name, quantity, unit_cost, installation_cost,
  warranty_cost, total_cost

budget_change_orders:
  id, project_id, change_order_number, title, description,
  total_change_amount, status (draft/submitted/approved/rejected),
  submitted_by, approved_by, submitted_at, approved_at, created_at, updated_at

change_order_line_items:
  id, change_order_id, description, quantity, unit_cost, total_cost, category

budget_revisions:
  id, project_id, previous_baseline_id, new_baseline_id,
  reason, revised_by, revision_date

cost_forecasts:
  id, project_id, activity_id, forecast_date, estimated_cost_to_complete,
  forecast_at_completion, variance_at_completion, created_by, created_at

cost_deletion_audit:
  id, actual_cost_id, cost_data (JSONB - snapshot before deletion),
  deleted_by, deletion_reason, deleted_at
```

### Notifications & Settings:
```sql
user_notifications:
  id, user_id, type (approval_required/approval_approved/approval_rejected/revision_requested/
                     document_review/issue_assigned/activity_assigned/cost_approved/cost_rejected/
                     missing_asset_match/system_announcement),
  title, message, link, is_read, created_at

pricing_config:
  id, organization_id, labor_markup, material_markup, equipment_markup,
  overhead_percent, profit_margin, currency, created_at, updated_at

dashboard_config:
  id, user_id, active_view (estimation/bd/pm), widget_layout (JSONB),
  created_at, updated_at

workspace_preferences:
  id, organization_id, primary_color, accent_color, logo_url,
  created_at, updated_at

audit_log:
  id, organization_id, user_id, action_type, entity_type, entity_id,
  changes (JSONB), ip_address, user_agent, created_at
```

### Key Indexes:
- Foreign keys: organization_id, user_id, project_id, activity_id on all relevant tables
- Status fields for filtering
- Created_at for time-based queries
- Unique constraints: email, standard_code, etc.

---

## 4. FEATURE SPECIFICATIONS

### 4.1 FM ESTIMATOR

**Project Data Structure (JSONB):**
```typescript
{
  projectInfo: { projectName, clientName, location },
  site: {
    contractType: 'fully_comprehensive' | 'semi_comprehensive' | 'cost_plus',
    contractDuration: number,
    annualLeavePercent: number,
    sickLeavePercent: number,
    shiftLengthHours: number
  },
  assets: [{
    id, category, assetName, quantity,
    responsibility: 'in_house' | 'subcontract',
    ppmTasks: [{
      id, taskName, frequency, hoursPerVisit, technicianTypeId
    }],
    reactiveMaintenance: {
      isMonthlyRate: boolean,
      reactiveCallsPercent: number,
      avgHoursPerCall: number,
      technicianTypeId: string
    }
  }],
  deployedTechnicians: [{
    id, technicianTypeId, deploymentModel: 'resident' | 'rotating',
    quantity, monthlyRate, overtimeRate
  }],
  materials: [{ id, name, annualQuantity, unitCost }],
  consumables: [{ id, name, annualQuantity, unitCost }],
  specializedServices: [{ id, serviceName, annualCost }],
  supervisors: [{ id, name, monthlySalary, quantity }],
  costs: {
    overheadsPercent, profitMarginPercent
  }
}
```

**Calculations:**
1. **PPM Hours:** For each asset: Σ(task hours × annual frequency) × quantity
2. **Reactive Hours:** Asset quantity × reactive% × avg hours
3. **Total Hours by Technician:** Group by technician type, sum all hours
4. **FTE Calculation:**
   - Effective days = 365 - (annual leave + sick leave + holidays + weekly offs)
   - Effective hours/year = Effective days × shift length
   - Active FTE = Total annual hours / Effective hours per year
   - Reliever FTE = Active FTE × (leave% + sick%)
   - Total headcount = Active FTE + Reliever FTE
5. **Costs:**
   - Manpower = Σ(FTE × monthly rate × 12) + overtime
   - Materials = Σ(quantity × unit cost)
   - Supervision = Σ(supervisor count × salary × 12)
   - Specialized services = Σ annual costs
   - Subtotal = Manpower + Materials + Supervision + Services
   - Overheads = Subtotal × overhead%
   - Total cost = Subtotal + Overheads
   - Profit = Total cost × profit%
   - Selling price = Total cost + Profit

**UI Components:**
- **Asset Inventory:** Table with add/edit/delete, duplicate detection modal
- **Asset Browser:** Modal to browse/search industry standard library
- **Deployed Technicians:** List with resident/rotating selection
- **Materials/Consumables Catalogs:** CRUD tables
- **Specialized Services:** Simple list
- **Supervisory Config:** Count and salary inputs
- **Results Panel:** Floating card showing: annual contract value, monthly value, manpower count, asset count

**Export Features:**
- Excel: Multi-sheet (Summary, Assets, PPM Schedule, Manpower, Materials, Costs)
- PDF: Professional format with cover page, tables, cost breakdown

### 4.2 RETROFIT ESTIMATOR

**Two Modes:**

**Asset-Based Mode:**
```typescript
{
  projectInfo: { projectName, clientName, location, description },
  assets: [{
    id, category, assetName, quantity, unitCost,
    installationCost, warrantyYears
  }],
  labor: [{
    id, laborType, trade, quantity, durationDays, dailyRate
  }],
  materials: [{ id, name, quantity, unit, unitCost }],
  subcontractors: [{ id, name, scopeOfWork, contractValue }],
  equipment: [{ id, name, rentalDays, dailyRate }],
  logistics: [{ id, description, cost }],
  phases: [{
    id, phaseName, startDate, endDate, description
  }],
  costs: {
    overheadsPercent, performanceBondPercent, insurancePercent,
    warrantyPercent, riskContingencyPercent, pmAndGeneralsPercent,
    profitMarginPercent
  }
}
```

**BOQ Mode:**
```typescript
{
  projectInfo: { ... },
  boqLineItems: [{
    id, itemCode, description, unit, quantity,
    laborRate, materialRate, equipmentRate, subcontractorRate,
    total (auto-calculated)
  }],
  costs: { same as above }
}
```

**Calculations:**
- Base cost = Σ(assets + labor + materials + subcontractors + equipment + logistics) OR Σ(BOQ line totals)
- Overheads = Base × overhead%
- Bond = Base × bond%
- Insurance = Base × insurance%
- Warranty = Base × warranty%
- Contingency = Base × contingency%
- PM & Generals = Base × pm%
- Subtotal = Base + all above
- Profit = Subtotal × profit%
- Grand total = Subtotal + Profit

**UI Components:**
- Mode toggle (Asset-based vs BOQ)
- Asset-based: AssetsList, LaborLibrary, MaterialsCatalog, SubcontractorsConfig
- BOQ Mode: BOQLineItemTable (editable grid), BOQImportModal (Excel import)
- ProjectPhases: Timeline with date ranges
- ManpowerPlanning: Technician allocation to phases
- CostConfig: All markup/overhead inputs
- ResultsPanel: Cost breakdown tree

**Excel Import/Export:**
- Import BOQ from standard template (columns: Item Code, Description, Unit, Qty, Labor Rate, Material Rate, etc.)
- Export multi-sheet workbook with all data

### 4.3 HK ESTIMATOR

**Project Data:**
```typescript
{
  projectInfo: { projectName, clientName, location },
  site: {
    estimationMode: 'output_base' | 'input_base',
    totalCoverageDaysPerYear: 365,
    annualLeaveDays: 30,
    sickLeaveDays: 10,
    publicHolidayDays: 10,
    weeklyOffDays: 52,
    shiftLengthHours: 12,
    inputBaseCleaners: 0 // used if input_base mode
  },
  productivity: {
    manualDetailSqmPerShift: 200,
    manualGeneralSqmPerShift: 300
  },
  areas: [{
    id, areaName, sqm,
    bucket: 'Manual-Detail' | 'Manual-General' | 'Machine-Detail' | 'Machine-General',
    frequency: 'Daily' | 'Weekly' | 'Monthly'
  }],
  machines: [{
    id, machineName, cost, quantity, lifeYears,
    maintenancePercent, sqmPerHour, effectiveHoursPerShift
  }],
  costs: {
    cleanerSalary, benefitsAllowances, supervisorSalary, supervisorCount,
    consumablesPerCleanerPerMonth, ppePerCleanerPerYear,
    overheadsPercent, profitMarkupPercent
  }
}
```

**Calculations:**
1. **Working Days:** 365 - leaves - sick - holidays - weekly offs
2. **Coverage Factor:** Total coverage days / Working days
3. **Daily SQM by Bucket:** Σ(area sqm × frequency factor) grouped by bucket
   - Daily = 1, Weekly = 1/7, Monthly = 1/30
4. **Machine Coverage:** Σ(machine sqm/hr × effective hours × quantity)
5. **Manual Cleaners Required:**
   - Detail cleaners = Manual-Detail SQM / manualDetailSqmPerShift
   - General cleaners = Manual-General SQM / manualGeneralSqmPerShift
   - Active cleaners = Detail + General + (Machine cleaners from capacity calc)
6. **Reliever Cleaners:** Active × (Coverage factor - 1)
7. **Total Cleaners:** Active + Relievers
8. **Costs:**
   - Manpower = Total × (Salary + Benefits) × 12
   - Supervision = Supervisor count × Salary × 12
   - Consumables = Total × Per cleaner cost × 12
   - PPE = Total × Annual PPE
   - Machines = Σ[(Cost / Life) + (Cost × Maintenance%) ] per machine
   - Direct = Manpower + Supervision + Consumables + PPE + Machines
   - Overheads = Direct × Overhead%
   - Total cost = Direct + Overheads
   - Profit = Total × Markup%
   - Selling price = Total + Profit

**UI Components:**
- Site Config: Mode selection, leave days, shift hours
- Productivity Config: SQM per shift rates
- Areas Table: CRUD with bucket and frequency dropdowns
- Machines List: CRUD with cost and capacity fields
- Costs Config: All cost inputs
- HK Summary: Cards showing cleaners required, shifts, coverage, annual value

### 4.4 RETROFIT PM WORKSPACE

**Tabs:**
1. **Activities** - Gantt chart and task management
2. **Budget** - Cost tracking and budget management
3. **Documents** - Document repository with workflow
4. **Issues** - RFI/defect tracking
5. **Team** - Member management
6. **Settings** - Project configuration

**Activities Tab:**
- **Gantt Chart (Modal):** Visual timeline with dependencies, critical path highlighting
- **Activities Table:** Columns: Name, Phase, Planned Start/End, Actual Start/End, Duration, Status, Progress%, Assigned To
- **Actions:** Add activity, edit, delete, add dependency, view dependencies
- **Dependency Types:** FS (Finish-to-Start), SS (Start-to-Start), FF (Finish-to-Finish), SF (Start-to-Finish)
- **Lag Days:** Positive (delay) or negative (fast-track)
- **Auto-scheduling:** When activity dates change, recalculate dependent activities:
  - FS: Successor start = Predecessor end + lag days
  - SS: Successor start = Predecessor start + lag days
  - FF: Successor end = Predecessor end + lag days
  - SF: Successor end = Predecessor start + lag days
- **Progress Tracking:** Manual % entry or auto-calculate from time tracking
- **Filters:** Phase, Status, Assigned user, Date range

**Budget Tab:**
- **Budget Overview Card:** Planned, Actual, Committed, Pending, Remaining, Variance
- **Activity Budget Grid:** Table showing per-activity budget allocation vs actual
- **Log Cost Buttons:** Labor, Material, Equipment, Subcontractor, Asset, Overhead, Other
- **Cost Entries Table:** All logged costs with filters (date range, type, status, activity)
- **Cost Review Workflow:**
  - Engineer logs cost (draft)
  - Submit for review (pending_review)
  - Manager/Admin approves or rejects
  - Approved costs add to actuals
  - Rejection returns to draft with comments
- **Budget Baseline:** Lock initial budget, track changes with change orders
- **Forecast:** Calculate forecast at completion based on burn rate

**Cost Entry Modals:**
- **Labor:** Technician name, trade, hours, hourly rate, overtime
- **Material:** Material name, quantity, unit, unit cost
- **Equipment:** Equipment name, rental duration/purchase, rates
- **Subcontractor:** Subcontractor name, scope, contract amount, invoice details
- **Asset:** Asset name, quantity, unit cost, installation, warranty
- **Overhead:** Description, amount
- **Other:** Description, amount

**Documents Tab:**
- **Document List:** Table with Name, Type (Drawing/Specification/Report/Contract/Photo), Version, Status, Uploaded By, Date
- **Upload:** Multi-file upload with drag-drop
- **Versioning:** New version replaces current, stores history
- **Approval Workflow:** Assign reviewers per document, collect approvals/rejections
- **Comments:** Threaded comments per document
- **Actions:** View, Download, Delete (with audit), Approve/Reject (if reviewer)

**Issues Tab:**
- **Issue List:** Table with Issue Type, Title, Priority, Status, Assigned To, Created Date
- **Issue Types:** Defect, Query, Change Request, RFI
- **Priority:** Low, Medium, High, Critical
- **Status:** Open, In Progress, Resolved, Closed
- **Create Issue:** Form with type, title, description, priority, assigned user, linked activity/document
- **Issue Detail View:** Full description, comments, attachments, resolution notes
- **Comments:** Threaded discussion per issue

**Team Tab:**
- **Member List:** Table with Name, Email, Role, Added Date
- **Add Member:** Select from organization members, assign project role
- **Role Permissions:** Matrix showing what each role can do

**Settings Tab:**
- **Project Details:** Name, client, location, description
- **Dates:** Project start/end dates
- **PM Status:** Planning, In Progress, On Hold, Completed, Cancelled
- **Convert from Estimate:** Button to import budget baseline from approved estimate

**Real-time Updates:**
- All tables subscribe to Supabase Realtime
- Updates appear live when other users make changes
- Optimistic updates for better UX

### 4.5 INQUIRIES MODULE

**Inquiry Fields:**
- Client name, contact person, email, phone
- Inquiry type (FM/Retrofit/HK)
- Description, estimated value
- Status: New → Qualified → Quoted → Won/Lost/Archived
- Source, priority, expected close date, notes
- Client inquiry reference (linked to projects)

**Status Workflow:**
1. **New:** Initial capture
2. **Qualified:** Validated as legitimate opportunity
3. **Quoted:** Estimate created and sent
4. **Won:** Converted to project
5. **Lost:** Did not win
6. **Archived:** Closed without action

**One-Click Conversion:**
- "Convert to Project" button on inquiry detail
- Choose project type (FM/Retrofit/HK)
- Auto-populates project with client name and description
- Marks inquiry as quoted/won
- Links project back to inquiry

**Filters:** Status, Type, Date range, Assigned user

### 4.6 APPROVAL WORKFLOWS

**Workflow Builder (React Flow Canvas):**
- **Node Types:**
  - **Start Node:** Single start point
  - **Approval Node:** Requires approval from users with specific role
    - Config: Role ID, Allow multiple approvers, Require all approvals
  - **Condition Node:** Branch based on rules
    - Config: Field, Operator (>, <, =, contains), Value, True/False paths
  - **End Node:** Workflow completion
- **Edges:** Connect nodes, directional flow
- **Canvas Controls:** Zoom, pan, auto-layout, save

**Workflow Configuration:**
- Name, description
- Active/Inactive toggle
- Default workflow flag (used if no rules match)
- Trigger Rules: Define when workflow applies
  - Field: project_value, project_type, estimator_id, client_type
  - Operator: greater_than, less_than, equals, contains
  - Value: comparison value
  - Priority: Higher priority rules checked first

**Workflow Execution:**
1. User clicks "Submit for Approval" on project
2. System evaluates trigger rules to find matching workflow
3. Creates project_approvals record at start node
4. Advances to first approval node
5. Creates notifications for all users with assigned role
6. Approvers see project in their "Pending Approvals" list
7. Approver clicks Approve/Reject/Request Revision
8. System records action in approval history
9. System advances workflow:
   - Approved: Move to next node via "approved" edge
   - Rejected: Move to end, set project status to rejected
   - Revision Requested: Move to end, set project status to revision_requested
10. If approval node has multiple approvers:
    - Wait for all to approve (if "require all" is checked)
    - OR advance when first approves
11. If condition node: Evaluate condition, take true or false path
12. When end node reached: Set project status to approved/rejected
13. Update project status field to match approval status
14. Notify submitter of final decision

**Approval Dashboard:**
- My Pending Approvals: Projects awaiting my approval
- My Submissions: Projects I submitted
- All Approvals (Admin): All pending approvals in org
- Filters: Status, Date range, Project type

**Permissions:**
- View approvals: Based on module permissions
- Create/Edit workflows: Admin, Owner only
- Approve projects: Must have role assigned in approval node + can_approve permission

### 4.7 DASHBOARDS

**Three Dashboard Views:**

**Estimation Dashboard:**
- Total Projects (FM, Retrofit, HK counts)
- Total Value (sum of all project values)
- Average Project Value
- Projects by Status (donut chart)
- Monthly Trends (line chart - projects created per month)
- Recent Projects (list of 10 most recent)
- Top 5 Clients by Value

**Business Development Dashboard:**
- Total Inquiries
- Conversion Rate (Won / Total qualified)
- Pipeline Value (sum of qualified + quoted inquiries)
- Funnel Chart (New → Qualified → Quoted → Won)
- Inquiries by Type (donut chart)
- Monthly Inquiry Trends
- Win/Loss Ratio
- Average Deal Size

**PM Dashboard:**
- Active Projects
- Projects by PM Status (donut chart)
- Budget Performance (bar chart - budget vs actual by project)
- Overdue Activities Count
- This Week's Deliverables
- Budget at Risk (projects over budget)
- Critical Path Items

**Customization:**
- Drag-drop widget repositioning (React Grid Layout)
- Show/hide widgets
- Per-user configuration saved to dashboard_config

### 4.8 GLOBAL SEARCH

**⌘K to open search modal**

Search across:
- Projects (all types) - matches name, client, location
- Inquiries - matches client, description
- Team members - matches name, email
- Documents - matches name, description
- Issues - matches title, description

Results grouped by entity type, click to navigate.

### 4.9 ASSET & LABOR LIBRARIES

**Asset Library Manager:**
- Organization-specific asset library
- CRUD operations: Add, edit, duplicate, delete
- Bulk import from Excel (columns: Category, Asset Name, PPM Tasks JSON, Reactive JSON)
- Browse Industry Standard Library: Modal with search/filter, click to copy to org library
- AI-Enhanced Matching:
  - When user types asset name, search industry standard library
  - Show top 3 matches with similarity score
  - User can accept suggestion or override
  - System learns from corrections (stores in asset_matching_corrections)
  - Future suggestions improve based on past choices

**Labor Library Manager:**
- Technician profile management
- Fields: Type name, Trade (HVAC, Electrical, Plumbing, etc.), Base rate, OT rate, Currency
- Skill tags (multi-select): Refrigeration, Chillers, AHU, Pumps, Motors, Controls, etc.
- Can Supervise checkbox
- Deployment model (Resident/Rotating)
- Export/Import via Excel

**Skill Tag System:**
- Pre-defined list of skills per trade
- Used for smart matching (suggest technicians for PPM tasks based on required skills)
- Filter technicians by skill in deployment

---

## 5. BUSINESS RULES & VALIDATIONS

### Project Status Transitions:
**Valid Transitions:**
```
draft → pending (submit for approval)
pending → approved (workflow completes with approval)
pending → rejected (workflow completes with rejection)
pending → revision_requested (approver requests changes)
revision_requested → pending (resubmit after revisions)
approved → archived (manual archive by admin)
draft → archived (manual archive)
```

**Invalid Transitions:** Any other combinations

**Permissions:**
- Draft/Revision: Owner, Admin, Estimator (if assigned)
- Pending: Only approvers (via workflow)
- Approved/Rejected: Cannot edit (unless admin overrides)
- Archived: Cannot edit

### Usage Limits (Freemium):
Check on project creation:
- Free plan: Max 3 projects total across all types
- Free plan: Max 5 inquiries per month (resets on subscription.current_period_start)
- If limit reached: Show modal with upgrade prompt
- Paid plans: Unlimited

Track usage in usage_tracking table, increment on create, decrement on delete.

### Data Validation:
- Project name: Required, max 255 chars
- Client name: Required, max 255 chars
- Email: Valid email format
- Phone: Optional, numeric
- Dates: End date >= Start date
- Quantities: Must be > 0
- Rates/Costs: Must be >= 0
- Percentages: Must be 0-100 (or 0-1000 for very high markups)

### Duplicate Detection:
- Assets: Warn if asset name is very similar (Levenshtein distance < 3) to existing asset in project
- Show modal: "Similar asset exists: [Name]. Add anyway or cancel?"

### RLS Policies:
Every table with organization_id:
```sql
-- Users can only access data from their organization
USING (organization_id IN (
  SELECT organization_id FROM organization_members
  WHERE user_id = auth.uid()
))
```

Projects:
```sql
-- Select: Must be member of org OR super admin
-- Insert: Must be member of org with module permissions
-- Update: Must be member of org with edit permissions AND project in editable status
-- Delete: Admin/Owner only
```

Approval tables:
```sql
-- Select: Members can see their org's workflows and approvals
-- Insert/Update: Admin/Owner for workflows, system functions for approval execution
-- process_approval_action function: Check user has approval role for current node
```

PM tables (activities, documents, issues):
```sql
-- Must be project member with appropriate role permissions
-- Check project_permissions table for resource_type and action
```

---

## 6. UI/UX REQUIREMENTS

### Design System:
- **Colors:** Neutral base (slate), customizable primary/accent per organization
- **Typography:** System fonts, 3 weights max, 150% line height for body, 120% for headings
- **Spacing:** 8px grid system
- **Components:** Modern, clean, professional
- **Icons:** Lucide React (consistent style)
- **Forms:** Validated inputs, inline error messages, clear labels
- **Tables:** Sortable columns, pagination, filters, row actions
- **Modals:** Centered, backdrop blur, ESC to close
- **Toasts:** Success/error notifications (top-right)
- **Loading States:** Spinners for async operations
- **Empty States:** Helpful illustrations and CTAs

### Layout:
- **Sidebar:** Left side, collapsible, sections: Estimators, PM, Management, Libraries, Settings
- **Header:** Organization name/logo, project switcher, global search, notifications bell, user menu
- **Content Area:** Full height, scrollable, breadcrumbs at top
- **Floating Panels:** Results panel (estimators) floats at bottom-right, collapsible

### Responsive Design:
- Desktop-first (primary use case is desktop)
- Tablet: Sidebar collapses to icons only
- Mobile: Hamburger menu, stacked layouts, simplified tables

### Accessibility:
- Keyboard navigation
- Focus indicators
- ARIA labels
- Color contrast WCAG AA
- Screen reader support

### Animations:
- Smooth transitions (200ms)
- Page loads: Fade in
- Modals: Scale + fade
- Toasts: Slide in from right
- No excessive motion

---

## 7. EXPORT FEATURES

### Excel Exports:

**FM Projects:**
- Sheet 1: Project Summary (client, contract value, duration, headcount)
- Sheet 2: Asset Inventory (all assets with PPM tasks)
- Sheet 3: PPM Schedule (monthly calendar view)
- Sheet 4: Manpower Deployment (FTE breakdown by technician type)
- Sheet 5: Materials & Consumables
- Sheet 6: Cost Breakdown (line-by-line)

**Retrofit Projects:**
- Sheet 1: Project Summary
- Sheet 2: BOQ (line items with quantities and rates) OR Assets
- Sheet 3: Labor Deployment
- Sheet 4: Materials List
- Sheet 5: Equipment & Logistics
- Sheet 6: Cost Breakdown
- Sheet 7: Phase Schedule

**HK Projects:**
- Sheet 1: Project Summary
- Sheet 2: Area Schedule (all areas with frequencies)
- Sheet 3: Manpower Calculation (detailed FTE calc)
- Sheet 4: Machine Requirements
- Sheet 5: Cost Analysis

**Formatting:**
- Professional styling: Headers bold, borders, alternating row colors
- Numeric formatting: Currency with thousand separators
- Date formatting: DD-MMM-YYYY
- Merged cells for section headers
- Auto-column widths
- Organization logo in header (if available)

**Free Plan Watermark:**
- If subscription is free: Add "Generated by Smart Estimator - Upgrade to remove watermark" to footer

### PDF Exports:

**Cover Page:**
- Organization logo (center top)
- Project name (large, centered)
- Client name
- Date prepared
- Prepared by (user name)
- Organization name

**Content Pages:**
- Page numbers (bottom right)
- Tables with jspdf-autotable
- Section headers with background color
- Cost breakdown trees
- Summary totals in highlighted boxes
- Charts (if feasible - can render as images)

**Footer:**
- Organization name, phone, email, website
- Terms & conditions (if configured)

**Free Plan Watermark:**
- Diagonal text "SAMPLE - UPGRADE TO REMOVE WATERMARK" on each page

---

## 8. NOTIFICATIONS

**Notification Types:**

1. **approval_required:** "Project [Name] requires your approval"
   - Link to approval details

2. **approval_approved:** "Your project [Name] has been approved by [Approver]"
   - Link to project

3. **approval_rejected:** "Your project [Name] has been rejected by [Approver]"
   - Link to project with rejection comments

4. **revision_requested:** "[Approver] requested revisions to [Project Name]"
   - Link to project

5. **document_review:** "[User] requested your review of document [Name]"
   - Link to document in PM workspace

6. **issue_assigned:** "You have been assigned issue [Title] in [Project]"
   - Link to issue

7. **activity_assigned:** "You have been assigned activity [Name] in [Project]"
   - Link to activity

8. **cost_approved:** "Your cost entry of [Amount] has been approved"
   - Link to cost entry

9. **cost_rejected:** "Your cost entry of [Amount] has been rejected: [Reason]"
   - Link to cost entry

10. **missing_asset_match:** "No match found for asset '[Name]' - please review"
    - Link to asset library

11. **system_announcement:** General system messages

**Notification UI:**
- Bell icon in header with unread count badge
- Click to open dropdown with recent 10 notifications
- Mark as read on click
- "View All" link to full notifications page
- Notifications page: Table with filters (read/unread, type, date)

**Notification Delivery:**
- In-app: Always
- Email: Future enhancement (not in MVP)
- Push: Future enhancement

---

## 9. SETTINGS MODULE

**Tabs:**

1. **Organization Profile:**
   - Name, industry, company size, country, phone, website
   - Logo upload (Supabase storage)
   - Save button

2. **Team Members:**
   - Table: Name, Email, Role, Joined Date
   - Add Member: Email (must exist in auth.users), assign role
   - Edit Role: Change user's role
   - Remove Member: Delete from organization_members (soft delete - keep in audit log)
   - Invite Complementary Users (Free viewers): Add viewer accounts that don't count toward license (requires paid plan)

3. **Roles & Permissions:**
   - System Roles: View-only (cannot edit owner, admin, estimator, viewer)
   - Custom Roles: CRUD custom roles
   - Module Permissions Editor: Matrix of modules × permissions (can_view, can_edit)
   - Role Assignment: Assign roles to users (separate from main team table)

4. **Approval Workflows:**
   - List of workflows with Active/Default badges
   - Create/Edit Workflow: Opens workflow canvas
   - Activate/Deactivate toggle
   - Set as Default
   - Delete workflow (confirm modal)

5. **Pricing Configuration:**
   - Default markup percentages for estimates
   - Labor, material, equipment, overhead, profit margin
   - Currency selection
   - These become defaults when creating new projects (can override per project)

6. **Workspace Customization:**
   - Primary color picker
   - Accent color picker
   - Logo upload
   - Preview changes live

7. **Subscription & Billing:**
   - Current plan display (Free/Starter/Professional/Enterprise)
   - Usage summary: Projects used, inquiries this month
   - Upgrade/Downgrade buttons (Stripe Checkout)
   - Billing history table (future)
   - Cancel subscription (confirm modal)

8. **Usage Limits (Free Plan Only):**
   - Progress bars: X/3 projects, Y/5 inquiries this month
   - Upgrade CTA

---

## 10. AUTHENTICATION FLOWS

### Signup:
1. Form: Email, Password, Organization Name, Industry, Company Size, Country, Phone (optional), Website (optional)
2. Submit → Create auth user (Supabase Auth)
3. Trigger function:
   - Create user_profile
   - Create organization
   - Add user to organization_members as owner
   - Create system roles for org (Owner, Admin, Estimator, Viewer)
   - Assign user to Owner role
   - Create default subscription (free plan)
   - Initialize usage_tracking
4. Redirect to Home page

### Login:
1. Form: Email, Password
2. Submit → Supabase Auth signInWithPassword
3. Fetch user profile and organization
4. Load organization context (store in React Context)
5. Redirect to Home page

### Session Management:
- Supabase handles session tokens
- Check auth.getUser() on app load
- If no session: Redirect to login
- If session: Load user profile and org context
- Store orgId, userId, userRole in context for easy access

### Logout:
- Call supabase.auth.signOut()
- Clear context
- Redirect to login

---

## 11. SUPER ADMIN FEATURES

**Access:** Only users in super_admins table

**Capabilities:**
1. View all organizations (bypass RLS)
2. View all projects across all orgs
3. Manage industry standard asset library (add/edit/delete assets and PPM tasks)
4. Override any permission check
5. Access super admin dashboard:
   - Total organizations
   - Total users
   - Total projects (by type)
   - Revenue metrics (subscription plans)
   - Usage statistics
6. Impersonate organization (future): View app as specific org

**UI:**
- Super Admin menu item in sidebar (only visible to super admins)
- Industry Standard Library manager: Full CRUD on industry_standard_asset_library and industry_standard_ppm_tasks
- Organization list: Table with all orgs, click to view details

---

## 12. STRIPE INTEGRATION

**Setup:**
- Stripe account with test/live API keys
- Environment variables: VITE_STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY (in Edge Function)
- Products: Free (no Stripe), Starter, Professional, Enterprise
- Prices: Monthly and Annual options

**Checkout Flow:**
1. User clicks "Upgrade" in settings or when limit reached
2. Modal shows plan options with features comparison
3. User selects plan and billing cycle
4. Call Edge Function: create-checkout-session
   - Input: priceId, organizationId
   - Creates Stripe checkout session with success/cancel URLs
   - Returns session URL
5. Redirect to Stripe Checkout (hosted page)
6. User enters payment info
7. On success: Redirects back to app
8. Webhook handles checkout.session.completed:
   - Update subscription table with stripe_customer_id, stripe_subscription_id
   - Set plan to selected tier
   - Set status to active
   - Set current_period_start/end

**Webhook Events:**
- invoice.payment_succeeded: Renewal successful
- invoice.payment_failed: Update status to past_due, notify user
- customer.subscription.deleted: Update status to canceled

**Subscription Management:**
- View current plan and billing date
- Change plan: Create new checkout session for upgrade/downgrade
- Cancel subscription: Call Stripe API to cancel at period end
- Reactivate: If canceled, option to reactivate before period ends

---

## 13. REAL-TIME FEATURES

**Supabase Realtime Channels:**

Subscribe to changes on:
- `project_activities` (Retrofit PM)
- `actual_costs` (Budget tracking)
- `project_documents` (Document updates)
- `project_issues` (Issue updates)
- `user_notifications` (New notifications)

**Implementation:**
```typescript
// In PM Workspace
useEffect(() => {
  const channel = supabase
    .channel('project_updates')
    .on('postgres_changes',
        { event: '*', schema: 'public', table: 'project_activities', filter: `project_id=eq.${projectId}` },
        (payload) => {
          // Update local state with new/updated/deleted activity
        })
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}, [projectId]);
```

**User Experience:**
- Changes appear live without refresh
- Optimistic updates: UI updates immediately, syncs in background
- Conflict resolution: Last write wins (can enhance with version tracking)
- Visual indicators: "Updated by [User] just now" toast

---

## 14. KEY PAGES & ROUTES

**Public Routes:**
- `/login` - Login/Signup page

**Protected Routes (require auth):**
- `/` - Home dashboard
- `/fm-estimator` - FM Estimator workspace
- `/retrofit-estimator` - Retrofit Estimator workspace
- `/hk-estimator` - HK Estimator workspace (future - not implemented yet)
- `/retrofit-pm` - Retrofit PM project list
- `/retrofit-pm/:projectId` - Retrofit PM workspace
- `/inquiries` - Inquiries list
- `/approvals` - Approval management
- `/dashboard` - Analytics dashboard
- `/asset-library` - Asset library manager
- `/labor-library` - Labor library manager
- `/settings` - Settings (tabbed)
- `/profile` - User profile
- `/notifications` - Notifications list

**Super Admin Routes:**
- `/super-admin` - Super admin dashboard
- `/super-admin/industry-library` - Manage industry standard assets

**Navigation:**
- React Router for client-side routing
- Programmatic navigation after actions (e.g., save project → navigate to list)
- Breadcrumbs on all pages
- Back button where contextually appropriate

---

## 15. ERROR HANDLING

**Frontend:**
- Try-catch around all async operations
- Display user-friendly error messages in toasts
- Log errors to console (future: send to monitoring service)
- Validation errors: Inline below form fields
- Network errors: "Connection lost, please try again"
- Permission errors: "You don't have permission to perform this action"

**Backend (Database Functions):**
- Return structured errors: `{ success: false, error: "Message" }`
- Catch exceptions in functions, return error instead of throwing
- RLS errors: Return 403, show "Access denied" to user

**Edge Functions:**
- Wrap entire function in try-catch
- Return JSON with error field
- HTTP status codes: 200 (success), 400 (bad request), 401 (unauthorized), 403 (forbidden), 500 (server error)

**User Experience:**
- Never show raw error stack traces
- Provide actionable guidance ("Check your internet connection", "Contact support")
- Retry buttons where appropriate

---

## 16. PERFORMANCE OPTIMIZATIONS

**Frontend:**
- Code splitting with Vite (already configured in vite.config.ts)
- Lazy load pages and heavy components
- Virtualized lists for large tables (future enhancement)
- Debounce search inputs (300ms)
- Memoize expensive calculations (React.memo, useMemo)
- Optimize re-renders (useCallback for handlers)

**Database:**
- Indexes on all foreign keys
- Indexes on status, created_at columns
- Efficient RLS policies (avoid N+1 queries in USING clause)
- Use JSONB for flexible schemas, but index jsonb fields if queried
- Pagination for large result sets (limit 50 or 100 per page)

**Queries:**
- Use select() with specific columns instead of SELECT *
- Join related data in one query instead of multiple round-trips
- Use .maybeSingle() instead of .single() to avoid errors on no results

**Caching:**
- Cache organization context in React Context
- Cache user permissions in Context
- Cache rarely-changing data (industry standard library) in localStorage with TTL

**Bundle Size:**
- Current optimizations: Split vendor chunks, feature chunks
- ExcelJS and jsPDF load only when needed (lazy import)
- Tree-shaking enabled in Vite

---

## 17. TESTING REQUIREMENTS

**Unit Tests (Future):**
- Business logic functions (calculations)
- Utility functions (string matching, validation)
- React hooks (usePermissions, useUsageLimits)

**Integration Tests (Future):**
- Form submissions
- Database operations (CRUD)
- Approval workflow execution

**E2E Tests (Future):**
- Complete user journeys:
  - Signup → Create project → Submit for approval → Approve → Export
  - Create estimate → Convert to PM → Log costs → Track budget
  - Manage team → Assign roles → Configure workflow

**Manual Testing Checklist:**
- All CRUD operations on all entities
- Permission enforcement (try as different roles)
- Workflow execution (all branches)
- Real-time updates
- Export functionality (Excel and PDF)
- Responsive layouts
- Browser compatibility (Chrome, Firefox, Safari, Edge)

---

## 18. DEPLOYMENT

**Build:**
```bash
npm run build
```
Output: `dist/` folder

**Hosting Options:**
- Netlify (recommended for SPA)
- Vercel
- Cloudflare Pages
- Any static host

**Environment Variables:**
Create `.env` file:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**Supabase Setup:**
1. Create Supabase project
2. Run all migrations in order (204 files in supabase/migrations/)
3. Enable Realtime for: project_activities, actual_costs, project_documents, project_issues, user_notifications
4. Create storage bucket: `organization-logos` (public)
5. Deploy Edge Functions (if using Stripe):
   - create-checkout-session
   - stripe-webhook
6. Set Edge Function secrets:
   - STRIPE_SECRET_KEY
   - SUPABASE_SERVICE_ROLE_KEY (auto-populated)

**Database Seeding:**
- Import industry standard asset library CSV (1000+ assets)
- Can use `industry_standard_assets.csv` file
- Run SQL to populate industry_standard_asset_library and industry_standard_ppm_tasks

**Initial Super Admin:**
- Manually insert into super_admins table after first user signup
- `INSERT INTO super_admins (user_id) VALUES ('uuid-of-first-user');`

**Monitoring:**
- Supabase dashboard for database metrics
- Sentry or similar for error tracking (future)
- Google Analytics for usage analytics (future)

---

## 19. FUTURE ENHANCEMENTS (Out of Scope for Initial Build)

- Email notifications (in addition to in-app)
- Mobile apps (iOS/Android)
- Multi-language support
- Advanced reporting (custom report builder)
- Integration with accounting software (QuickBooks, Xero)
- Integration with project management tools (MS Project, Primavera)
- OCR for BOQ import from scanned documents
- AI-powered cost estimation suggestions
- Time tracking mobile app for field workers
- Client portal (external access to projects)
- Advanced analytics and predictive modeling
- Template library (project templates)
- Bulk operations (bulk approve, bulk archive)
- Advanced search with filters and saved searches
- Document OCR and text extraction
- Drawing markup tools
- Video conferencing integration
- Mobile-optimized PM workspace

---

## 20. DATA MIGRATION & IMPORT

**Industry Standard Library:**
- Source: SFG20 or similar standard
- Format: CSV with columns: Category, Asset Type Code, Asset Name, Description, Maintenance Type, Standard Code, PPM Tasks JSON
- Import script: Parse CSV, bulk insert into industry_standard_asset_library and industry_standard_ppm_tasks
- Deduplication: Use standard_code as unique key

**Organization Data Import:**
- Asset Library: Excel template with defined columns
- Labor Library: Excel template with defined columns
- BOQ Import: Standard BOQ format Excel

**Legacy System Migration:**
- Export data from old system as JSON
- Create migration scripts to map old schema to new schema
- Import via batch SQL inserts
- Validate data integrity after import

---

## 21. SECURITY CONSIDERATIONS

**Authentication:**
- Passwords hashed by Supabase Auth (bcrypt)
- Session tokens in httpOnly cookies (Supabase handles)
- Refresh tokens for long-lived sessions

**Authorization:**
- RLS on every table
- Never trust client-side permissions checks
- Server-side validation in database functions
- Super admin checks in functions (not just UI)

**Data Protection:**
- HTTPS only (enforce in production)
- No sensitive data in URLs (use POST for mutations)
- No SQL injection (use parameterized queries, Supabase client handles)
- No XSS (React escapes by default, be careful with dangerouslySetInnerHTML)
- CSRF protection (Supabase handles with CORS)

**Audit Logging:**
- Log all sensitive operations in audit_log table
- Include: user_id, organization_id, action_type, entity_type, entity_id, changes (JSONB), ip_address, user_agent, timestamp
- Actions to log: Create/Update/Delete projects, approval actions, role changes, cost approvals, document uploads

**File Uploads:**
- Validate file types (only allow: pdf, xlsx, jpg, png)
- Validate file sizes (max 10MB per file)
- Scan for malware (future enhancement)
- Store in Supabase Storage with access policies

**Rate Limiting:**
- Supabase has built-in rate limiting on auth endpoints
- Edge Functions: Implement rate limiting if exposed publicly (future)

**Secrets Management:**
- Never commit API keys to git (.env in .gitignore)
- Use environment variables for all secrets
- Rotate API keys periodically
- Use different keys for dev/test/prod

---

## 22. CODE STRUCTURE

```
/src
  /components       # Reusable UI components
    /dashboard      # Dashboard-specific components
    /fm             # FM Estimator components
    /retrofit       # Retrofit Estimator components
    /pm             # Project Management components
    /workflows      # Workflow builder components
    /roles          # Role management components
  /contexts         # React Context providers (Organization, UnsavedChanges)
  /hooks            # Custom React hooks (usePermissions, useUsageLimits, useProjectMembers)
  /lib              # Third-party library configs (supabase.ts)
  /pages            # Top-level page components (one per route)
  /types            # TypeScript type definitions
  /utils            # Business logic, calculations, database functions
  App.tsx           # Main app component with routing
  main.tsx          # Entry point
  index.css         # Global styles (Tailwind)

/supabase
  /migrations       # Database migration files (SQL)
  /functions        # Edge Functions (TypeScript)

/public             # Static assets (redirects, images)
```

**Naming Conventions:**
- Components: PascalCase (MyComponent.tsx)
- Utilities: camelCase (myUtility.ts)
- Database functions: snake_case (get_user_by_id)
- CSS classes: kebab-case or Tailwind classes

**Import Organization:**
- React and hooks first
- Third-party libraries
- Local components
- Utils and types
- Styles (if any)

---

## FINAL NOTES

This specification represents a **complete, production-ready application** with enterprise features including:
- Multi-tenant architecture with robust RBAC
- Three distinct estimation modules with complex calculations
- Full project management workspace with scheduling, budgeting, documents, and issues
- Visual workflow builder for custom approval processes
- Real-time collaboration features
- Comprehensive audit trails
- Stripe integration for SaaS monetization
- Excel/PDF export with professional formatting
- AI-enhanced asset matching with learning system
- Freemium model with usage tracking

The application is built with modern technologies (React, TypeScript, Supabase) and follows best practices for security, performance, and user experience. The database schema is fully normalized with proper indexing and RLS policies. The codebase is modular, type-safe, and maintainable.

**Total Implementation Estimate:** 3-6 months for experienced full-stack team

**Critical Success Factors:**
1. Accurate calculation engines (FM, Retrofit, HK)
2. Robust permission system (RLS + application-level)
3. Smooth workflow execution with proper error handling
4. Professional export templates
5. Real-time updates without conflicts
6. Intuitive UI for complex data entry
