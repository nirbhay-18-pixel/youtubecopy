import { fetchYouTubeApi } from './client';
import type { YouTubeSearchResult, YouTubeApiResponse, SearchFilters } from '../../types/youtube';

export interface SearchParams {
  q: string;
  maxResults?: number;
  pageToken?: string;
  type?: string;
  order?: string;
  publishedAfter?: string;
  videoDuration?: string;
  regionCode?: string;
}

export async function searchVideos(
  params: SearchParams
): Promise<YouTubeApiResponse<YouTubeSearchResult>> {
  const searchParams: Record<string, string | number | undefined> = {
    part: 'snippet',
    q: params.q,
    maxResults: params.maxResults || 20,
    type: params.type || 'video',
    order: params.order || 'relevance',
  };

  if (params.pageToken) searchParams.pageToken = params.pageToken;
  if (params.publishedAfter) searchParams.publishedAfter = params.publishedAfter;
  if (params.videoDuration && params.videoDuration !== 'any') {
    searchParams.videoDuration = params.videoDuration;
  }
  if (params.regionCode) searchParams.regionCode = params.regionCode;

  return fetchYouTubeApi<YouTubeSearchResult>('search/list', searchParams);
}

export async function searchWithFilters(
  query: string,
  filters: SearchFilters,
  pageToken?: string
): Promise<YouTubeApiResponse<YouTubeSearchResult>> {
  return searchVideos({
    q: query,
    maxResults: 20,
    pageToken,
    type: filters.type || 'video',
    order: filters.order || 'relevance',
    publishedAfter: filters.publishedAfter,
    videoDuration: filters.videoDuration,
  });
}

// Category to search query mapping
export const CATEGORY_QUERIES: Record<string, string> = {
  All: '',
  Music: 'music',
  Gaming: 'gaming',
  Education: 'education learning',
  Programming: 'programming coding tutorial',
  Technology: 'technology tech review',
  Sports: 'sports highlights',
  News: 'news today',
  Entertainment: 'entertainment comedy',
  Live: 'live',
};
