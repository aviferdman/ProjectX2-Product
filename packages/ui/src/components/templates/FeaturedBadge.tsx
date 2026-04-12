import React, { forwardRef } from 'react';
import { clsx } from 'clsx';

export interface FeaturedBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant: 'featured' | 'popular';
}

const variants = {
  featured: {
    bg: 'bg-tpl-badge-featured-bg',
    text: 'text-tpl-badge-featured-text',
    border: 'border-tpl-badge-featured-border',
    label: '★ Featured',
  },
  popular: {
    bg: 'bg-tpl-badge-popular-bg',
    text: 'text-tpl-badge-popular-text',
    border: 'border-tpl-badge-popular-border',
    label: '🔥 Popular',
  },
};

export const FeaturedBadge = forwardRef<HTMLSpanElement, FeaturedBadgeProps>(function FeaturedBadge(
  { variant, className, ...props },
  ref,
) {
  const style = variants[variant];
  return (
    <span
      ref={ref}
      className={clsx(
        'inline-flex items-center rounded-sm border px-1.5',
        'text-tpl-badge font-semibold uppercase tracking-wider',
        'h-tpl-badge-h',
        style.bg,
        style.text,
        style.border,
        className,
      )}
      {...props}
    >
      {style.label}
    </span>
  );
});
