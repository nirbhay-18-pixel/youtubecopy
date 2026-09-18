import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchWithFilters } from '../services/youtube/search';
import { VideoCard } from '../components/video/VideoCard';
import { SearchSkeleton } from '../components/ui/Skeleton';
import { YouTubeApiError } from '../services/youtube/client';
import type { YouTubeSearchResult, SearchFilters } from '../types/youtube';
import { AlertCircle, RefreshCw, Filter } from 'lucide-react';
import { useDebounce } from '../hooks';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<YouTubeSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    order: 'relevance',
    videoDuration: 'any',
  });

  const debouncedQuery = useDebounce(query, 300);

  const loadResults = useCallback(async (searchQuery: string, pageToken?: string, append = false) => {
    if (!searchQuery.trim()) return;
    
    try {
      if (!pageToken) setLoading(true);
      setError(null);

      const response = await searchWithFilters(searchQuery, filters, pageToken);
      
      if (append) {
        setResults(prev => [...prev, ...response.items]);
      } else {
        setResults(response.items);
      }
      setNextPageToken(response.nextPageToken);
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
  }, [filters]);

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

  const handleFilterChange = (newFilters: Partial<SearchFilters>) => {
    setFilters((prev: SearchFilters) => ({ ...prev, ...newFilters }));
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
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
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Sort by</label>
              <select
                value={filters.order || 'relevance'}
                onChange={(e) => handleFilterChange({ order: e.target.value as SearchFilters['order'] })}
                className="px-3 py-1.5 rounded-lg text-sm border"
                style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              >
                <option value="relevance">Relevance</option>
                <option value="date">Upload date</option>
                <option value="viewCount">View count</option>
                <option value="rating">Rating</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Duration</label>
              <select
                value={filters.videoDuration || 'any'}
                onChange={(e) => handleFilterChange({ videoDuration: e.target.value as SearchFilters['videoDuration'] })}
                className="px-3 py-1.5 rounded-lg text-sm border"
                style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              >
                <option value="any">Any</option>
                <option value="short">Short (&lt; 4 min)</option>
                <option value="medium">Medium (4-20 min)</option>
                <option value="long">Long (&gt; 20 min)</option>
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
