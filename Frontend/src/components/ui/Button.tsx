import React from 'react';
import { Loader2Icon } from 'lucide-react';
import { cn } from '../../utils/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'link';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary:
  'bg-navy-600 text-white border border-navy-600 hover:bg-navy-700 hover:border-navy-700 disabled:bg-navy-300 disabled:border-navy-300',
  secondary:
  'bg-white text-navy-900 border border-slate-300 hover:bg-slate-50 hover:border-slate-400 disabled:text-slate-400',
  ghost: 'bg-transparent text-navy-700 border border-transparent hover:bg-navy-50',
  danger:
  'bg-rejected-solid text-white border border-rejected-solid hover:bg-red-800 hover:border-red-800',
  link: 'bg-transparent text-navy-600 border border-transparent underline underline-offset-2 hover:text-navy-800 px-0'
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-sm gap-2'
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  fullWidth,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium',
        'transition-colors duration-150 ease-smooth',
        'disabled:cursor-not-allowed disabled:opacity-70',
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className
      )}
      {...rest}>
      
      {loading ?
      <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden /> :

      icon
      }
      {children}
    </button>);

}