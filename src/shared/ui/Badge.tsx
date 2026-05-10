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
        // 2026-04-29 이전 라이브 (moit.kr) 색상 복원: outline 스타일.
        // ReactDatepicker (vote-results-calendar) 의 캘린더 셀 뱃지가 라이브와 일치해야 함.
        rank1: 'border-primary-default bg-gray-0 text-primary-default',
        rank2: 'border-primary-default bg-gray-0 text-primary-default',
        rank3: 'border-primary-default bg-gray-0 text-primary-default',
        // @deprecated [#73] PR #72에서 추가됐으나 사용처 0. RankChip 자체 매핑이 있어 Badge 의존 없음. Removal: TODO-9.
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
