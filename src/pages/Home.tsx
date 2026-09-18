import React, { useState, useEffect, useCallback } from 'react';
import { getPopularVideos, getVideosByCategory, CATEGORY_IDS } from '../services/youtube/videos';
import { searchVideos, CATEGORY_QUERIES } from '../services/youtube/search';
import { VideoCard } from '../components/video/VideoCard';
import { VideoGridSkeleton } from '../components/ui/Skeleton';
import { YouTubeApiError } from '../services/youtube/client';
import type { YouTubeVideo, YouTubeSearchResult, CategoryFilter } from '../types/youtube';
import { AlertCircle, RefreshCw } from 'lucide-react';

const categories: CategoryFilter[] = [
  'All', 'Music', 'Gaming', 'Education', 'Programming',
  'Technology', 'Sports', 'News', 'Entertainment', 'Live'
];

export default function Home() {
  const [videos, setVideos] = useState<(YouTubeVideo | YouTubeSearchResult)[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('All');
  const [pageToken, setPageToken] = useState<string | undefined>();
  const [loadingMore, setLoadingMore] = useState(false);

  const loadVideos = useCallback(async (category: CategoryFilter, token?: string, append = false) => {
    try {
      if (!token) setLoading(true);
      else setLoadingMore(true);
      setError(null);

      let results: (YouTubeVideo | YouTubeSearchResult)[];
      let nextToken: string | undefined;

      if (category === 'All') {
        const response = await getPopularVideos('US', 20, token);
        results = response.items;
        nextToken = response.nextPageToken;
      } else if (category === 'Live') {
        const response = await searchVideos({ q: 'live', type: 'video', maxResults: 20 });
        results = response.items;
        nextToken = response.nextPageToken;
      } else {
        const categoryId = CATEGORY_IDS[category];
        if (categoryId) {
          const response = await getVideosByCategory(categoryId, 'US', 20, token);
          results = response.items;
          nextToken = response.nextPageToken;
        } else {
          const query = CATEGORY_QUERIES[category] || category;
          const response = await searchVideos({ q: query, type: 'video', maxResults: 20 });
          results = response.items;
          nextToken = response.nextPageToken;
        }
      }

      if (append) {
        setVideos(prev => [...prev, ...results]);
      } else {
        setVideos(results);
      }
      setPageToken(nextToken);
    } catch (err: unknown) {
      if (err instanceof YouTubeApiError) {
        if (err.code === 'API_KEY_MISSING') {
          setError('YouTube API key is not configured. Please add VITE_YOUTUBE_API_KEY to your environment variables and restart the application.');
        } else if (err.code === 'QUOTA_EXCEEDED') {
          setError('API quota exceeded. Please try again tomorrow.');
        } else {
          setError(`Error loading videos: ${err.message}`);
        }
      } else {
        setError('Failed to load videos. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadVideos(activeCategory);
  }, [activeCategory, loadVideos]);

  const handleCategoryChange = (category: CategoryFilter) => {
    setActiveCategory(category);
    setVideos([]);
    setPageToken(undefined);
  };

  const handleLoadMore = () => {
    if (pageToken && !loadingMore) {
      loadVideos(activeCategory, pageToken, true);
    }
  };

  const handleRetry = () => {
    loadVideos(activeCategory);
  };

  return (
    <div className="max-w-[2200px] mx-auto">
      {/* Category chips */}
      <div className="sticky top-14 z-20 py-3 px-4 border-b"
        style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}>
        <div className="flex gap-3 overflow-x-auto hide-scrollbar">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryChange(category)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === category ? '' : 'hover:opacity-80'
              }`}
              style={{
                backgroundColor: activeCategory === category ? 'var(--chip-active-bg)' : 'var(--chip-bg)',
                color: activeCategory === category ? 'var(--chip-active-text)' : 'var(--text-primary)',
              }}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {error ? (
          <div className="flex flex-col items-center justify-center py-20">
            <AlertCircle size={48} className="mb-4" style={{ color: 'var(--text-muted)' }} />
            <p className="text-lg font-medium mb-2 text-center max-w-md" style={{ color: 'var(--text-primary)' }}>
              {error}
            </p>
            <button
              onClick={handleRetry}
              className="mt-4 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors"
              style={{ backgroundColor: 'var(--chip-active-bg)', color: 'var(--chip-active-text)' }}
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        ) : loading ? (
          <VideoGridSkeleton count={16} />
        ) : videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              No videos found
            </p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Try selecting a different category
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
              {videos.map((video, index) => (
                <VideoCard key={`${'id' in video && typeof video.id === 'object' ? (video as YouTubeSearchResult).id.videoId : (video as YouTubeVideo).id}-${index}`} video={video} />
              ))}
            </div>
            
            {pageToken && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-6 py-2.5 rounded-full text-sm font-medium transition-colors disabled:opacity-50"
                  style={{ 
                    backgroundColor: 'var(--chip-active-bg)', 
                    color: 'var(--chip-active-text)' 
                  }}
                >
                  {loadingMore ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
