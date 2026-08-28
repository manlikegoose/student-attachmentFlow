import React from 'react';
import { cn } from '../../utils/cn';

export function ProgressBar({
  value,
  label,
  tone = 'navy',
  showValue = true,
  className






}: {value: number;label?: string;tone?: 'navy' | 'approved' | 'pending';showValue?: boolean;className?: string;}) {
  const clamped = Math.min(100, Math.max(0, Math.round(value)));
  const fills = {
    navy: 'bg-navy-600',
    approved: 'bg-approved-solid',
    pending: 'bg-pending-solid'
  };
  return (
    <div className={className}>
      {(label || showValue) &&
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
          {label && <span className="text-[12px] font-medium text-slate-600">{label}</span>}
          {showValue &&
        <span className="text-[12px] font-semibold tabular-nums text-navy-900">{clamped}%</span>
        }
        </div>
      }
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? 'Progress'}
        className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
        
        <div
          className={cn('h-full rounded-full transition-[width] duration-300 ease-smooth', fills[tone])}
          style={{ width: `${clamped}%` }} />
        
      </div>
    </div>);

}