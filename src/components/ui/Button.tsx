import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'exam' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', loading = false, disabled, children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 disabled:pointer-events-none disabled:opacity-50 select-none active:scale-[0.98]';

    const variants = {
      default: 'bg-white text-slate-800 border border-slate-300 shadow-2xs hover:bg-slate-50 hover:border-slate-400',
      primary: 'bg-blue-600 text-white shadow-sm shadow-blue-500/25 hover:bg-blue-700 active:bg-blue-800',
      secondary: 'bg-slate-100 text-slate-700 border border-slate-200/80 hover:bg-slate-200/90 hover:text-slate-900',
      outline: 'border border-blue-300 text-blue-600 bg-transparent hover:bg-blue-50/70',
      ghost: 'text-slate-700 hover:bg-slate-100 hover:text-slate-900',
      destructive: 'bg-rose-600 text-white shadow-xs hover:bg-rose-700 active:bg-rose-800',
      exam: 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/20 hover:bg-emerald-700',
      success: 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700',
    };

    const sizes = {
      sm: 'h-7.5 px-2.5 text-xs gap-1',
      md: 'h-8.5 px-3 py-1 text-xs font-semibold gap-1.5',
      lg: 'h-9.5 px-4 text-xs font-bold gap-2',
      icon: 'h-8 w-8 p-0',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
