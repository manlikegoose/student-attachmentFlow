import React from 'react';
import { cn } from '../../utils/cn';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  className?: string;
  /** Columns marked secondary are dropped from the tablet layout to protect legibility. */
  secondary?: boolean;
  align?: 'left' | 'right';
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  /**
   * Mobile rendering. Tables become cards below md so that no action or data is lost —
   * horizontal scrolling on a phone hides exactly the columns people need.
   */
  mobileCard: (row: T) => React.ReactNode;
  className?: string;
  caption?: string;
}

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  onRowClick,
  mobileCard,
  className,
  caption
}: DataTableProps<T>) {
  return (
    <div className={className}>
      {/* Desktop / tablet */}
      <div className="hidden md:block">
        <table className="w-full border-collapse text-sm">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80">
              {columns.map((c) =>
              <th
                key={c.key}
                scope="col"
                className={cn(
                  'px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500',
                  c.align === 'right' && 'text-right',
                  c.secondary && 'hidden lg:table-cell',
                  c.className
                )}>
                
                  {c.header}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) =>
            <tr
              key={getRowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                'border-b border-slate-100 last:border-0',
                onRowClick &&
                'cursor-pointer transition-colors duration-150 ease-smooth hover:bg-navy-50/60'
              )}>
              
                {columns.map((c) =>
              <td
                key={c.key}
                className={cn(
                  'px-4 py-3 align-middle text-navy-900',
                  c.align === 'right' && 'text-right',
                  c.secondary && 'hidden lg:table-cell',
                  c.className
                )}>
                
                    {c.render(row)}
                  </td>
              )}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <ul className="divide-y divide-slate-100 md:hidden">
        {rows.map((row) =>
        <li key={getRowKey(row)}>
            {onRowClick ?
          <button
            type="button"
            onClick={() => onRowClick(row)}
            className="w-full px-4 py-3.5 text-left transition-colors duration-150 ease-smooth hover:bg-navy-50/60">
            
                {mobileCard(row)}
              </button> :

          <div className="px-4 py-3.5">{mobileCard(row)}</div>
          }
          </li>
        )}
      </ul>
    </div>);

}