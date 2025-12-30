import React from 'react';
import { ProjectStatus, STATUS_LABELS, STATUS_COLORS } from '../types/projectStatus';

interface StatusBadgeProps {
  status: ProjectStatus;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const defaultStatus: ProjectStatus = 'DRAFT';
  const safeStatus = status || defaultStatus;
  const colors = STATUS_COLORS[safeStatus] || STATUS_COLORS[defaultStatus];
  const label = STATUS_LABELS[safeStatus] || safeStatus;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border} ${className}`}
    >
      {label}
    </span>
  );
};
