import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../../utils/cn';

export function Dropdown({
  trigger,
  children,
  align = 'right',
  width = 'w-72',
  label






}: {trigger: (props: {open: boolean;toggle: () => void;}) => React.ReactNode;children: (props: {close: () => void;}) => React.ReactNode;align?: 'left' | 'right';width?: string;label: string;}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      {trigger({ open, toggle: () => setOpen((v) => !v) })}
      <AnimatePresence>
        {open &&
        <motion.div
          role="menu"
          aria-label={label}
          initial={{ opacity: 0, y: -4, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.98 }}
          transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
          className={cn(
            'absolute z-40 mt-2 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-pop',
            align === 'right' ? 'right-0' : 'left-0',
            width
          )}>
          
            {children({ close: () => setOpen(false) })}
          </motion.div>
        }
      </AnimatePresence>
    </div>);

}

export function DropdownItem({
  onClick,
  children,
  icon,
  destructive





}: {onClick: () => void;children: React.ReactNode;icon?: React.ReactNode;destructive?: boolean;}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] transition-colors duration-150 ease-smooth',
        destructive ?
        'text-rejected-fg hover:bg-rejected-bg' :
        'text-navy-900 hover:bg-slate-50'
      )}>
      
      {icon}
      {children}
    </button>);

}