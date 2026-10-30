import React from 'react';
import { cn } from '../../utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline' | 'info';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  size = 'sm',
  children,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center font-medium rounded-full transition-colors select-none';

  const variants = {
    default: 'bg-slate-100 text-slate-700 border border-slate-200/60',
    primary: 'bg-indigo-50 text-indigo-700 border border-indigo-200/60 font-semibold',
    secondary: 'bg-slate-100 text-slate-800',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-semibold',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200/60 font-semibold',
    destructive: 'bg-rose-50 text-rose-700 border border-rose-200/60 font-semibold',
    info: 'bg-sky-50 text-sky-700 border border-sky-200/60 font-semibold',
    outline: 'border border-slate-300 text-slate-700 bg-transparent',
  };

  const sizes = {
    sm: 'px-2.5 py-0.5 text-xs gap-1',
    md: 'px-3 py-1 text-sm gap-1.5',
  };

  return (
    <div className={cn(baseStyles, variants[variant], sizes[size], className)} {...props}>
      {children}
    </div>
  );
};
