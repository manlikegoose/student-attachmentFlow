import React from 'react';
import { AlertCircleIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

const CONTROL =
'w-full rounded-md border bg-white px-3 text-sm text-navy-900 placeholder:text-slate-400 ' +
'transition-colors duration-150 ease-smooth focus:border-navy-500 focus:outline-none ' +
'focus:ring-2 focus:ring-navy-600/20 disabled:bg-slate-50 disabled:text-slate-500';

export interface FieldProps {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function Field({ label, htmlFor, error, hint, required, className, children }: FieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={htmlFor} className="block text-[13px] font-medium text-navy-900">
        {label}
        {required && <span className="ml-0.5 text-rejected-fg">*</span>}
      </label>
      {children}
      {error ?
      <p className="flex items-start gap-1 text-[12px] text-rejected-fg">
          <AlertCircleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>{error}</span>
        </p> :
      hint ?
      <p className="text-[12px] text-slate-500">{hint}</p> :
      null}
    </div>);

}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
{ className, invalid, ...rest },
ref)
{
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(CONTROL, 'h-10', invalid ? 'border-rejected-border' : 'border-slate-300', className)}
      {...rest} />);


});

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
{ className, invalid, rows = 4, ...rest },
ref)
{
  return (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cn(
        CONTROL,
        'py-2 leading-relaxed',
        invalid ? 'border-rejected-border' : 'border-slate-300',
        className
      )}
      {...rest} />);


});

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  placeholder?: string;
  invalid?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
{ options, placeholder, className, invalid, ...rest },
ref)
{
  return (
    <select
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        CONTROL,
        'h-10 appearance-none bg-[length:16px] bg-[right_0.6rem_center] bg-no-repeat pr-9',
        invalid ? 'border-rejected-border' : 'border-slate-300',
        className
      )}
      style={{
        backgroundImage:
        "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b' stroke-width='2'%3e%3cpath stroke-linecap='round' stroke-linejoin='round' d='M6 9l6 6 6-6'/%3e%3c/svg%3e\")"
      }}
      {...rest}>
      
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) =>
      <option key={o.value} value={o.value}>
          {o.label}
        </option>
      )}
    </select>);

});

export function Checkbox({
  label,
  className,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & {label: React.ReactNode;}) {
  return (
    <label className={cn('flex cursor-pointer items-start gap-2.5 text-sm text-navy-900', className)}>
      <input
        type="checkbox"
        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-navy-600 focus:ring-navy-600/30"
        {...rest} />
      
      <span>{label}</span>
    </label>);

}

/** Non-field-specific error surfaced from the API (DRF `detail`). */
export function FormError({ message }: {message?: string | null;}) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-md border border-rejected-border bg-rejected-bg px-3 py-2.5 text-[13px] text-rejected-fg">
      
      <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span>{message}</span>
    </div>);

}