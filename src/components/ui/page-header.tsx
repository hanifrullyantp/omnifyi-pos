import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { cn } from '../../lib/utils';

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  backHref?: string;
  actions?: React.ReactNode;
  className?: string;
};

export function PageHeader({ title, subtitle, backHref, actions, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-20 border-b border-[var(--ui-border)] bg-[var(--ui-surface)]/95 backdrop-blur px-4 py-3',
        className,
      )}
    >
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {backHref ? (
              <Link
                to={backHref}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--ui-border)] bg-[var(--ui-surface-2)] text-[var(--ui-text-muted)] hover:text-[var(--ui-text)]"
                aria-label="Kembali"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
            ) : null}
            <h1 className="truncate text-lg font-bold text-[var(--ui-text)]">{title}</h1>
          </div>
          {subtitle ? <p className="mt-1 text-sm text-[var(--ui-text-muted)]">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
