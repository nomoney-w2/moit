import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/shared/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-semibold',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary-default text-text-inverse hover:bg-primary-subtle',
        secondary: 'border-transparent bg-gray-100 text-gray-900',
        rank1: 'border-transparent bg-primary-default text-gray-0',
        rank2: 'border-transparent bg-primary-subtle text-gray-0',
        rank3: 'border-transparent bg-primary-subtle text-gray-0',
        rank4: 'border-transparent bg-gray-300 text-gray-700',
        rank5: 'border-transparent bg-gray-300 text-gray-700',
        outline: 'text-text-primary',
        rank_outline:
          'border border-primary-default bg-gray-0 text-primary-default',
      },
      size: {
        default: 'px-2 py-0.5 text-xs',
        sm: 'px-[6px] py-0 text-[10px] tracking-[-0.2px] leading-[16px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
