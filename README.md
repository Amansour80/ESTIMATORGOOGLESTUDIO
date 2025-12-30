# Smart Estimator - Getting Started Guide

Welcome to Smart Estimator, a comprehensive project estimation and management platform for facilities management, housekeeping, and retrofit projects.

## Table of Contents
- [Overview](#overview)
- [Quick Start](#quick-start)
- [Key Features](#key-features)
- [User Roles & Permissions](#user-roles--permissions)
- [Core Modules](#core-modules)
- [Workflows](#workflows)
- [Tips & Best Practices](#tips--best-practices)

---

## Overview

Smart Estimator is an all-in-one platform designed for construction, facilities management, and project management professionals. It helps you:

- Create accurate project estimates
- Manage inquiries and convert them to projects
- Track project budgets and costs in real-time
- Coordinate teams with approval workflows
- Manage asset libraries and labor resources
- Execute projects with integrated project management tools

---

## Quick Start

### 1. Sign Up & Login
- Navigate to the application and create an account with your email
- You'll automatically be assigned as the **Owner** of your organization
- Complete your profile by clicking your avatar in the sidebar

### 2. First-Time Setup
After logging in, you should:

1. **Update Organization Details** (Settings → Organization)
   - Add your company name and details
   - Upload your company logo
   - Configure color preferences

2. **Set Up Team Members** (Settings → Team Management)
   - Invite team members via email
   - Assign roles (Admin, Estimator, Viewer)
   - Configure module permissions

3. **Configure Pricing & Costs** (Settings → Pricing Configuration)
   - Set default labor rates
   - Configure material markups
   - Define overhead percentages

### 3. Create Your First Project
1. Navigate to **Home** from the sidebar
2. Choose your project type:
   - **HK Estimator** - Housekeeping projects
   - **FM Estimator** - Facilities Management contracts
   - **Retrofit Estimator** - Building retrofit projects
3. Fill in project details and start estimating

---

## Key Features

### Global Search (⌘K)
- Click the search icon in the top-right corner or press **⌘K** (Mac) / **Ctrl+K** (Windows)
- Quickly find any project, inquiry, or navigate to modules
- Search across all project types

### Dashboard
- View all your projects at a glance
- Track project statuses (Draft, Pending, Approved, etc.)
- Monitor key performance indicators
- Compare estimator performance

### Notifications
- Real-time updates on project approvals
- Team activity notifications
- Click the bell icon (top-right) to view all notifications

### Project Status Management
Projects flow through these statuses:
- **DRAFT** - Work in progress
- **PENDING_APPROVAL** - Submitted for review
- **APPROVED** - Ready to execute
- **IN_PROGRESS** - Active project
- **COMPLETED** - Finished project
- **ON_HOLD** / **CANCELLED** - Paused or cancelled

---

## User Roles & Permissions

### Owner
- Full system access
- Manage organization settings
- Create and assign roles
- Configure approval workflows
- Manage team members

### Admin
- Create and edit all projects
- Approve projects regardless of status
- Manage team members
- Access all modules

### Estimator
- Create and edit draft projects
- Submit projects for approval
- View assigned projects
- Access estimation modules

### Viewer
- Read-only access to projects
- View reports and dashboards
- Cannot create or edit projects

**Note:** Permissions can be customized per module in Settings → Roles & Permissions

---

## Core Modules

### 1. Housekeeping (HK) Estimator
Estimate manpower and costs for housekeeping services.

**Use Case:** Calculate staffing requirements for cleaning large facilities

**Key Features:**
- Area-based calculations
- Productivity standards
- Machine and equipment costing
- Shift planning

**Quick Workflow:**
1. Enter project information
2. Configure site details (areas, frequencies)
3. Add areas with square footage
4. Review calculated manpower needs
5. Export to Excel or PDF

---

### 2. Facilities Management (FM) Estimator
Comprehensive FM contract estimation with asset-based maintenance planning.

**Use Case:** Price multi-year FM contracts with PPM schedules

**Key Features:**
- Asset library with industry standards (SFG20-compliant)
- PPM task scheduling
- Technician deployment planning
- Materials and consumables tracking
- Supervisory staff calculation

**Quick Workflow:**
1. Create project and set contract duration
2. Add assets from library or import from Excel
3. Configure technician rates and availability
4. Add materials and specialized services
5. Review annual breakdown and export

**Pro Tip:** Use the industry-standard asset library for pre-configured maintenance tasks and frequencies.

---

### 3. Retrofit Estimator
Estimate building retrofit and refurbishment projects.

**Use Case:** Price HVAC upgrades, lighting retrofits, building improvements

**Key Features:**
- Two modes: Asset-based and BOQ (Bill of Quantities)
- Labor library for different trades
- Material catalog
- Subcontractor management
- Project phase planning
- Manpower deployment scheduling

**Quick Workflow (Asset Mode):**
1. Add retrofit items (assets to be replaced/installed)
2. Assign labor tasks and hours
3. Add materials and equipment
4. Configure subcontractors if needed
5. Review total costs and timeline

**Quick Workflow (BOQ Mode):**
1. Import BOQ from Excel or enter manually
2. Map line items to costs
3. Add markup and contingencies
4. Export client-facing proposal

---

### 4. Retrofit PM (Project Management)
Full project execution workspace for retrofit projects.

**Use Case:** Manage active retrofit projects from kickoff to completion

**Key Features:**
- Activity scheduling with dependencies
- Gantt chart visualization
- Budget management and cost tracking
- Document management with version control
- Issue tracking
- Team collaboration
- Time tracking
- Real-time progress updates

**Quick Workflow:**
1. Create or convert from Retrofit Estimate
2. Set up project team and permissions
3. Create activities with dependencies
4. Set budget baseline
5. Track costs as project progresses
6. Monitor progress and resolve issues

**Budget Management:**
- Set planned costs for activities
- Log actual costs (labor, materials, equipment, etc.)
- Submit costs for review (approval workflow)
- Track budget vs. actual in real-time
- Generate variance reports

---

### 5. Inquiries
Centralized inquiry management system.

**Use Case:** Track incoming project requests and convert to estimates

**Key Features:**
- Log client inquiries
- Track inquiry status
- One-click conversion to estimates
- Link inquiries to projects
- Search and filter

**Quick Workflow:**
1. Click "New Inquiry" from Inquiries page
2. Fill in client and project details
3. Select project type (HK, FM, or Retrofit)
4. Track status (New → Qualified → Quoted → Won/Lost)
5. Convert to estimate when ready

---

### 6. Approvals
Workflow-based approval system for project estimates.

**Use Case:** Route projects through your organization's approval process

**Key Features:**
- Visual workflow builder
- Role-based approvals
- Conditional routing
- Approval history tracking
- Notifications at each stage

**Quick Workflow:**
1. Estimator submits project for approval
2. System routes to appropriate approver(s)
3. Approver reviews and approves/rejects
4. If rejected, returns to estimator with comments
5. If approved, project status updates automatically

**Admin Task:** Configure workflows in Settings → Approval Workflows

---

### 7. Asset Library Manager
Centralized database of FM assets and maintenance requirements.

**Use Case:** Maintain your organization's asset database for FM projects

**Key Features:**
- Industry-standard asset templates
- Custom asset creation
- Import/export capabilities
- PPM task definitions
- Maintenance frequencies

**Quick Workflow:**
1. Browse existing industry standards
2. Add custom assets for your organization
3. Define maintenance tasks per asset
4. Use in FM Estimator projects

---

### 8. Labor Library Manager
Manage skilled technician profiles and rates.

**Use Case:** Define your workforce capabilities and costs

**Key Features:**
- Trade classifications (HVAC, Electrical, Plumbing, etc.)
- Skill tags for matching
- Regular and overtime rates
- Supervisory capabilities
- Working hours configuration

**Quick Workflow:**
1. Add technician profiles
2. Set trade and skill tags
3. Configure rates and hours
4. Deploy in FM and Retrofit projects

---

## Workflows

### Standard Estimation Workflow
```
1. Create Inquiry (optional)
   ↓
2. Start New Estimate
   ↓
3. Input Project Data
   ↓
4. Save Draft
   ↓
5. Submit for Approval
   ↓
6. Approval Process
   ↓
7. Export Final Estimate
   ↓
8. Convert to Project (if Retrofit PM)
```

### Approval Workflow Example
```
Draft Project
   ↓
Estimator Submits → Pending Approval
   ↓
Senior Estimator Reviews
   ↓
   ├─→ Approved → Manager Reviews
   │                ↓
   │             ├─→ Approved → Project Approved
   │             └─→ Rejected → Back to Estimator
   │
   └─→ Rejected → Back to Estimator
```

---

## Tips & Best Practices

### For Estimators
1. **Save Often** - Projects auto-save on navigation, but manual saves ensure data security
2. **Use Templates** - Set up common configurations in your libraries
3. **Validate Before Submit** - Review all calculations before submitting for approval
4. **Add Comments** - Document assumptions and special conditions
5. **Export Regularly** - Keep Excel/PDF backups of estimates

### For Admins
1. **Configure Workflows Early** - Set up approval workflows before team starts estimating
2. **Define Clear Roles** - Use role-based permissions to control access
3. **Monitor Usage** - Use Dashboard to track team productivity
4. **Regular Reviews** - Audit and update libraries quarterly
5. **Train Your Team** - Ensure everyone understands the approval process

### For Project Managers
1. **Set Realistic Baselines** - Use approved estimates as budget baselines
2. **Track Costs Daily** - Log costs as they occur, not at month-end
3. **Update Progress Weekly** - Keep activity progress current
4. **Resolve Issues Quickly** - Use issue tracking to document and resolve blockers
5. **Communicate Changes** - Use comments to keep team informed

### General Tips
- **Use Global Search (⌘K)** - Fastest way to navigate
- **Check Notifications** - Stay updated on approvals and changes
- **Customize Your Workspace** - Configure colors and preferences in Settings
- **Mobile Responsive** - Access from any device
- **Keyboard Shortcuts** - Learn shortcuts for faster workflow

---

## Common Questions

**Q: Can I import existing data?**
A: Yes! Most modules support Excel import. Use the import buttons in Asset Library, FM Estimator, and Retrofit BOQ mode.

**Q: How do I add team members?**
A: Go to Settings → Team Management → Click "Add Member" or use Complementary Users for free access.

**Q: What happens when I submit for approval?**
A: The system routes your project through the configured approval workflow. You'll receive notifications at each stage.

**Q: Can I edit approved projects?**
A: Only Admins can edit approved projects. Others must request changes through proper channels.

**Q: How do I export reports?**
A: Each estimator has Excel and PDF export buttons. Retrofit PM has additional budget reports.

**Q: What's the difference between Retrofit Estimator and Retrofit PM?**
A: Retrofit Estimator creates estimates/proposals. Retrofit PM manages the actual project execution with full PM features.

**Q: Can I customize approval workflows?**
A: Yes! Admins can create custom workflows with conditional routing in Settings → Approval Workflows.

**Q: What are Complementary Users?**
A: Free, view-only accounts for clients or external stakeholders. Managed in Settings → Team Management.

---

## Support & Resources

### Need Help?
- Check tooltips (hover over icons)
- Use the search function to find projects
- Review notification details for approval status
- Contact your admin for permission issues

### Technical Requirements
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection
- Minimum 1280x720 resolution recommended
- JavaScript enabled

---

## Getting Help

If you encounter issues or have questions:
1. Check this guide first
2. Use the global search to find relevant projects
3. Contact your organization's administrator
4. Review notification messages for context

---

**Version:** 2.0
**Last Updated:** December 2025

Happy Estimating! 🚀
