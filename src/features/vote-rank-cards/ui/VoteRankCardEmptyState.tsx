export default function VoteRankCardEmptyState() {
  return (
    <div className='flex flex-col items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-6 py-10 text-center'>
      <p className='text-body-2 font-medium text-gray-700'>
        아직 투표한 사람이 없어요
      </p>
      <p className='text-body-4 text-gray-500'>
        모임원들이 투표를 마치면 결과가 여기에 표시돼요.
      </p>
    </div>
  );
}
