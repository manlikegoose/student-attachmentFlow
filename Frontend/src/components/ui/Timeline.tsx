import React from 'react';
import { CheckIcon, MinusIcon } from 'lucide-react';
import { cn } from '../../utils/cn';
import type { TimelineStep } from '../../domain/rules';

/**
 * The lifecycle timeline. Steps are derived from the application and placement records
 * (see `buildLifecycleTimeline`) so the display can never disagree with the data.
 */
export function Timeline({ steps, className }: {steps: TimelineStep[];className?: string;}) {
  return (
    <ol className={cn('relative space-y-0', className)}>
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        return (
          <li key={step.key} className="relative flex gap-3 pb-5 last:pb-0">
            {!isLast &&
            <span
              aria-hidden
              className={cn(
                'absolute left-[11px] top-6 h-[calc(100%-1rem)] w-px',
                step.state === 'complete' ? 'bg-approved-solid/40' : 'bg-slate-200'
              )} />

            }
            <span
              className={cn(
                'relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold',
                step.state === 'complete' && 'border-approved-border bg-approved-solid text-white',
                step.state === 'current' && 'border-navy-600 bg-white text-navy-700 ring-4 ring-navy-100',
                step.state === 'upcoming' && 'border-slate-200 bg-white text-slate-400',
                step.state === 'blocked' && 'border-slate-200 bg-slate-100 text-slate-400'
              )}>
              
              {step.state === 'complete' ?
              <CheckIcon className="h-3.5 w-3.5" aria-hidden /> :
              step.state === 'blocked' ?
              <MinusIcon className="h-3 w-3" aria-hidden /> :

              i + 1
              }
            </span>
            <div className="min-w-0 pt-0.5">
              <p
                className={cn(
                  'text-[13px] font-medium',
                  step.state === 'complete' && 'text-navy-900',
                  step.state === 'current' && 'text-navy-900',
                  (step.state === 'upcoming' || step.state === 'blocked') && 'text-slate-400'
                )}>
                
                {step.label}
              </p>
              {step.detail && <p className="mt-0.5 text-[12px] text-slate-500">{step.detail}</p>}
              {step.state === 'current' &&
              <p className="mt-0.5 text-[12px] text-navy-600">In progress</p>
              }
            </div>
          </li>);

      })}
    </ol>);

}

/** Compact horizontal variant used inside dense list rows. */
export function TimelineProgress({ steps }: {steps: TimelineStep[];}) {
  const done = steps.filter((s) => s.state === 'complete').length;
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5" aria-hidden>
        {steps.map((s) =>
        <span
          key={s.key}
          className={cn(
            'h-1.5 w-3 rounded-full',
            s.state === 'complete' && 'bg-approved-solid',
            s.state === 'current' && 'bg-navy-600',
            s.state === 'upcoming' && 'bg-slate-200',
            s.state === 'blocked' && 'bg-slate-200'
          )} />

        )}
      </div>
      <span className="text-[12px] tabular-nums text-slate-500">
        {done}/{steps.length}
      </span>
    </div>);

}