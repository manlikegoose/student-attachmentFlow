import React, { useEffect, useState } from 'react';
import { SearchIcon, XIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  className,
  label






}: {value: string;onChange: (value: string) => void;placeholder?: string;className?: string;label?: string;}) {
  const [local, setLocal] = useState(value);

  useEffect(() => setLocal(value), [value]);

  // Debounced so filtering does not fire on every keystroke.
  useEffect(() => {
    if (local === value) return;
    const id = window.setTimeout(() => onChange(local), 250);
    return () => window.clearTimeout(id);
  }, [local, onChange, value]);

  return (
    <div className={cn('relative', className)}>
      <SearchIcon
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        aria-hidden />
      
      <input
        type="search"
        value={local}
        aria-label={label ?? placeholder}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-9 text-sm text-navy-900 placeholder:text-slate-400 transition-colors duration-150 ease-smooth focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-600/20" />
      
      {local &&
      <button
        type="button"
        aria-label="Clear search"
        onClick={() => {
          setLocal('');
          onChange('');
        }}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 transition-colors duration-150 ease-smooth hover:text-slate-700">
        
          <XIcon className="h-4 w-4" />
        </button>
      }
    </div>);

}