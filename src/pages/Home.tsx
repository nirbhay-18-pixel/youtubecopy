import React, { useState, useEffect, useCallback } from 'react';
import { getPopularVideos, getVideosByCategory, CATEGORY_IDS } from '../services/youtube/videos';
import { searchVideos, enrichSearchResults, CATEGORY_QUERIES } from '../services/youtube/search';
import { VideoCard } from '../components/video/VideoCard';
import { VideoGridSkeleton } from '../components/ui/Skeleton';
import { YouTubeApiError } from '../services/youtube/client';
import { getPublishedAfterDate } from '../utils/duration';
import type { YouTubeVideo, YouTubeSearchResult, CategoryFilter } from '../types/youtube';
import { AlertCircle, RefreshCw, TrendingUp, Clock, Flame } from 'lucide-react';

const categories: CategoryFilter[] = [
  'All', 'Music', 'Gaming', 'Education', 'Programming',
  'Technology', 'Sports', 'News', 'Entertainment', 'Live'
];

interface SectionData {
  title: string;
  icon: React.ReactNode;
  videos: (YouTubeVideo | YouTubeSearchResult)[];
  loading: boolean;
}

export default function Home() {
  const [popularVideos, setPopularVideos] = useState<(YouTubeVideo | YouTubeSearchResult)[]>([]);
  const [trendingVideos, setTrendingVideos] = useState<(YouTubeVideo | YouTubeSearchResult)[]>([]);
  const [latestVideos, setLatestVideos] = useState<(YouTubeVideo | YouTubeSearchResult)[]>([]);
  const [categoryVideos, setCategoryVideos] = useState<(YouTubeVideo | YouTubeSearchResult)[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('All');
  const [pageToken, setPageToken] = useState<string | undefined>();
  const [loadingMore, setLoadingMore] = useState(false);

  // Load all sections on mount
  useEffect(() => {
    const loadAllSections = async () => {
      setLoading(true);
      setError(null);

      try {
        // Load Popular videos (most popular in India)
        const popularResponse = await getPopularVideos('IN', 12);
        setPopularVideos(popularResponse.items);

        // Load Trending videos (search for trending content)
        const trendingSearch = await searchVideos({
          q: 'trending',
          type: 'video',
          maxResults: 12,
          order: 'viewCount',
          videoEmbeddable: true,
        });
        const trendingEnriched = await enrichSearchResults(trendingSearch);
        setTrendingVideos(trendingEnriched.items);

        // Load Latest videos (recent uploads)
        const latestSearch = await searchVideos({
          q: '',
          type: 'video',
          maxResults: 12,
          order: 'date',
          publishedAfter: getPublishedAfterDate('week'),
          videoEmbeddable: true,
        });
        const latestEnriched = await enrichSearchResults(latestSearch);
        setLatestVideos(latestEnriched.items);

        // Load category videos if not "All"
        if (activeCategory !== 'All') {
          await loadCategoryVideos(activeCategory);
        }
      } catch (err: unknown) {
        if (err instanceof YouTubeApiError) {
          if (err.code === 'API_KEY_MISSING') {
            setError('⚠️ YouTube API key is not configured.\n\nPlease add your API key to the .env file:\nVITE_YOUTUBE_API_KEY=your_key_here\n\nThen restart the development server.\n\nGet your API key at: https://console.cloud.google.com/apis/credentials');
          } else if (err.code === 'QUOTA_EXCEEDED') {
            setError('API quota exceeded. Please try again tomorrow.');
          } else if (err.code === 'API_KEY_INVALID') {
            setError('❌ Invalid API key. Please check your VITE_YOUTUBE_API_KEY in the .env file.');
          } else {
            setError(`Error loading videos: ${err.message}`);
          }
        } else {
          setError('Failed to load videos. Please check your connection and try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadAllSections();
  }, []);

  // Load category videos when category changes
  const loadCategoryVideos = async (category: CategoryFilter, token?: string, append = false) => {
    try {
      if (!token) setLoadingMore(true);

      let results: (YouTubeVideo | YouTubeSearchResult)[];
      let nextToken: string | undefined;

      if (category === 'Live') {
        const response = await searchVideos({ 
          q: 'live', 
          type: 'video', 
          maxResults: 20,
          videoEmbeddable: true,
        });
        const enriched = await enrichSearchResults(response);
        results = enriched.items;
        nextToken = enriched.nextPageToken;
      } else {
        const categoryId = CATEGORY_IDS[category];
        if (categoryId) {
          const response = await getVideosByCategory(categoryId, 'IN', 20, token);
          results = response.items;
          nextToken = response.nextPageToken;
        } else {
          const query = CATEGORY_QUERIES[category] || category;
          const response = await searchVideos({ 
            q: query, 
            type: 'video', 
            maxResults: 20,
            videoEmbeddable: true,
          });
          const enriched = await enrichSearchResults(response);
          results = enriched.items;
          nextToken = enriched.nextPageToken;
        }
      }

      if (append) {
        setCategoryVideos(prev => [...prev, ...results]);
      } else {
        setCategoryVideos(results);
      }
      setPageToken(nextToken);
    } catch (err: unknown) {
      console.error('Error loading category videos:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleCategoryChange = (category: CategoryFilter) => {
    setActiveCategory(category);
    setCategoryVideos([]);
    setPageToken(undefined);
    if (category !== 'All') {
      loadCategoryVideos(category);
    }
  };

  const handleLoadMore = () => {
    if (pageToken && !loadingMore && activeCategory !== 'All') {
      loadCategoryVideos(activeCategory, pageToken, true);
    }
  };

  const handleRetry = () => {
    window.location.reload();
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
            <p className="text-base font-medium mb-2 text-center max-w-lg whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>
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
        ) : activeCategory === 'All' ? (
          // Show sections when "All" is selected
          <div className="space-y-8">
            {/* Popular Section */}
            {popularVideos.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Flame size={24} style={{ color: 'var(--color-brand)' }} />
                  <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    Popular in India
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                  {popularVideos.map((video, index) => (
                    <VideoCard key={`popular-${index}`} video={video} />
                  ))}
                </div>
              </section>
            )}

            {/* Trending Section */}
            {trendingVideos.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={24} style={{ color: 'var(--color-brand)' }} />
                  <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    Trending Now
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                  {trendingVideos.map((video, index) => (
                    <VideoCard key={`trending-${index}`} video={video} />
                  ))}
                </div>
              </section>
            )}

            {/* Latest Section */}
            {latestVideos.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Clock size={24} style={{ color: 'var(--color-brand)' }} />
                  <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    Latest This Week
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                  {latestVideos.map((video, index) => (
                    <VideoCard key={`latest-${index}`} video={video} />
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          // Show category videos when a specific category is selected
          <>
            {categoryVideos.length === 0 ? (
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
                  {categoryVideos.map((video: YouTubeVideo | YouTubeSearchResult, index: number) => (
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
          </>
        )}
      </div>
    </div>
  );
}
