'use client';

import { type ViewMode } from '../model/useViewMode';

interface ViewToggleProps {
  mode: ViewMode;
  onToggle: () => void;
}

export default function ViewToggle({ mode, onToggle }: ViewToggleProps) {
  const isCalendar = mode === 'calendar';

  return (
    <button
      type='button'
      role='switch'
      aria-checked={isCalendar}
      aria-label='결과 보기 방식 전환'
      onClick={onToggle}
      className='relative flex h-7 w-12 items-center rounded-full bg-slate-200 transition-colors'
    >
      <span
        className={`absolute top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm transition-transform ${
          isCalendar ? 'translate-x-[22px]' : 'translate-x-0.5'
        }`}
      >
        {isCalendar ? (
          <svg
            width='14'
            height='14'
            viewBox='0 0 14 14'
            fill='none'
            aria-hidden='true'
          >
            <rect
              x='2'
              y='3'
              width='10'
              height='9'
              rx='1.2'
              stroke='#3C7EFA'
              strokeWidth='1.2'
            />
            <path
              d='M2 6h10'
              stroke='#3C7EFA'
              strokeWidth='1.2'
              strokeLinecap='round'
            />
            <path
              d='M5 1.5v2M9 1.5v2'
              stroke='#3C7EFA'
              strokeWidth='1.2'
              strokeLinecap='round'
            />
          </svg>
        ) : (
          <svg
            width='14'
            height='14'
            viewBox='0 0 14 14'
            fill='none'
            aria-hidden='true'
          >
            <rect
              x='2'
              y='2'
              width='10'
              height='10'
              rx='1.2'
              stroke='#3C7EFA'
              strokeWidth='1.2'
            />
            <path
              d='M7 2v10M2 7h10'
              stroke='#3C7EFA'
              strokeWidth='1.2'
              strokeLinecap='round'
            />
          </svg>
        )}
      </span>
    </button>
  );
}
