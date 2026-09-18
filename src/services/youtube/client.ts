import type { YouTubeApiResponse } from '../../types/youtube';

const BASE_URL = 'https://www.googleapis.com/youtube/v3';

// Get API key from environment
export const getApiKey = (): string => {
  const key = import.meta.env.VITE_YOUTUBE_API_KEY || '';
  return key;
};

// Quota tracking
const quotaCosts: Record<string, Record<string, number>> = {
  search: { list: 100 },
  videos: { list: 1 },
  channels: { list: 1 },
  commentThreads: { list: 1 },
  playlistItems: { list: 1 },
  playlists: { list: 1 },
};

let totalQuotaUsed = 0;
const DAILY_QUOTA_LIMIT = 10000;

export function getQuotaUsed(): number {
  return totalQuotaUsed;
}

export function getQuotaRemaining(): number {
  return DAILY_QUOTA_LIMIT - totalQuotaUsed;
}

export function isQuotaExceeded(): boolean {
  return totalQuotaUsed >= DAILY_QUOTA_LIMIT;
}

// Cache implementation
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function getCachedData<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

export function setCacheData<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export function clearCache(): void {
  cache.clear();
}

// API Error types
export class YouTubeApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'YouTubeApiError';
  }
}

// Base fetch function
export async function fetchYouTubeApi<T>(
  endpoint: string,
  params: Record<string, string | number | undefined>
): Promise<YouTubeApiResponse<T>> {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    throw new YouTubeApiError(
      'YouTube API key is not configured. Please set VITE_YOUTUBE_API_KEY in your environment.',
      401,
      'API_KEY_MISSING'
    );
  }

  if (isQuotaExceeded()) {
    throw new YouTubeApiError(
      'API quota exceeded. Please try again later.',
      429,
      'QUOTA_EXCEEDED'
    );
  }

  // Track quota
  const parts = endpoint.split('/');
  const resource = parts[0] as string;
  const method = parts[1] as string;
  const cost = (quotaCosts[resource] as Record<string, number> | undefined)?.[method] || 1;
  totalQuotaUsed += cost;

  // Check cache
  const cacheKey = `${endpoint}?${JSON.stringify(params)}`;
  const cached = getCachedData<YouTubeApiResponse<T>>(cacheKey);
  if (cached) return cached;

  // Build URL
  const url = new URL(`${BASE_URL}/${endpoint}`);
  url.searchParams.set('key', apiKey);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  try {
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData?.error?.message || `HTTP ${response.status}`;
      const errorCode = errorData?.error?.errors?.[0]?.reason || '';
      
      throw new YouTubeApiError(errorMessage, response.status, errorCode);
    }

    const data: YouTubeApiResponse<T> = await response.json();
    
    // Cache the response
    setCacheData(cacheKey, data);
    
    return data;
  } catch (error) {
    if (error instanceof YouTubeApiError) throw error;
    throw new YouTubeApiError(
      'Failed to fetch data from YouTube API. Please check your connection.',
      0,
      'NETWORK_ERROR'
    );
  }
}
