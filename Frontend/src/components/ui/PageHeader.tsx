import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRightIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface Crumb {
  label: string;
  to?: string;
}

export function Breadcrumbs({ items }: {items: Crumb[];}) {
  if (items.length === 0) return null;
  return (
    <nav aria-label="Breadcrumb" className="mb-2">
      <ol className="flex flex-wrap items-center gap-1 text-[12px] text-slate-500">
        {items.map((item, i) =>
        <li key={`${item.label}-${i}`} className="flex items-center gap-1">
            {item.to ?
          <Link
            to={item.to}
            className="transition-colors duration-150 ease-smooth hover:text-navy-700">
            
                {item.label}
              </Link> :

          <span className="text-slate-700">{item.label}</span>
          }
            {i < items.length - 1 && <ChevronRightIcon className="h-3 w-3 text-slate-300" aria-hidden />}
          </li>
        )}
      </ol>
    </nav>);

}

export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
  meta,
  className







}: {title: string;description?: React.ReactNode;actions?: React.ReactNode;breadcrumbs?: Crumb[];meta?: React.ReactNode;className?: string;}) {
  return (
    <header className={cn('mb-6', className)}>
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-navy-900 sm:text-2xl">{title}</h1>
          {description &&
          <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-slate-500">{description}</p>
          }
          {meta && <div className="mt-2.5 flex flex-wrap items-center gap-2">{meta}</div>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>);

}