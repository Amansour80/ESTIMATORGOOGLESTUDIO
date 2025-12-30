export type ProjectStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'PENDING_CLIENT_DECISION'
  | 'AWARDED'
  | 'LOST'
  | 'CANCELLED';

export interface StatusHistoryEntry {
  from_status: ProjectStatus;
  to_status: ProjectStatus;
  changed_at: string;
  changed_by: string;
  changed_by_email: string;
}

export interface ProjectStatusData {
  status: ProjectStatus;
  submitted_at?: string;
  awarded_at?: string;
  lost_at?: string;
  cancelled_at?: string;
  status_history: StatusHistoryEntry[];
}

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  PENDING_CLIENT_DECISION: 'Pending Decision',
  AWARDED: 'Awarded',
  LOST: 'Lost',
  CANCELLED: 'Cancelled',
};

export const STATUS_COLORS: Record<ProjectStatus, { bg: string; text: string; border: string }> = {
  DRAFT: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-300',
  },
  SUBMITTED: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-300',
  },
  PENDING_CLIENT_DECISION: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
    border: 'border-yellow-300',
  },
  AWARDED: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-300',
  },
  LOST: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-300',
  },
  CANCELLED: {
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    border: 'border-orange-300',
  },
};

export const VALID_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  DRAFT: ['SUBMITTED', 'CANCELLED'],
  SUBMITTED: ['PENDING_CLIENT_DECISION', 'CANCELLED'],
  PENDING_CLIENT_DECISION: ['AWARDED', 'LOST', 'CANCELLED'],
  AWARDED: ['CANCELLED'],
  LOST: ['CANCELLED'],
  CANCELLED: [],
};
