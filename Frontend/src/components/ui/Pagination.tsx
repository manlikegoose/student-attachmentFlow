import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { Button } from './Button';

export function Pagination({
  page,
  count,
  pageSize,
  onChange,
  itemLabel = 'results'






}: {page: number;count: number;pageSize: number;onChange: (page: number) => void;itemLabel?: string;}) {
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  if (count === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(count, page * pageSize);

  return (
    <nav
      className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3"
      aria-label="Pagination">
      
      <p className="text-[13px] text-slate-500">
        Showing <span className="font-medium text-navy-900">{from}</span>–
        <span className="font-medium text-navy-900">{to}</span> of{' '}
        <span className="font-medium text-navy-900">{count}</span> {itemLabel}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          icon={<ChevronLeftIcon className="h-3.5 w-3.5" />}>
          
          Previous
        </Button>
        <span className="text-[13px] tabular-nums text-slate-500">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}>
          
          Next
          <ChevronRightIcon className="h-3.5 w-3.5" />
        </Button>
      </div>
    </nav>);

}