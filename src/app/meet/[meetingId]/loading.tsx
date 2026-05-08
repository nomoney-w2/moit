export default function Loading() {
  return (
    <div className='min-h-screen-safe flex flex-col bg-white pt-14 pb-25'>
      <div className='fixed top-0 right-0 left-0 z-50 mx-auto h-14 w-full max-w-screen-sm bg-white' />
      <div className='flex-1 px-5 py-4'>
        <div className='mb-4 h-8 w-40 animate-pulse rounded bg-gray-100' />
        <div className='flex flex-col gap-3'>
          <div className='h-20 animate-pulse rounded-lg bg-gray-100' />
          <div className='h-20 animate-pulse rounded-lg bg-gray-100' />
          <div className='h-20 animate-pulse rounded-lg bg-gray-100' />
        </div>
      </div>
      <div className='fixed right-0 bottom-0 left-0 z-50 mx-auto h-20 w-full max-w-screen-sm bg-white' />
    </div>
  );
}
