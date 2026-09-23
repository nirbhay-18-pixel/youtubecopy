import { searchVideos, enrichSearchResults } from './search';
import type { YouTubeSearchResult, YouTubeApiResponse } from '../../types/youtube';

// Shorts discovery queries - using multiple categories for variety
const SHORTS_QUERIES = {
  'for-you': ['#shorts', 'viral shorts', 'trending shorts'],
  'technology': ['technology shorts', 'tech shorts', 'gadgets shorts'],
  'coding': ['coding shorts', 'programming shorts', 'developer shorts'],
  'study': ['study shorts', 'education shorts', 'learning shorts', 'JEE shorts'],
  'gaming': ['gaming shorts', 'game shorts', 'esports shorts'],
  'music': ['music shorts', 'song shorts', 'music clips'],
  'ai': ['AI shorts', 'artificial intelligence shorts', 'machine learning shorts'],
};

export type ShortsCategory = keyof typeof SHORTS_QUERIES;

export interface ShortsSearchParams {
  category?: ShortsCategory;
  pageToken?: string;
  maxResults?: number;
}

/**
 * Search for Shorts-style content using YouTube API
 * Uses videoDuration=short to find videos under 4 minutes
 */
export async function searchShorts(
  params: ShortsSearchParams = {}
): Promise<YouTubeApiResponse<YouTubeSearchResult>> {
  const { 
    category = 'for-you', 
    pageToken, 
    maxResults = 25 
  } = params;

  // Select a random query from the category for variety
  const queries = SHORTS_QUERIES[category];
  const randomQuery = queries[Math.floor(Math.random() * queries.length)];

  // Search for short videos
  const searchResponse = await searchVideos({
    q: randomQuery,
    type: 'video',
    videoDuration: 'short', // Videos under 4 minutes
    videoEmbeddable: true,
    maxResults,
    pageToken,
    order: 'relevance',
  });

  // Enrich with video details (duration, views, etc.)
  const enrichedResponse = await enrichSearchResults(searchResponse);

  return enrichedResponse;
}

/**
 * Get Shorts categories for the UI
 */
export function getShortsCategories(): { id: ShortsCategory; label: string }[] {
  return [
    { id: 'for-you', label: 'For You' },
    { id: 'technology', label: 'Technology' },
    { id: 'coding', label: 'Coding' },
    { id: 'study', label: 'Study' },
    { id: 'gaming', label: 'Gaming' },
    { id: 'music', label: 'Music' },
    { id: 'ai', label: 'AI' },
  ];
}
