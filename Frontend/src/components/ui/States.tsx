import React from 'react';
import { AlertTriangleIcon, InboxIcon, RefreshCwIcon } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from './Button';

export function Skeleton({ className }: {className?: string;}) {
  return <div className={cn('animate-pulse rounded bg-slate-200/80', className)} />;
}

export function LoadingState({ label = 'Loading…', rows = 4 }: {label?: string;rows?: number;}) {
  return (
    <div className="space-y-3 p-5" role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }).map((_, i) =>
      <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      )}
    </div>);

}

export function CardSkeleton({ count = 3 }: {count?: number;}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) =>
      <div key={i} className="space-y-3 rounded-lg border border-slate-200 bg-white p-5">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      )}
    </div>);

}

export function EmptyState({
  title,
  description,
  action,
  icon,
  className






}: {title: string;description?: string;action?: React.ReactNode;icon?: React.ReactNode;className?: string;}) {
  return (
    <div className={cn('flex flex-col items-center px-6 py-14 text-center', className)}>
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        {icon ?? <InboxIcon className="h-5 w-5" aria-hidden />}
      </div>
      <h3 className="text-sm font-semibold text-navy-900">{title}</h3>
      {description && <p className="mt-1 max-w-md text-[13px] text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>);

}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  className





}: {title?: string;message?: string;onRetry?: () => void;className?: string;}) {
  return (
    <div className={cn('flex flex-col items-center px-6 py-14 text-center', className)} role="alert">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-rejected-bg text-rejected-fg">
        <AlertTriangleIcon className="h-5 w-5" aria-hidden />
      </div>
      <h3 className="text-sm font-semibold text-navy-900">{title}</h3>
      <p className="mt-1 max-w-md text-[13px] text-slate-500">
        {message ?? 'The request could not be completed. Please try again.'}
      </p>
      {onRetry &&
      <Button
        variant="secondary"
        size="sm"
        className="mt-4"
        icon={<RefreshCwIcon className="h-3.5 w-3.5" />}
        onClick={onRetry}>
        
          Try again
        </Button>
      }
    </div>);

}

/**
 * One place that decides between loading, error, empty and content, so every list in
 * the product handles all four the same way.
 */
export function AsyncBoundary<T>({
  state,
  loading,
  empty,
  children,
  onRetry






}: {state: {data: T | null;loading: boolean;error: string | null;};loading?: React.ReactNode;empty?: React.ReactNode;children: (data: T) => React.ReactNode;onRetry?: () => void;}) {
  if (state.loading && state.data === null) return <>{loading ?? <LoadingState />}</>;
  if (state.error) return <ErrorState message={state.error} onRetry={onRetry} />;
  if (state.data === null) return <>{empty ?? null}</>;
  return <>{children(state.data)}</>;
}