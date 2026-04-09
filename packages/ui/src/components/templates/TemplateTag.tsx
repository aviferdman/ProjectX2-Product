import React, { forwardRef } from 'react';
import { clsx } from 'clsx';

export interface TemplateTagProps extends React.HTMLAttributes<HTMLSpanElement> {
  label: string;
}

export const TemplateTag = forwardRef<HTMLSpanElement, TemplateTagProps>(
  function TemplateTag({ label, className, ...props }, ref) {
    return (
      <span
        ref={ref}
        className={clsx(
          'inline-flex items-center rounded-sm border border-tpl-tag-bg/20',
          'bg-tpl-tag-bg text-tpl-tag-text',
          'h-tpl-tag-h px-1.5',
          'text-tpl-tag',
          'transition-colors duration-100',
          'hover:bg-tpl-tag-bg-hover hover:text-tpl-tag-text-hover',
          className,
        )}
        {...props}
      >
        {label}
      </span>
    );
  },
);
