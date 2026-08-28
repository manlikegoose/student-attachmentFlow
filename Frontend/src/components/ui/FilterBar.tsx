import React from 'react';
import { FilterXIcon } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from './Button';
import { Select } from './Form';
import type { SelectOption } from './Form';

export interface FilterDefinition {
  key: string;
  label: string;
  value: string;
  options: SelectOption[];
}

export function FilterBar({
  filters,
  onChange,
  onReset,
  children,
  className






}: {filters: FilterDefinition[];onChange: (key: string, value: string) => void;onReset?: () => void;children?: React.ReactNode;className?: string;}) {
  const hasActive = filters.some((f) => f.value);
  return (
    <div className={cn('flex flex-wrap items-end gap-3', className)}>
      {children}
      {filters.map((f) =>
      <div key={f.key} className="min-w-[9rem] flex-1 sm:max-w-[12rem]">
          <label
          htmlFor={`filter-${f.key}`}
          className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-500">
          
            {f.label}
          </label>
          <Select
          id={`filter-${f.key}`}
          value={f.value}
          options={f.options}
          placeholder={`All ${f.label.toLowerCase()}`}
          onChange={(e) => onChange(f.key, e.target.value)} />
        
        </div>
      )}
      {hasActive && onReset &&
      <Button
        variant="ghost"
        size="md"
        onClick={onReset}
        icon={<FilterXIcon className="h-3.5 w-3.5" />}>
        
          Clear
        </Button>
      }
    </div>);

}