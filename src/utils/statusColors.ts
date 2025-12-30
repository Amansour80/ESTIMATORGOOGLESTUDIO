export function getActivityStatusColor(status: string): string {
  switch (status) {
    case 'Pending': return 'bg-gray-100 text-gray-800';
    case 'Work in Progress': return 'bg-blue-100 text-blue-800';
    case 'Ready for Inspection': return 'bg-yellow-100 text-yellow-800';
    case 'Awaiting Client Approval': return 'bg-orange-100 text-orange-800';
    case 'Inspected': return 'bg-green-100 text-green-800';
    case 'Closed': return 'bg-slate-100 text-slate-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

export function getActivityStatusBarColor(status: string): string {
  switch (status) {
    case 'Pending': return 'bg-gray-400';
    case 'Work in Progress': return 'bg-blue-500';
    case 'Ready for Inspection': return 'bg-yellow-500';
    case 'Awaiting Client Approval': return 'bg-orange-500';
    case 'Inspected': return 'bg-green-500';
    case 'Closed': return 'bg-slate-400';
    default: return 'bg-gray-400';
  }
}

export function getDocumentStatusColor(status: string): string {
  switch (status) {
    case 'Draft': return 'bg-gray-100 text-gray-800';
    case 'Submitted': return 'bg-blue-100 text-blue-800';
    case 'Under Review': return 'bg-yellow-100 text-yellow-800';
    case 'Approved': return 'bg-green-100 text-green-800';
    case 'Rejected': return 'bg-red-100 text-red-800';
    case 'Resubmitted': return 'bg-purple-100 text-purple-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

export function getIssueStatusColor(status: string): string {
  switch (status) {
    case 'Open': return 'bg-red-100 text-red-800';
    case 'In Progress': return 'bg-blue-100 text-blue-800';
    case 'Pending Response': return 'bg-yellow-100 text-yellow-800';
    case 'Resolved': return 'bg-green-100 text-green-800';
    case 'Closed': return 'bg-slate-100 text-slate-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

export function getIssuePriorityColor(priority: string): string {
  switch (priority) {
    case 'Critical': return 'bg-red-100 text-red-800 border-red-200';
    case 'High': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'Low': return 'bg-blue-100 text-blue-800 border-blue-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

export function getPMStatusColor(status: string): string {
  switch (status) {
    case 'Active': return 'bg-green-100 text-green-800';
    case 'Draft': return 'bg-gray-100 text-gray-800';
    case 'On Hold': return 'bg-yellow-100 text-yellow-800';
    case 'Completed': return 'bg-blue-100 text-blue-800';
    case 'Cancelled': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}
