import { fetchYouTubeApi } from './client';
import type { YouTubeVideo, YouTubeApiResponse } from '../../types/youtube';

export async function getVideoDetails(
  videoIds: string[]
): Promise<YouTubeApiResponse<YouTubeVideo>> {
  return fetchYouTubeApi<YouTubeVideo>('videos', {
    part: 'snippet,contentDetails,statistics',
    id: videoIds.join(','),
  });
}

export async function getSingleVideo(videoId: string): Promise<YouTubeVideo | null> {
  const response = await getVideoDetails([videoId]);
  return response.items[0] || null;
}

export async function getPopularVideos(
  regionCode: string = 'US',
  maxResults: number = 20,
  pageToken?: string
): Promise<YouTubeApiResponse<YouTubeVideo>> {
  const params: Record<string, string | number | undefined> = {
    part: 'snippet,contentDetails,statistics',
    chart: 'mostPopular',
    regionCode,
    maxResults,
  };
  if (pageToken) params.pageToken = pageToken;
  
  return fetchYouTubeApi<YouTubeVideo>('videos', params);
}

export async function getVideosByCategory(
  categoryId: string,
  regionCode: string = 'US',
  maxResults: number = 20,
  pageToken?: string
): Promise<YouTubeApiResponse<YouTubeVideo>> {
  const params: Record<string, string | number | undefined> = {
    part: 'snippet,contentDetails,statistics',
    chart: 'mostPopular',
    videoCategoryId: categoryId,
    regionCode,
    maxResults,
  };
  if (pageToken) params.pageToken = pageToken;
  
  return fetchYouTubeApi<YouTubeVideo>('videos', params);
}

// Parse ISO 8601 duration to human readable format
export function parseDuration(isoDuration: string): string {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '0:00';
  
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');
  
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

// Format view count
export function formatViewCount(count: string): string {
  const num = parseInt(count);
  if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B views`;
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M views`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K views`;
  return `${num} views`;
}

// Format date
export function formatPublishedDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffYears > 0) return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`;
  if (diffMonths > 0) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
  if (diffWeeks > 0) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
  if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffMinutes > 0) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  return 'Just now';
}

// YouTube category IDs
export const CATEGORY_IDS: Record<string, string> = {
  Music: '10',
  Gaming: '20',
  Education: '27',
  Programming: '28',
  Technology: '28',
  Sports: '17',
  News: '25',
  Entertainment: '24',
};
