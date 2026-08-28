import React from 'react';
import { cn } from '../../utils/cn';
import { initials as toInitials } from '../../utils/format';

export function Avatar({
  name,
  size = 'md',
  tone = 'navy',
  className





}: {name: string;size?: 'xs' | 'sm' | 'md' | 'lg';tone?: 'navy' | 'slate';className?: string;}) {
  const sizes = {
    xs: 'h-6 w-6 text-[10px]',
    sm: 'h-8 w-8 text-[11px]',
    md: 'h-10 w-10 text-[13px]',
    lg: 'h-14 w-14 text-base'
  };
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold',
        tone === 'navy' ? 'bg-navy-100 text-navy-700' : 'bg-slate-200 text-slate-700',
        sizes[size],
        className
      )}>
      
      {toInitials(name)}
    </span>);

}

export function CompanyLogo({
  logoText,
  size = 'md',
  className




}: {logoText: string;size?: 'sm' | 'md' | 'lg';className?: string;}) {
  const sizes = {
    sm: 'h-8 w-8 text-[11px] rounded-md',
    md: 'h-10 w-10 text-[13px] rounded-md',
    lg: 'h-14 w-14 text-lg rounded-lg'
  };
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center bg-navy-900 font-semibold text-white',
        sizes[size],
        className
      )}>
      
      {logoText}
    </span>);

}