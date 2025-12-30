import { ProjectStatus, VALID_TRANSITIONS } from '../types/projectStatus';

export const canTransitionTo = (
  currentStatus: ProjectStatus,
  newStatus: ProjectStatus,
  isAdmin: boolean
): boolean => {
  if (isAdmin) {
    return true;
  }

  return VALID_TRANSITIONS[currentStatus].includes(newStatus);
};

export const getAvailableTransitions = (
  currentStatus: ProjectStatus,
  isAdmin: boolean
): ProjectStatus[] => {
  if (isAdmin) {
    return (['DRAFT', 'SUBMITTED', 'PENDING_CLIENT_DECISION', 'AWARDED', 'LOST', 'CANCELLED'] as ProjectStatus[])
      .filter(s => s !== currentStatus);
  }

  return VALID_TRANSITIONS[currentStatus];
};
