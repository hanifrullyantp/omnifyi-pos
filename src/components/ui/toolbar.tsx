import React from 'react';
import { Card, CardBody } from './card';
import { cn } from '../../lib/utils';

export function Toolbar({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={cn('rounded-xl', className)}>
      <CardBody className="flex flex-wrap items-end gap-3">{children}</CardBody>
    </Card>
  );
}
