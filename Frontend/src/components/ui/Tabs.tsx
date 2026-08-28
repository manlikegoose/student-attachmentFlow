import React from 'react';
import { cn } from '../../utils/cn';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

export function Tabs({
  items,
  active,
  onChange,
  className





}: {items: TabItem[];active: string;onChange: (id: string) => void;className?: string;}) {
  return (
    <div className={cn('scrollbar-thin overflow-x-auto border-b border-slate-200', className)}>
      <div role="tablist" className="flex min-w-max gap-1">
        {items.map((item) => {
          const selected = item.id === active;
          return (
            <button
              key={item.id}
              role="tab"
              type="button"
              aria-selected={selected}
              onClick={() => onChange(item.id)}
              className={cn(
                'relative -mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-3.5 py-2.5 text-[13px] font-medium',
                'transition-colors duration-150 ease-smooth',
                selected ?
                'border-navy-600 text-navy-900' :
                'border-transparent text-slate-500 hover:text-navy-800'
              )}>
              
              {item.label}
              {item.count !== undefined &&
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[11px] tabular-nums',
                  selected ? 'bg-navy-100 text-navy-800' : 'bg-slate-100 text-slate-600'
                )}>
                
                  {item.count}
                </span>
              }
            </button>);

        })}
      </div>
    </div>);

}