import React from 'react';
import { cn } from '../../utils/cn';

export interface DescriptionItem {
  label: string;
  value: React.ReactNode;
  span?: boolean;
}

/** Dense label/value grid used across every detail view. */
export function DescriptionList({
  items,
  columns = 2,
  className




}: {items: DescriptionItem[];columns?: 1 | 2 | 3;className?: string;}) {
  const cols = {
    1: 'sm:grid-cols-1',
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 lg:grid-cols-3'
  };
  return (
    <dl className={cn('grid grid-cols-1 gap-x-6 gap-y-4', cols[columns], className)}>
      {items.map((item, i) =>
      <div key={`${item.label}-${i}`} className={cn(item.span && 'sm:col-span-full')}>
          <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            {item.label}
          </dt>
          <dd className="mt-1 text-[13px] leading-relaxed text-navy-900">{item.value || '—'}</dd>
        </div>
      )}
    </dl>);

}

export function Prose({ text, className }: {text: string;className?: string;}) {
  if (!text) return <p className="text-[13px] text-slate-400">Not provided.</p>;
  return (
    <div className={cn('space-y-2 text-[13px] leading-relaxed text-slate-700', className)}>
      {text.split(/\n+/).map((paragraph, i) =>
      <p key={i}>{paragraph}</p>
      )}
    </div>);

}