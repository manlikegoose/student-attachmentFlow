import React from 'react';
import { cn } from '../../utils/cn';
import { RATING_LABELS, RATING_SCALE } from '../../types/enums';
import type { Rating } from '../../types/enums';

/** The 1–5 evaluation rubric control. Labels are shown, not just numbers. */
export function RatingInput({
  name,
  label,
  value,
  onChange,
  disabled






}: {name: string;label: string;value: Rating;onChange: (value: Rating) => void;disabled?: boolean;}) {
  return (
    <fieldset className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 py-3 last:border-0">
      <legend className="sr-only">{label}</legend>
      <span className="text-[13px] font-medium text-navy-900">{label}</span>
      <div className="flex items-center gap-1.5">
        {RATING_SCALE.map((score) => {
          const selected = value === score;
          return (
            <label
              key={score}
              title={RATING_LABELS[score]}
              className={cn(
                'flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border text-[13px] font-medium',
                'transition-colors duration-150 ease-smooth',
                selected ?
                'border-navy-600 bg-navy-600 text-white' :
                'border-slate-300 bg-white text-slate-600 hover:border-navy-400',
                disabled && 'cursor-not-allowed opacity-60'
              )}>
              
              <input
                type="radio"
                name={name}
                value={score}
                checked={selected}
                disabled={disabled}
                onChange={() => onChange(score)}
                className="sr-only" />
              
              {score}
            </label>);

        })}
        <span className="ml-2 hidden w-32 text-[12px] text-slate-500 sm:inline">
          {RATING_LABELS[value]}
        </span>
      </div>
    </fieldset>);

}

export function RatingDisplay({ label, value }: {label: string;value: Rating;}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-2.5 last:border-0">
      <span className="text-[13px] text-slate-600">{label}</span>
      <div className="flex items-center gap-2">
        <div className="flex gap-0.5" aria-hidden>
          {RATING_SCALE.map((s) =>
          <span
            key={s}
            className={cn('h-1.5 w-5 rounded-full', s <= value ? 'bg-navy-600' : 'bg-slate-200')} />

          )}
        </div>
        <span className="w-32 text-right text-[12px] font-medium text-navy-900">
          {value} · {RATING_LABELS[value]}
        </span>
      </div>
    </div>);

}