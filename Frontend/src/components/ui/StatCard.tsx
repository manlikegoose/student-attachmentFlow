import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Skeleton } from './States';

export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: React.ReactNode;
  tone?: 'default' | 'attention';
  to?: string;
  loading?: boolean;
}

export function StatCard({ label, value, hint, icon, tone = 'default', to, loading }: StatCardProps) {
  const body =
  <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[12px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
        {icon &&
      <span
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-md',
          tone === 'attention' ? 'bg-pending-bg text-pending-fg' : 'bg-navy-50 text-navy-600'
        )}>
        
            {icon}
          </span>
      }
      </div>
      {loading ?
    <Skeleton className="mt-3 h-7 w-16" /> :

    <p
      className={cn(
        'mt-2 text-2xl font-semibold tabular-nums tracking-tight',
        tone === 'attention' ? 'text-pending-fg' : 'text-navy-900'
      )}>
      
          {value}
        </p>
    }
      {hint && <p className="mt-1 text-[12px] text-slate-500">{hint}</p>}
      {to &&
    <span className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-navy-600">
          View <ArrowRightIcon className="h-3 w-3" aria-hidden />
        </span>
    }
    </>;


  const className = cn(
    'block rounded-lg border bg-white p-4 shadow-card',
    tone === 'attention' ? 'border-pending-border' : 'border-slate-200',
    to && 'transition-colors duration-150 ease-smooth hover:border-navy-300'
  );

  return to ?
  <Link to={to} className={className}>
      {body}
    </Link> :

  <div className={className}>{body}</div>;

}