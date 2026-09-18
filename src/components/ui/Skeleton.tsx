import React from 'react';

export function VideoCardSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <div className="skeleton w-full aspect-video rounded-xl" />
      <div className="flex gap-3 mt-2">
        <div className="skeleton w-9 h-9 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-full rounded" />
          <div className="skeleton h-4 w-3/4 rounded" />
          <div className="skeleton h-3 w-1/2 rounded" />
        </div>
      </div>
    </div>
  );
}

export function VideoGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <VideoCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function WatchPageSkeleton() {
  return (
    <div className="max-w-[1800px] mx-auto p-4">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <div className="skeleton w-full aspect-video rounded-xl mb-4" />
          <div className="skeleton h-6 w-3/4 rounded mb-2" />
          <div className="skeleton h-4 w-1/2 rounded mb-4" />
          <div className="flex items-center gap-3 mb-4">
            <div className="skeleton w-10 h-10 rounded-full" />
            <div className="flex-1">
              <div className="skeleton h-4 w-32 rounded" />
            </div>
          </div>
          <div className="skeleton h-20 w-full rounded-xl" />
        </div>
        <div className="lg:w-[400px] space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex gap-2">
              <div className="skeleton w-40 h-[90px] rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-3 w-full rounded" />
                <div className="skeleton h-3 w-2/3 rounded" />
                <div className="skeleton h-3 w-1/2 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ChannelSkeleton() {
  return (
    <div>
      <div className="skeleton w-full h-32 md:h-48 rounded-lg mb-4" />
      <div className="flex items-center gap-4 mb-6">
        <div className="skeleton w-20 h-20 rounded-full" />
        <div className="space-y-2">
          <div className="skeleton h-6 w-48 rounded" />
          <div className="skeleton h-4 w-32 rounded" />
        </div>
      </div>
      <VideoGridSkeleton count={8} />
    </div>
  );
}

export function CommentSkeleton() {
  return (
    <div className="flex gap-3 mb-4">
      <div className="skeleton w-10 h-10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-3 w-24 rounded" />
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-3/4 rounded" />
      </div>
    </div>
  );
}

export function SearchSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex flex-col sm:flex-row gap-4">
          <div className="skeleton w-full sm:w-72 h-40 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-5 w-3/4 rounded" />
            <div className="skeleton h-3 w-1/3 rounded" />
            <div className="skeleton h-3 w-full rounded" />
            <div className="skeleton h-3 w-2/3 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
