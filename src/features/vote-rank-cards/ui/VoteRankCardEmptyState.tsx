import Icon from '@/shared/ui/icon/Icon';

export default function VoteRankCardEmptyState() {
  return (
    <div className='flex min-h-52 flex-col items-center justify-center gap-2.5 py-10'>
      <Icon name='ic_circle_x_filled' size={48} className='text-gray-300' />
      <p className='text-title-7 text-text-tertiary'>투표된 시간이 없어요</p>
    </div>
  );
}
