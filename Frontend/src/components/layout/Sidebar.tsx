import React from 'react';
import { NavLink } from 'react-router-dom';
import { XIcon } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { UserRole } from '../../types/enums';
import { NAVIGATION, ROLE_PORTAL_LABEL } from './navigation';
import { Brand } from './Brand';

export function SidebarContent({
  role,
  onNavigate,
  onClose




}: {role: UserRole;onNavigate?: () => void;onClose?: () => void;}) {
  const items = NAVIGATION[role];
  const sections = Array.from(new Set(items.map((i) => i.section)));

  return (
    <div className="flex h-full flex-col bg-navy-900">
      <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-navy-800 px-4">
        <Brand subtitle={ROLE_PORTAL_LABEL[role]} />
        {onClose &&
        <button
          type="button"
          onClick={onClose}
          aria-label="Close navigation"
          className="rounded p-1 text-navy-300 transition-colors duration-150 ease-smooth hover:bg-navy-800 hover:text-white lg:hidden">
          
            <XIcon className="h-5 w-5" />
          </button>
        }
      </div>

      <nav className="scrollbar-thin flex-1 overflow-y-auto px-3 py-4" aria-label="Main">
        {sections.map((section) =>
        <div key={section} className="mb-5 last:mb-0">
            <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-wider text-navy-400">
              {section}
            </p>
            <ul className="space-y-0.5">
              {items.
            filter((i) => i.section === section).
            map((item) =>
            <li key={item.to}>
                    <NavLink
                to={item.to}
                onClick={onNavigate}
                className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium',
                  'transition-colors duration-150 ease-smooth',
                  isActive ?
                  'bg-navy-700 text-white' :
                  'text-navy-200 hover:bg-navy-800 hover:text-white'
                )
                }>
                
                      <item.icon className="h-4 w-4 shrink-0" aria-hidden />
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  </li>
            )}
            </ul>
          </div>
        )}
      </nav>
    </div>);

}