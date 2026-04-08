import React from 'react';
import { cn } from '../../lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        'h-10 w-full rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface-2)] px-3 text-sm text-[var(--ui-text)] placeholder:text-[var(--ui-placeholder)] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ui-bg)]',
        className,
      )}
      {...props}
    />
  );
});
