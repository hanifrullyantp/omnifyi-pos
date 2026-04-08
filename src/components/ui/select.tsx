import React from 'react';
import { cn } from '../../lib/utils';

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, children, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      className={cn(
        'h-10 w-full rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface-2)] px-3 text-sm text-[var(--ui-text)] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ui-bg)]',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
});
