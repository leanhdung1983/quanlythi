import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  side?: 'right' | 'left' | 'bottom';
}

export const Sheet: React.FC<SheetProps> = ({ open, onOpenChange, children, side = 'right' }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false);
      }
    };
    if (open) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  const sideAnimations = {
    right: 'inset-y-0 right-0 h-full w-full max-w-xl border-l border-slate-200/80 shadow-2xl animate-in slide-in-from-right duration-300',
    left: 'inset-y-0 left-0 h-full w-full max-w-xl border-r border-slate-200/80 shadow-2xl animate-in slide-in-from-left duration-300',
    bottom: 'inset-x-0 bottom-0 max-h-[85vh] w-full rounded-t-3xl border-t border-slate-200/80 shadow-2xl animate-in slide-in-from-bottom duration-300',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={() => onOpenChange(false)}
      />
      {/* Panel */}
      <div
        className={cn(
          'fixed z-50 bg-white flex flex-col',
          sideAnimations[side]
        )}
      >
        {children}
      </div>
    </div>
  );
};

export const SheetHeader: React.FC<
  React.HTMLAttributes<HTMLDivElement> & { onClose?: () => void }
> = ({ className, children, onClose, ...props }) => (
  <div
    className={cn(
      'flex items-center justify-between border-b border-slate-100 px-6 py-4.5 bg-slate-50/50',
      className
    )}
    {...props}
  >
    <div className="flex flex-col space-y-1">{children}</div>
    {onClose && (
      <button
        onClick={onClose}
        className="rounded-xl p-2 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>
    )}
  </div>
);

export const SheetTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, ...props }) => (
  <h2 className={cn('text-base font-bold text-slate-900', className)} {...props} />
);

export const SheetDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className, ...props }) => (
  <p className={cn('text-xs text-slate-500', className)} {...props} />
);

export const SheetContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn('flex-1 overflow-y-auto p-6 space-y-4', className)} {...props} />
);

export const SheetFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div
    className={cn(
      'flex items-center justify-end gap-3 border-t border-slate-100 p-4 bg-slate-50/50',
      className
    )}
    {...props}
  />
);
