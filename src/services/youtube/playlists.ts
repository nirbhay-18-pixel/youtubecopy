import { fetchYouTubeApi } from './client';
import type { YouTubePlaylist, YouTubePlaylistItem, YouTubeApiResponse } from '../../types/youtube';

export async function getPlaylist(playlistId: string): Promise<YouTubePlaylist | null> {
  const response = await fetchYouTubeApi<YouTubePlaylist>('playlists/list', {
    part: 'snippet,contentDetails',
    id: playlistId,
  });
  return response.items[0] || null;
}

export async function getPlaylistItems(
  playlistId: string,
  maxResults: number = 20,
  pageToken?: string
): Promise<YouTubeApiResponse<YouTubePlaylistItem>> {
  const params: Record<string, string | number | undefined> = {
    part: 'snippet,contentDetails',
    playlistId,
    maxResults,
  };
  if (pageToken) params.pageToken = pageToken;
  
  return fetchYouTubeApi<YouTubePlaylistItem>('playlistItems/list', params);
}
