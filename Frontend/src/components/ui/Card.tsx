import React from 'react';
import { cn } from '../../utils/cn';

export function Card({
  className,
  children,
  as: Tag = 'section'




}: {className?: string;children: React.ReactNode;as?: 'section' | 'div' | 'article' | 'aside';}) {
  return (
    <Tag className={cn('rounded-lg border border-slate-200 bg-white shadow-card', className)}>
      {children}
    </Tag>);

}

export function CardHeader({
  title,
  description,
  action,
  className





}: {title: React.ReactNode;description?: React.ReactNode;action?: React.ReactNode;className?: string;}) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-5 py-4',
        className
      )}>
      
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-navy-900">{title}</h2>
        {description && <p className="mt-0.5 text-[13px] text-slate-500">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>);

}

export function CardBody({ className, children }: {className?: string;children: React.ReactNode;}) {
  return <div className={cn('p-5', className)}>{children}</div>;
}

export function CardFooter({
  className,
  children



}: {className?: string;children: React.ReactNode;}) {
  return (
    <div className={cn('border-t border-slate-200 bg-slate-50/60 px-5 py-3', className)}>
      {children}
    </div>);

}