import React from 'react';
import { cn } from '../../utils/cn';
import { CheckCircle, Clock, AlertCircle, XCircle, ShieldAlert, FileText, Ban } from 'lucide-react';

export type StatusType =
  | 'Active'
  | 'Inactive'
  | 'Verified'
  | 'Pending'
  | 'Pending Approval'
  | 'Rejected'
  | 'Unverified'
  | 'Draft'
  | 'Paused'
  | 'Completed'
  | 'Cancelled'
  | 'Paid'
  | 'Overdue'
  | 'Processing'
  | 'Failed'
  | string;

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className, showIcon = true }) => {
  const norm = status?.toLowerCase() || '';

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
  let Icon = null;

  if (norm === 'active' || norm === 'verified' || norm === 'completed' || norm === 'paid') {
    colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800';
    Icon = CheckCircle;
  } else if (norm === 'pending' || norm === 'pending approval' || norm === 'processing') {
    colorClasses = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800';
    Icon = Clock;
  } else if (norm === 'paused' || norm === 'in review' || norm === 'overdue') {
    colorClasses = 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800';
    Icon = AlertCircle;
  } else if (norm === 'rejected' || norm === 'failed' || norm === 'cancelled' || norm === 'delete') {
    colorClasses = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800';
    Icon = XCircle;
  } else if (norm === 'inactive' || norm === 'unverified') {
    colorClasses = 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/80 dark:text-slate-400 dark:border-slate-700';
    Icon = Ban;
  } else if (norm === 'draft') {
    colorClasses = 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800';
    Icon = FileText;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold text-[10px] uppercase tracking-wider whitespace-nowrap',
        colorClasses,
        className
      )}
    >
      {showIcon && Icon && <Icon className="w-3 h-3 shrink-0" />}
      <span>{status}</span>
    </span>
  );
};
