import React from 'react';
import { cn } from '../../lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

export type UIButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variantClass: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-600 text-white border border-brand-600 hover:bg-brand-500 focus-visible:ring-brand-400 disabled:bg-brand-800/40 disabled:border-brand-800/40',
  secondary:
    'bg-[var(--ui-surface-2)] text-[var(--ui-text)] border border-[var(--ui-border)] hover:bg-[var(--ui-surface-3)] focus-visible:ring-brand-400',
  ghost:
    'bg-transparent text-[var(--ui-text-muted)] border border-transparent hover:bg-[var(--ui-surface-2)] hover:text-[var(--ui-text)] focus-visible:ring-brand-400',
  danger:
    'bg-rose-600 text-white border border-rose-600 hover:bg-rose-500 focus-visible:ring-rose-400 disabled:bg-rose-900/40 disabled:border-rose-900/40',
};

const sizeClass: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-xs rounded-lg gap-1.5',
  md: 'h-10 px-4 text-sm rounded-xl gap-2',
  lg: 'h-11 px-5 text-sm rounded-xl gap-2',
};

export function Button({
  variant = 'secondary',
  size = 'md',
  className,
  type = 'button',
  ...props
}: UIButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ui-bg)] disabled:cursor-not-allowed disabled:opacity-60 min-h-10',
        variantClass[variant],
        sizeClass[size],
        className,
      )}
      {...props}
    />
  );
}
