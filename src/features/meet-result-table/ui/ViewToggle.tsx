'use client';

import { type ViewMode } from '../model/useViewMode';

interface ViewToggleProps {
  mode: ViewMode;
  onToggle: () => void;
}

export default function ViewToggle({ mode, onToggle }: ViewToggleProps) {
  const isCalendar = mode === 'list';

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
          isCalendar ? 'translate-x-5.5' : 'translate-x-0.5'
        }`}
      >
        {isCalendar ? (
          <svg
            width='15'
            height='15'
            viewBox='0 0 10.3125 8.44375'
            fill='none'
            aria-hidden='true'
          >
            <path
              d='M2.96875 0.46875H9.84375M2.96875 4.21875H9.84375M2.96875 7.96875H9.84375M0.46875 0.46875V0.475M0.46875 4.21875V4.225M0.46875 7.96875V7.975'
              stroke='#6B7684'
              strokeWidth='0.9375'
              strokeLinecap='round'
              strokeLinejoin='round'
            />
          </svg>
        ) : (
          <svg
            width='15'
            height='15'
            viewBox='0 0 12.1875 12.1875'
            fill='none'
            aria-hidden='true'
          >
            <path
              d='M0.46875 4.84375H11.7188M4.84375 0.46875V11.7188M0.46875 1.71875C0.46875 1.38723 0.600446 1.06929 0.834866 0.834866C1.06929 0.600446 1.38723 0.46875 1.71875 0.46875H10.4688C10.8003 0.46875 11.1182 0.600446 11.3526 0.834866C11.5871 1.06929 11.7188 1.38723 11.7188 1.71875V10.4688C11.7188 10.8003 11.5871 11.1182 11.3526 11.3526C11.1182 11.5871 10.8003 11.7188 10.4688 11.7188H1.71875C1.38723 11.7188 1.06929 11.5871 0.834866 11.3526C0.600446 11.1182 0.46875 10.8003 0.46875 10.4688V1.71875Z'
              stroke='#6B7684'
              strokeWidth='0.9375'
              strokeLinecap='round'
              strokeLinejoin='round'
            />
          </svg>
        )}
      </span>
    </button>
  );
}
