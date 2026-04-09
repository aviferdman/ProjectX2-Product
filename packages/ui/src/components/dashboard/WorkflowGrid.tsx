import { clsx } from 'clsx';
import { type HTMLAttributes, forwardRef } from 'react';
import type { WorkflowSummary } from './types.js';
import { WorkflowCard } from './WorkflowCard.js';

export interface WorkflowGridProps extends HTMLAttributes<HTMLDivElement> {
  workflows: WorkflowSummary[];
  onOpen?: ((id: string) => void) | undefined;
  onDuplicate?: ((id: string) => void) | undefined;
  onDelete?: ((id: string) => void) | undefined;
}

export const WorkflowGrid = forwardRef<HTMLDivElement, WorkflowGridProps>(
  ({ workflows, onOpen, onDuplicate, onDelete, className, ...rest }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          'grid gap-4',
          'grid-cols-[repeat(auto-fill,minmax(280px,1fr))]',
          className,
        )}
        {...rest}
      >
        {workflows.map((wf) => (
          <WorkflowCard
            key={wf.id}
            workflow={wf}
            onOpen={onOpen}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
          />
        ))}
      </div>
    );
  },
);

WorkflowGrid.displayName = 'WorkflowGrid';
