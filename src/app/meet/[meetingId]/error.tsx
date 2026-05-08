'use client';

import { useEffect } from 'react';

import Button from '@/shared/ui/button/Button';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[/meet/[meetingId]] error:', error);
  }, [error]);

  return (
    <div className='min-h-screen-safe flex flex-col items-center justify-center bg-white px-5'>
      <div className='flex flex-col items-center gap-3 text-center'>
        <p className='text-title-4 font-bold text-gray-900'>
          모임을 불러오지 못했어요
        </p>
        <p className='text-body-4 text-text-secondary'>
          잠시 후 다시 시도해주세요.
        </p>
      </div>
      <div className='mt-6 w-full max-w-xs'>
        <Button onClick={() => reset()} fullWidth>
          다시 시도
        </Button>
      </div>
    </div>
  );
}
