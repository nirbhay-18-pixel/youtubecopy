import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchVideos, enrichSearchResults } from '../services/youtube/search';
import { VideoCard } from '../components/video/VideoCard';
import { SearchSkeleton } from '../components/ui/Skeleton';
import { YouTubeApiError } from '../services/youtube/client';
import { getPublishedAfterDate } from '../utils/duration';
import { saveSearchQuery } from '../services/recommendations';
import type { YouTubeSearchResult, SearchFilters } from '../types/youtube';
import { AlertCircle, RefreshCw, Filter, ChevronDown } from 'lucide-react';
import { useDebounce } from '../hooks';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<YouTubeSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [sortBy, setSortBy] = useState<string>('relevance');
  const [uploadDate, setUploadDate] = useState<string>('any');
  const [duration, setDuration] = useState<string>('any');

  const debouncedQuery = useDebounce(query, 300);

  // Track search queries for recommendations
  useEffect(() => {
    if (debouncedQuery.trim()) {
      saveSearchQuery(debouncedQuery);
    }
  }, [debouncedQuery]);

  const loadResults = useCallback(async (searchQuery: string, pageToken?: string, append = false) => {
    if (!searchQuery.trim()) return;
    
    try {
      if (!pageToken) setLoading(true);
      setError(null);

      // Build search parameters
      const searchParams: any = {
        q: searchQuery,
        type: 'video',
        order: sortBy,
        maxResults: 20,
        videoEmbeddable: true, // Only show embeddable videos
      };

      // Add upload date filter
      const publishedAfter = getPublishedAfterDate(uploadDate);
      if (publishedAfter) {
        searchParams.publishedAfter = publishedAfter;
      }

      // Add duration filter
      if (duration !== 'any') {
        searchParams.videoDuration = duration;
      }

      // Add page token for pagination
      if (pageToken) {
        searchParams.pageToken = pageToken;
      }

      // Perform search
      const searchResponse = await searchVideos(searchParams);
      
      // Enrich results with video details (duration, views, etc.)
      const enrichedResponse = await enrichSearchResults(searchResponse);
      
      if (append) {
        setResults(prev => [...prev, ...enrichedResponse.items]);
      } else {
        setResults(enrichedResponse.items);
      }
      setNextPageToken(enrichedResponse.nextPageToken);
    } catch (err: unknown) {
      if (err instanceof YouTubeApiError) {
        if (err.code === 'API_KEY_MISSING') {
          setError('YouTube API key is not configured.');
        } else if (err.code === 'QUOTA_EXCEEDED') {
          setError('API quota exceeded. Please try again tomorrow.');
        } else {
          setError(`Search error: ${err.message}`);
        }
      } else {
        setError('Failed to search. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [sortBy, uploadDate, duration]);

  useEffect(() => {
    if (debouncedQuery) {
      loadResults(debouncedQuery);
    } else {
      setResults([]);
    }
  }, [debouncedQuery, loadResults]);

  const handleLoadMore = () => {
    if (nextPageToken && query) {
      loadResults(query, nextPageToken, true);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Search header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
          {query ? `Results for "${query}"` : 'Search'}
        </h1>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm"
          style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-primary)' }}
        >
          <Filter size={16} />
          Filters
        </button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="mb-6 p-4 rounded-xl border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Sort by */}
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Sort by</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm border"
                style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              >
                <option value="relevance">Relevance</option>
                <option value="date">Newest</option>
                <option value="viewCount">Most viewed</option>
                <option value="rating">Rating</option>
              </select>
            </div>

            {/* Upload date */}
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Upload date</label>
              <select
                value={uploadDate}
                onChange={(e) => setUploadDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm border"
                style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              >
                <option value="any">Any time</option>
                <option value="today">Today</option>
                <option value="week">This week</option>
                <option value="month">This month</option>
                <option value="year">This year</option>
              </select>
            </div>

            {/* Duration */}
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Duration</label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm border"
                style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              >
                <option value="any">Any</option>
                <option value="short">Under 4 minutes</option>
                <option value="medium">4-20 minutes</option>
                <option value="long">Over 20 minutes</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {error ? (
        <div className="flex flex-col items-center justify-center py-16">
          <AlertCircle size={48} className="mb-4" style={{ color: 'var(--text-muted)' }} />
          <p className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>{error}</p>
          <button
            onClick={() => loadResults(query)}
            className="mt-4 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
            style={{ backgroundColor: 'var(--chip-active-bg)', color: 'var(--chip-active-text)' }}
          >
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      ) : loading ? (
        <SearchSkeleton />
      ) : !query ? (
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
            Search for videos
          </p>
          <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
            Enter a search term to find videos
          </p>
        </div>
      ) : results.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
            No results found
          </p>
          <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
            Try different keywords or remove filters
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-6">
            {results.map((result, index) => (
              <VideoCard key={`${result.id.videoId}-${index}`} video={result} layout="list" />
            ))}
          </div>
          {nextPageToken && (
            <div className="flex justify-center mt-8">
              <button
                onClick={handleLoadMore}
                className="px-6 py-2.5 rounded-full text-sm font-medium"
                style={{ backgroundColor: 'var(--chip-active-bg)', color: 'var(--chip-active-text)' }}
              >
                Load More
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
