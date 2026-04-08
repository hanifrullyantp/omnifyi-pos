import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';
import { Card, CardBody } from './card';
import { Button } from './button';

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <Card className="border-dashed">
      <CardBody className="flex flex-col items-center justify-center py-10 text-center">
        <div className="mb-3 rounded-full bg-[var(--ui-surface-2)] p-3 text-[var(--ui-text-dim)]">
          <Icon className="h-5 w-5" />
        </div>
        <p className="text-sm font-semibold text-[var(--ui-text)]">{title}</p>
        <p className="mt-1 max-w-md text-xs text-[var(--ui-text-muted)]">{description}</p>
        {actionLabel && onAction ? (
          <Button className="mt-4" variant="secondary" onClick={onAction}>
            {actionLabel}
          </Button>
        ) : null}
      </CardBody>
    </Card>
  );
}
