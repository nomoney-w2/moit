'use client';

import { type ViewMode } from '../model/useViewMode';
import ViewToggle from './ViewToggle';

interface ResultCountBarProps {
  voteCount: number;
  mode: ViewMode;
  onToggle: () => void;
}

export default function ResultCountBar({
  voteCount,
  mode,
  onToggle,
}: ResultCountBarProps) {
  return (
    <div className='flex items-center justify-between px-5 pt-6 pb-3'>
      <div className='text-headline-5 text-text-primary'>
        <span className='text-primary-default font-bold'>{voteCount}</span>
        <span>명이 투표했어요</span>
      </div>
      <ViewToggle mode={mode} onToggle={onToggle} />
    </div>
  );
}
