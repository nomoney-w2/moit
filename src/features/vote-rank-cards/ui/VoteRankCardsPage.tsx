/**
 * @deprecated [#73, 2026-05-07] 운영 결과 페이지는 `MeetResultTablePage`(meet-result-table feature) 가 토글로 표/카드 뷰를 모두 처리. 본 standalone 페이지는 `/test/vote-rank-cards` 만 사용.
 * Replacement: `MeetResultTablePage`
 * Removal target: test 라우트와 함께 별도 정리 PR.
 */
'use client';

import { useMemo } from 'react';

import { toRankedSlots } from '@/features/vote-rank-cards/lib/toRankedSlots';
import type { MeetingVoteSnapshot } from '@/features/vote-rank-cards/lib/types';
import { useVoteRankCardToggle } from '@/features/vote-rank-cards/model/useVoteRankCardToggle';
import VoteRankCardEmptyState from '@/features/vote-rank-cards/ui/VoteRankCardEmptyState';
import VoteRankCardList from '@/features/vote-rank-cards/ui/VoteRankCardList';
import TopBar from '@/shared/ui/top-bar/TopBar';

interface VoteRankCardsPageProps {
  snapshot: MeetingVoteSnapshot;
}

export default function VoteRankCardsPage({
  snapshot,
}: VoteRankCardsPageProps) {
  const result = useMemo(() => toRankedSlots(snapshot), [snapshot]);
  const { openIds, toggle } = useVoteRankCardToggle();

  const topBarTitle = `${result.hostName}님이 초대한 ${result.meetingTitle}`;

  return (
    <main className='flex min-h-screen flex-col bg-gray-50'>
      <TopBar
        title={topBarTitle}
        leftIcon='ic_calendar_add'
        rightIcon='ic_other_share'
        className='bg-gray-0'
      />

      <header className='bg-gray-0 flex items-center justify-between px-5 pt-2 pb-4'>
        <p className='text-title-4 font-bold text-gray-900'>
          <span className='text-primary-default'>{result.totalVoters}</span>명이
          투표했어요
        </p>
        <ViewToggle />
      </header>

      <section className='flex-1 px-5 py-4'>
        {result.isEmpty ? (
          <VoteRankCardEmptyState />
        ) : (
          <VoteRankCardList
            result={result}
            openIds={openIds}
            onToggle={toggle}
          />
        )}
      </section>

      <footer className='bg-gray-0 sticky bottom-0 flex gap-2 border-t border-gray-200 px-5 py-4'>
        <button
          type='button'
          className='bg-gray-0 text-button-1 flex-1 rounded-xl border border-gray-300 py-4 font-semibold text-gray-700'
        >
          투표 수정하기
        </button>
        <button
          type='button'
          className='bg-primary-default text-button-1 text-gray-0 flex-[1.4] rounded-xl py-4 font-semibold'
        >
          투표하기
        </button>
      </footer>
    </main>
  );
}

function ViewToggle() {
  return (
    <div
      aria-hidden
      className='flex h-8 w-14 items-center rounded-full border border-gray-200 bg-gray-50 p-0.5'
    >
      <span className='bg-gray-0 flex h-7 w-7 items-center justify-center rounded-full' />
      <span className='text-caption-1 ml-auto flex h-7 w-7 items-center justify-center rounded-full text-gray-400'>
        ≡
      </span>
    </div>
  );
}
