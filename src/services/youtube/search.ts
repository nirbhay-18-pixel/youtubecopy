import { fetchYouTubeApi } from './client';
import { getVideoDetails } from './videos';
import type { YouTubeSearchResult, YouTubeVideo, YouTubeApiResponse, SearchFilters } from '../../types/youtube';

export interface SearchParams {
  q: string;
  maxResults?: number;
  pageToken?: string;
  type?: string;
  order?: string;
  publishedAfter?: string;
  videoDuration?: string;
  regionCode?: string;
  videoEmbeddable?: boolean;
}

export interface EnrichedSearchResult {
  searchResult: YouTubeSearchResult;
  videoDetails?: YouTubeVideo;
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

  // Only add videoEmbeddable when searching for videos
  if (params.type === 'video' || !params.type) {
    searchParams.videoEmbeddable = params.videoEmbeddable !== false ? 'true' : 'false';
  }

  if (params.pageToken) searchParams.pageToken = params.pageToken;
  if (params.publishedAfter) searchParams.publishedAfter = params.publishedAfter;
  if (params.videoDuration && params.videoDuration !== 'any') {
    searchParams.videoDuration = params.videoDuration;
  }
  if (params.regionCode) searchParams.regionCode = params.regionCode;

  return fetchYouTubeApi<YouTubeSearchResult>('search', searchParams);
}

/**
 * Enrich search results with detailed video information
 * This fetches contentDetails (duration) and statistics (views) for each video
 */
export async function enrichSearchResults(
  searchResponse: YouTubeApiResponse<YouTubeSearchResult>
): Promise<YouTubeApiResponse<YouTubeSearchResult>> {
  // Extract video IDs from search results
  const videoIds = searchResponse.items
    .filter(item => item.id.kind === 'youtube#video' && item.id.videoId)
    .map(item => item.id.videoId!);

  if (videoIds.length === 0) {
    return searchResponse;
  }

  try {
    // Fetch video details in a single batched request
    const videoDetailsResponse = await getVideoDetails(videoIds);
    
    // Create a map of video ID to video details for quick lookup
    const videoDetailsMap = new Map<string, YouTubeVideo>();
    videoDetailsResponse.items.forEach(video => {
      videoDetailsMap.set(video.id, video);
    });

    // Merge video details into search results
    const enrichedItems = searchResponse.items.map(item => {
      if (item.id.kind === 'youtube#video' && item.id.videoId) {
        const details = videoDetailsMap.get(item.id.videoId);
        if (details) {
          // Return a merged result that includes both search snippet and video details
          return {
            ...item,
            // Store the full video details for use by components
            _videoDetails: details
          } as YouTubeSearchResult & { _videoDetails?: YouTubeVideo };
        }
      }
      return item;
    });

    return {
      ...searchResponse,
      items: enrichedItems
    };
  } catch (error) {
    // If enrichment fails, return original results
    console.warn('Failed to enrich search results with video details:', error);
    return searchResponse;
  }
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
