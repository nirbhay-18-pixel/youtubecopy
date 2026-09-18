import { fetchYouTubeApi } from './client';
import type { YouTubeComment, YouTubeApiResponse } from '../../types/youtube';

export async function getVideoComments(
  videoId: string,
  maxResults: number = 20,
  pageToken?: string
): Promise<YouTubeApiResponse<YouTubeComment>> {
  const params: Record<string, string | number | undefined> = {
    part: 'snippet,replies',
    videoId,
    maxResults,
    order: 'relevance',
  };
  if (pageToken) params.pageToken = pageToken;
  
  return fetchYouTubeApi<YouTubeComment>('commentThreads', params);
}

export async function getCommentReplies(
  parentId: string,
  maxResults: number = 10,
  pageToken?: string
): Promise<YouTubeApiResponse<YouTubeComment>> {
  const params: Record<string, string | number | undefined> = {
    part: 'snippet',
    parentId,
    maxResults,
  };
  if (pageToken) params.pageToken = pageToken;
  
  return fetchYouTubeApi<YouTubeComment>('comments', params);
}
