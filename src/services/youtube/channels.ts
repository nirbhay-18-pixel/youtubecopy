import { fetchYouTubeApi } from './client';
import type { YouTubeChannel, YouTubeVideo, YouTubeApiResponse, YouTubePlaylist } from '../../types/youtube';

export async function getChannel(channelId: string): Promise<YouTubeChannel | null> {
  const response = await fetchYouTubeApi<YouTubeChannel>('channels', {
    part: 'snippet,statistics,brandingSettings',
    id: channelId,
  });
  return response.items[0] || null;
}

export async function getChannelByUsername(username: string): Promise<YouTubeChannel | null> {
  const response = await fetchYouTubeApi<YouTubeChannel>('channels', {
    part: 'snippet,statistics,brandingSettings',
    forUsername: username,
  });
  return response.items[0] || null;
}

export async function getChannelVideos(
  channelId: string,
  maxResults: number = 20,
  pageToken?: string
): Promise<YouTubeApiResponse<YouTubeVideo>> {
  // First get the uploads playlist
  const channel = await getChannel(channelId);
  if (!channel) {
    return { kind: '', etag: '', pageInfo: { totalResults: 0, resultsPerPage: 0 }, items: [] };
  }

  // Search for videos from this channel
  return fetchYouTubeApi<YouTubeVideo>('search', {
    part: 'snippet',
    channelId,
    maxResults,
    order: 'date',
    type: 'video',
    ...(pageToken ? { pageToken } : {}),
  }) as unknown as YouTubeApiResponse<YouTubeVideo>;
}

export async function getChannelPlaylists(
  channelId: string,
  maxResults: number = 20,
  pageToken?: string
): Promise<YouTubeApiResponse<YouTubePlaylist>> {
  const params: Record<string, string | number | undefined> = {
    part: 'snippet,contentDetails',
    channelId,
    maxResults,
  };
  if (pageToken) params.pageToken = pageToken;
  
  return fetchYouTubeApi<YouTubePlaylist>('playlists', params);
}

export function formatSubscriberCount(count: string): string {
  const num = parseInt(count);
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M subscribers`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K subscribers`;
  return `${num} subscribers`;
}
