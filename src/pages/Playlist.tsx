import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPlaylist, getPlaylistItems } from '../services/youtube/playlists';
import { VideoCard } from '../components/video/VideoCard';
import { VideoGridSkeleton } from '../components/ui/Skeleton';
import { YouTubeApiError } from '../services/youtube/client';
import type { YouTubePlaylist, YouTubePlaylistItem } from '../types/youtube';
import { AlertCircle, ListVideo, Play } from 'lucide-react';

export default function Playlist() {
  const { playlistId } = useParams<{ playlistId: string }>();
  const [playlist, setPlaylist] = useState<YouTubePlaylist | null>(null);
  const [items, setItems] = useState<YouTubePlaylistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!playlistId) return;
    
    const loadPlaylist = async () => {
      setLoading(true);
      setError(null);

      try {
        const playlistData = await getPlaylist(playlistId);
        if (!playlistData) {
          setError('Playlist not found.');
          setLoading(false);
          return;
        }
        setPlaylist(playlistData);

        const itemsResponse = await getPlaylistItems(playlistId, 50);
        setItems(itemsResponse.items);
      } catch (err: unknown) {
        if (err instanceof YouTubeApiError) {
          setError(`Error: ${err.message}`);
        } else {
          setError('Failed to load playlist.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadPlaylist();
  }, [playlistId]);

  if (loading) {
    return (
      <div className="p-4">
        <div className="skeleton h-8 w-64 rounded mb-2" />
        <div className="skeleton h-4 w-96 rounded mb-6" />
        <VideoGridSkeleton count={8} />
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <AlertCircle size={48} className="mb-4" style={{ color: 'var(--text-muted)' }} />
        <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
          {error || 'Playlist not found'}
        </p>
        <Link to="/" className="mt-4 text-sm no-underline" style={{ color: 'var(--color-brand)' }}>
          Back to Home
        </Link>
      </div>
    );
  }

  const thumbnail = playlist.snippet.thumbnails.maxres?.url || 
    playlist.snippet.thumbnails.high?.url || 
    playlist.snippet.thumbnails.medium?.url || '';

  return (
    <div className="max-w-[1800px] mx-auto p-4">
      {/* Playlist header */}
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="w-full md:w-80 flex-shrink-0">
          <div className="aspect-video rounded-xl overflow-hidden relative" style={{ backgroundColor: 'var(--bg-hover)' }}>
            {thumbnail && (
              <img src={thumbnail} alt={playlist.snippet.title} className="w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="text-center text-white">
                <ListVideo size={32} className="mx-auto mb-1" />
                <p className="text-sm font-medium">
                  {playlist.contentDetails?.itemCount || items.length} videos
                </p>
              </div>
            </div>
          </div>
          <button
            className="mt-3 flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium w-full justify-center"
            style={{ backgroundColor: 'var(--text-primary)', color: 'var(--bg-primary)' }}
          >
            <Play size={16} fill="currentColor" />
            Play All
          </button>
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            {playlist.snippet.title}
          </h1>
          <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
            {playlist.snippet.channelTitle}
            {playlist.contentDetails?.itemCount && ` • ${playlist.contentDetails.itemCount} videos`}
          </p>
          {playlist.snippet.description && (
            <p className="text-sm line-clamp-3" style={{ color: 'var(--text-secondary)' }}>
              {playlist.snippet.description}
            </p>
          )}
        </div>
      </div>

      {/* Playlist items */}
      {items.length === 0 ? (
        <p className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>
          This playlist has no videos.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => {
            const videoId = item.snippet.resourceId.videoId || item.contentDetails?.videoId;
            if (!videoId) return null;
            
            return (
              <Link
                key={item.id}
                to={`/watch/${videoId}`}
                className="flex gap-3 p-2 rounded-lg no-underline group hover:opacity-90 transition-opacity"
                style={{ backgroundColor: index % 2 === 0 ? 'transparent' : 'var(--bg-secondary)' }}
              >
                <span className="text-sm w-8 text-center flex items-center justify-center flex-shrink-0"
                  style={{ color: 'var(--text-muted)' }}>
                  {index + 1}
                </span>
                <div className="w-40 flex-shrink-0">
                  <div className="aspect-video rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--bg-hover)' }}>
                    <img
                      src={item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url || ''}
                      alt={item.snippet.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                </div>
                <div className="flex-1 min-w-0 py-1">
                  <h3 className="text-sm font-medium line-clamp-2" style={{ color: 'var(--text-primary)' }}>
                    {item.snippet.title}
                  </h3>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                    {item.snippet.channelTitle}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
