import React, { useState, useEffect, useRef, useCallback } from 'react';
import { searchShorts, getShortsCategories, type ShortsCategory } from '../services/youtube/shorts';
import { formatViewCount, formatPublishedDate, formatDuration } from '../utils/duration';
import { YouTubeApiError } from '../services/youtube/client';
import { useToast } from '../components/ui/Toast';
import { useLocalStorage } from '../hooks';
import type { YouTubeSearchResult, YouTubeVideo } from '../types/youtube';
import { 
  Heart, MessageCircle, Share2, Bookmark, 
  ChevronDown, AlertCircle, RefreshCw, Play
} from 'lucide-react';

type EnrichedShort = YouTubeSearchResult & { _videoDetails?: YouTubeVideo };

// Custom Shorts player component for vertical video display
function ShortsPlayer({ videoId }: { videoId: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!videoId || !containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = '';

    const iframe = document.createElement('iframe');
    iframe.width = '100%';
    iframe.height = '100%';
    iframe.frameBorder = '0';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    iframe.title = 'YouTube Shorts player';
    
    // Use YouTube embed with parameters optimized for Shorts
    const params = new URLSearchParams({
      v: videoId,
      autoplay: '1',
      rel: '0',
      modestbranding: '1',
      loop: '1',
      controls: '1',
    });
    
    iframe.src = `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
    
    iframe.addEventListener('load', () => {
      setIsLoaded(true);
    });

    container.appendChild(iframe);

    return () => {
      container.innerHTML = '';
    };
  }, [videoId]);

  return (
    <div className="relative w-full h-full">
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}

export default function Shorts() {
  const [shorts, setShorts] = useState<EnrichedShort[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<ShortsCategory>('for-you');
  const [pageToken, setPageToken] = useState<string | undefined>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedShorts, setLikedShorts] = useLocalStorage<string[]>('streamnest-liked-shorts', []);
  const [savedShorts, setSavedShorts] = useLocalStorage<string[]>('streamnest-saved-shorts', []);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();
  const categories = getShortsCategories();

  // Load shorts
  const loadShorts = useCallback(async (category: ShortsCategory, token?: string, append = false) => {
    try {
      if (!token) setLoading(true);
      else setLoadingMore(true);
      setError(null);

      const response = await searchShorts({
        category,
        pageToken: token,
        maxResults: 10,
      });

      const newShorts = response.items as EnrichedShort[];

      if (append) {
        setShorts(prev => [...prev, ...newShorts]);
      } else {
        setShorts(newShorts);
        setCurrentIndex(0);
      }
      setPageToken(response.nextPageToken);
    } catch (err: unknown) {
      if (err instanceof YouTubeApiError) {
        if (err.code === 'API_KEY_MISSING') {
          setError('YouTube API key is not configured.');
        } else if (err.code === 'QUOTA_EXCEEDED') {
          setError('YouTube API quota has been exceeded. Please try again tomorrow.');
        } else {
          setError(`Unable to load Shorts: ${err.message}`);
        }
      } else {
        setError('Unable to load Shorts right now. Please try again.');
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadShorts(activeCategory);
  }, [activeCategory, loadShorts]);

  // Handle scroll for infinite loading
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    
    // Load more when near bottom
    if (scrollHeight - scrollTop - clientHeight < 500 && pageToken && !loadingMore) {
      loadShorts(activeCategory, pageToken, true);
    }

    // Update current index based on scroll position
    const shortHeight = clientHeight;
    const newIndex = Math.round(scrollTop / shortHeight);
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < shorts.length) {
      setCurrentIndex(newIndex);
    }
  }, [pageToken, loadingMore, activeCategory, loadShorts, currentIndex, shorts.length]);

  // Category change
  const handleCategoryChange = (category: ShortsCategory) => {
    setActiveCategory(category);
    setShorts([]);
    setPageToken(undefined);
    setCurrentIndex(0);
  };

  // Action handlers
  const getVideoId = (short: EnrichedShort): string => {
    return short.id.videoId || '';
  };

  const handleLike = (videoId: string) => {
    if (likedShorts.includes(videoId)) {
      setLikedShorts((prev: string[]) => prev.filter((id: string) => id !== videoId));
      showToast('Removed from liked shorts', 'info');
    } else {
      setLikedShorts((prev: string[]) => [...prev, videoId]);
      showToast('Added to liked shorts', 'success');
    }
  };

  const handleSave = (videoId: string) => {
    if (savedShorts.includes(videoId)) {
      setSavedShorts((prev: string[]) => prev.filter((id: string) => id !== videoId));
      showToast('Removed from saved shorts', 'info');
    } else {
      setSavedShorts((prev: string[]) => [...prev, videoId]);
      showToast('Saved to Watch Later', 'success');
    }
  };

  const handleShare = async (videoId: string) => {
    const url = `${window.location.origin}/shorts/${videoId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out this Short on StreamNest',
          url,
        });
        showToast('Shared successfully', 'success');
      } catch {
        // User cancelled or error
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        showToast('Link copied to clipboard', 'success');
      } catch {
        showToast('Failed to copy link', 'error');
      }
    }
  };

  const handleComment = (videoId: string) => {
    // Navigate to regular watch page for comments
    window.open(`/watch/${videoId}`, '_blank');
  };

  // Retry handler
  const handleRetry = () => {
    loadShorts(activeCategory);
  };

  // Get video metadata
  const getVideoMetadata = (short: EnrichedShort) => {
    const videoId = getVideoId(short);
    const details = short._videoDetails;
    
    return {
      videoId,
      title: short.snippet.title,
      channelTitle: short.snippet.channelTitle,
      channelId: short.snippet.channelId,
      thumbnail: short.snippet.thumbnails.high?.url || short.snippet.thumbnails.medium?.url || '',
      duration: details?.contentDetails?.duration ? formatDuration(details.contentDetails.duration) : '',
      viewCount: details?.statistics?.viewCount ? formatViewCount(details.statistics.viewCount) : '',
      publishedAt: formatPublishedDate(short.snippet.publishedAt),
      description: short.snippet.description,
    };
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-56px)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading Shorts...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-56px)] p-4">
        <AlertCircle size={48} className="mb-4" style={{ color: 'var(--text-muted)' }} />
        <p className="text-lg font-medium mb-2 text-center max-w-md" style={{ color: 'var(--text-primary)' }}>
          {error}
        </p>
        <button
          onClick={handleRetry}
          className="mt-4 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
          style={{ backgroundColor: 'var(--chip-active-bg)', color: 'var(--chip-active-text)' }}
        >
          <RefreshCw size={16} />
          Try Again
        </button>
      </div>
    );
  }

  // Empty state
  if (shorts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-56px)] p-4">
        <p className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
          No Shorts found
        </p>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Try selecting a different category
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">
      {/* Category chips */}
      <div className="sticky top-0 z-20 py-3 px-4 border-b"
        style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}>
        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryChange(category.id)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === category.id ? '' : 'hover:opacity-80'
              }`}
              style={{
                backgroundColor: activeCategory === category.id ? 'var(--chip-active-bg)' : 'var(--chip-bg)',
                color: activeCategory === category.id ? 'var(--chip-active-text)' : 'var(--text-primary)',
              }}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Shorts feed */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto shorts-container"
      >
        {shorts.map((short, index) => {
          const metadata = getVideoMetadata(short);
          const isLiked = likedShorts.includes(metadata.videoId);
          const isSaved = savedShorts.includes(metadata.videoId);

          return (
            <div
              key={`${metadata.videoId}-${index}`}
              className="shorts-item relative w-full flex items-center justify-center py-4"
              style={{ minHeight: 'calc(100vh - 120px)' }}
            >
              {/* Vertical video container */}
              <div className="shorts-player-container relative flex items-center justify-center">
                {/* Video player */}
                <div className="absolute inset-0 bg-black rounded-xl overflow-hidden">
                  {index === currentIndex ? (
                    <ShortsPlayer videoId={metadata.videoId} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-black">
                      <img
                        src={metadata.thumbnail}
                        alt={metadata.title}
                        className="w-full h-full object-cover opacity-50"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Play size={64} className="text-white opacity-80" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Video info overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent rounded-b-xl">
                  <div className="flex items-end justify-between gap-4">
                    {/* Video details */}
                    <div className="flex-1 min-w-0 text-white">
                      <p className="text-sm font-medium mb-1">@{metadata.channelTitle}</p>
                      <h3 className="text-base font-semibold line-clamp-2 mb-2">
                        {metadata.title}
                      </h3>
                      <p className="text-xs opacity-90">
                        {metadata.viewCount} • {metadata.publishedAt}
                        {metadata.duration && ` • ${metadata.duration}`}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col gap-4 pb-2">
                      <button
                        onClick={() => handleLike(metadata.videoId)}
                        className="flex flex-col items-center gap-1 text-white hover:scale-110 transition-transform"
                        aria-label="Like"
                      >
                        <Heart
                          size={28}
                          fill={isLiked ? 'currentColor' : 'none'}
                          className={isLiked ? 'text-red-500' : ''}
                        />
                        <span className="text-xs">Like</span>
                      </button>

                      <button
                        onClick={() => handleComment(metadata.videoId)}
                        className="flex flex-col items-center gap-1 text-white hover:scale-110 transition-transform"
                        aria-label="Comments"
                      >
                        <MessageCircle size={28} />
                        <span className="text-xs">Comments</span>
                      </button>

                      <button
                        onClick={() => handleShare(metadata.videoId)}
                        className="flex flex-col items-center gap-1 text-white hover:scale-110 transition-transform"
                        aria-label="Share"
                      >
                        <Share2 size={28} />
                        <span className="text-xs">Share</span>
                      </button>

                      <button
                        onClick={() => handleSave(metadata.videoId)}
                        className="flex flex-col items-center gap-1 text-white hover:scale-110 transition-transform"
                        aria-label="Save"
                      >
                        <Bookmark
                          size={28}
                          fill={isSaved ? 'currentColor' : 'none'}
                          className={isSaved ? 'text-indigo-500' : ''}
                        />
                        <span className="text-xs">Save</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading more indicator */}
        {loadingMore && (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Scroll down indicator */}
        {currentIndex < shorts.length - 1 && !loadingMore && (
          <div className="flex items-center justify-center py-4 text-white opacity-60">
            <ChevronDown size={24} className="animate-bounce" />
          </div>
        )}
      </div>
    </div>
  );
}
