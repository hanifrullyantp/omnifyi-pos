import React from 'react';
import { cn } from '../../lib/utils';
import { Card, CardBody } from './card';

type StatCardProps = {
  label: string;
  value: string;
  helper?: string;
  accent?: 'primary' | 'success' | 'warning' | 'danger' | 'muted';
};

const accentMap = {
  primary: 'before:bg-brand-500',
  success: 'before:bg-emerald-500',
  warning: 'before:bg-amber-500',
  danger: 'before:bg-rose-500',
  muted: 'before:bg-slate-500',
} as const;

export function StatCard({ label, value, helper, accent = 'primary' }: StatCardProps) {
  return (
    <Card className={cn('relative overflow-hidden before:absolute before:left-0 before:top-0 before:h-full before:w-1', accentMap[accent])}>
      <CardBody className="space-y-1.5">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--ui-text-muted)]">{label}</p>
        <p className="text-2xl font-bold leading-tight text-[var(--ui-text)]">{value}</p>
        {helper ? <p className="text-xs text-[var(--ui-text-dim)]">{helper}</p> : null}
      </CardBody>
    </Card>
  );
}
