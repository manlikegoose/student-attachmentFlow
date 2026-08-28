import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { BRAND } from '../../config/brand';

export function Brand({
  to = '/',
  tone = 'dark',
  subtitle,
  className





}: {to?: string;tone?: 'dark' | 'light';subtitle?: string;className?: string;}) {
  return (
    <Link to={to} className={cn('flex items-center gap-2.5', className)}>
      <span
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-md text-[13px] font-bold',
          tone === 'dark' ? 'bg-white text-navy-900' : 'bg-navy-900 text-white'
        )}
        aria-hidden>
        
        {BRAND.shortName}
      </span>
      <span className="min-w-0">
        <span
          className={cn(
            'block truncate text-[15px] font-semibold leading-tight tracking-tight',
            tone === 'dark' ? 'text-white' : 'text-navy-900'
          )}>
          
          {BRAND.name}
        </span>
        {subtitle &&
        <span
          className={cn(
            'block truncate text-[11px] leading-tight',
            tone === 'dark' ? 'text-navy-300' : 'text-slate-500'
          )}>
          
            {subtitle}
          </span>
        }
      </span>
    </Link>);

}