import React from 'react';
import { CheckCircle2Icon, ShieldAlertIcon, ShieldCheckIcon } from 'lucide-react';
import { cn } from '../../utils/cn';
import { label } from '../../types/enums';
import type { CompanyVerificationStatus } from '../../types/enums';

export type Tone = 'neutral' | 'approved' | 'pending' | 'rejected' | 'active' | 'muted';

const TONES: Record<Tone, string> = {
  neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  approved: 'bg-approved-bg text-approved-fg border-approved-border',
  pending: 'bg-pending-bg text-pending-fg border-pending-border',
  rejected: 'bg-rejected-bg text-rejected-fg border-rejected-border',
  active: 'bg-active-bg text-active-fg border-active-border',
  muted: 'bg-slate-50 text-slate-500 border-slate-200'
};

export function Badge({
  tone = 'neutral',
  children,
  className,
  icon





}: {tone?: Tone;children: React.ReactNode;className?: string;icon?: React.ReactNode;}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium leading-5',
        TONES[tone],
        className
      )}>
      
      {icon}
      {children}
    </span>);

}

/**
 * Single mapping from every workflow status to a tone. Colour carries meaning here and
 * nowhere else in the product, so this table is the only place it is decided.
 */
const STATUS_TONES: Record<string, Tone> = {
  // opportunity
  DRAFT: 'muted',
  PENDING_APPROVAL: 'pending',
  PUBLISHED: 'approved',
  CLOSED: 'neutral',
  CANCELLED: 'muted',
  // application
  SUBMITTED: 'neutral',
  UNDER_COMPANY_REVIEW: 'pending',
  COMPANY_ACCEPTED: 'approved',
  COMPANY_REJECTED: 'rejected',
  UNIVERSITY_REVIEW: 'pending',
  UNIVERSITY_APPROVED: 'approved',
  UNIVERSITY_REJECTED: 'rejected',
  WITHDRAWN: 'muted',
  // placement
  PENDING: 'pending',
  APPROVED: 'approved',
  UPCOMING: 'active',
  ACTIVE: 'active',
  COMPLETED: 'approved',
  // documents / verification
  REGISTERED: 'muted',
  PENDING_VERIFICATION: 'pending',
  VERIFIED: 'approved',
  REJECTED: 'rejected'
};

export function StatusBadge({ status, className }: {status: string;className?: string;}) {
  return (
    <Badge tone={STATUS_TONES[status] ?? 'neutral'} className={className}>
      {label(status)}
    </Badge>);

}

export function VerificationBadge({
  status,
  className



}: {status: CompanyVerificationStatus;className?: string;}) {
  if (status === 'VERIFIED') {
    return (
      <Badge tone="approved" className={className} icon={<ShieldCheckIcon className="h-3 w-3" />}>
        Verified
      </Badge>);

  }
  if (status === 'PENDING_VERIFICATION') {
    return (
      <Badge tone="pending" className={className} icon={<ShieldAlertIcon className="h-3 w-3" />}>
        Verification pending
      </Badge>);

  }
  if (status === 'REJECTED') {
    return (
      <Badge tone="rejected" className={className} icon={<ShieldAlertIcon className="h-3 w-3" />}>
        Verification declined
      </Badge>);

  }
  return (
    <Badge tone="muted" className={className} icon={<ShieldAlertIcon className="h-3 w-3" />}>
      Unverified
    </Badge>);

}

export function CountPill({ count, tone = 'neutral' }: {count: number;tone?: Tone;}) {
  return (
    <Badge tone={tone} className="min-w-[1.5rem] justify-center tabular-nums">
      {count}
    </Badge>);

}

export function DoneIcon({ className }: {className?: string;}) {
  return <CheckCircle2Icon className={cn('h-4 w-4 text-approved-fg', className)} aria-hidden />;
}