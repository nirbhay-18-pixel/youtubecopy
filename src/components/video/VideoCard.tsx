import React from 'react';
import { Link } from 'react-router-dom';
import type { YouTubeVideo, YouTubeSearchResult } from '../../types/youtube';
import { parseDuration, formatViewCount, formatPublishedDate } from '../../services/youtube/videos';

interface VideoCardProps {
  video: YouTubeVideo | YouTubeSearchResult;
  layout?: 'grid' | 'list';
}

function isSearchResult(item: YouTubeVideo | YouTubeSearchResult): item is YouTubeSearchResult {
  return 'id' in item && typeof item.id === 'object' && item.id !== null;
}

function getVideoId(item: YouTubeVideo | YouTubeSearchResult): string {
  if (isSearchResult(item)) {
    return item.id.videoId || '';
  }
  return item.id;
}

function getThumbnail(item: YouTubeVideo | YouTubeSearchResult): string {
  const thumbs = item.snippet.thumbnails;
  return thumbs.maxres?.url || thumbs.high?.url || thumbs.medium?.url || thumbs.default?.url || '';
}

function getTitle(item: YouTubeVideo | YouTubeSearchResult): string {
  return item.snippet.title;
}

function getChannelTitle(item: YouTubeVideo | YouTubeSearchResult): string {
  return item.snippet.channelTitle;
}

function getChannelId(item: YouTubeVideo | YouTubeSearchResult): string {
  return item.snippet.channelId;
}

function getPublishedAt(item: YouTubeVideo | YouTubeSearchResult): string {
  return item.snippet.publishedAt;
}

function getDuration(item: YouTubeVideo | YouTubeSearchResult): string {
  if (isSearchResult(item)) return '';
  return item.contentDetails?.duration ? parseDuration(item.contentDetails.duration) : '';
}

function getViewCount(item: YouTubeVideo | YouTubeSearchResult): string {
  if (isSearchResult(item)) return '';
  return item.statistics?.viewCount ? formatViewCount(item.statistics.viewCount) : '';
}

export function VideoCard({ video, layout = 'grid' }: VideoCardProps) {
  const videoId = getVideoId(video);
  const thumbnail = getThumbnail(video);
  const title = getTitle(video);
  const channelTitle = getChannelTitle(video);
  const channelId = getChannelId(video);
  const publishedAt = getPublishedAt(video);
  const duration = getDuration(video);
  const viewCount = getViewCount(video);

  if (!videoId) return null;

  if (layout === 'list') {
    return (
      <Link 
        to={`/watch/${videoId}`}
        className="flex flex-col sm:flex-row gap-4 no-underline group"
      >
        {/* Thumbnail */}
        <div className="relative w-full sm:w-72 flex-shrink-0">
          <div className="aspect-video rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-800">
            <img
              src={thumbnail}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              loading="lazy"
            />
          </div>
          {duration && (
            <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-medium">
              {duration}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-medium line-clamp-2 mb-1" style={{ color: 'var(--text-primary)' }}>
            {title}
          </h3>
          <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
            {viewCount}{viewCount && ' • '}{formatPublishedDate(publishedAt)}
          </p>
          <Link
            to={`/channel/${channelId}`}
            className="text-sm no-underline hover:opacity-80"
            style={{ color: 'var(--text-secondary)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {channelTitle}
          </Link>
          <p className="text-sm line-clamp-2 mt-2 hidden sm:block" style={{ color: 'var(--text-muted)' }}>
            {video.snippet.description}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link 
      to={`/watch/${videoId}`}
      className="flex flex-col no-underline group"
    >
      {/* Thumbnail */}
      <div className="relative w-full">
        <div className="aspect-video rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--bg-hover)' }}>
          <img
            src={thumbnail}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            loading="lazy"
          />
        </div>
        {duration && (
          <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-medium">
            {duration}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex gap-3 mt-3">
        <Link
          to={`/channel/${channelId}`}
          className="flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-9 h-9 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-hover)' }}>
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(channelTitle)}&background=6366f1&color=fff&size=36`}
              alt={channelTitle}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium line-clamp-2 leading-5 mb-1" style={{ color: 'var(--text-primary)' }}>
            {title}
          </h3>
          <Link
            to={`/channel/${channelId}`}
            className="text-xs no-underline hover:opacity-80 block"
            style={{ color: 'var(--text-secondary)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {channelTitle}
          </Link>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {viewCount}{viewCount && ' • '}{formatPublishedDate(publishedAt)}
          </p>
        </div>
      </div>
    </Link>
  );
}

// Related video card (compact)
export function RelatedVideoCard({ video }: { video: YouTubeVideo | YouTubeSearchResult }) {
  const videoId = getVideoId(video);
  const thumbnail = getThumbnail(video);
  const title = getTitle(video);
  const channelTitle = getChannelTitle(video);
  const duration = getDuration(video);
  const viewCount = getViewCount(video);
  const publishedAt = getPublishedAt(video);

  if (!videoId) return null;

  return (
    <Link 
      to={`/watch/${videoId}`}
      className="flex gap-2 no-underline group"
    >
      <div className="relative w-40 sm:w-[168px] flex-shrink-0">
        <div className="aspect-video rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--bg-hover)' }}>
          <img
            src={thumbnail}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            loading="lazy"
          />
        </div>
        {duration && (
          <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 py-0.5 rounded">
            {duration}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium line-clamp-2 leading-5 mb-1" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h4>
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          {channelTitle}
        </p>
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          {viewCount}{viewCount && ' • '}{formatPublishedDate(publishedAt)}
        </p>
      </div>
    </Link>
  );
}
