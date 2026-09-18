import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getChannel, getChannelVideos, getChannelPlaylists, formatSubscriberCount } from '../services/youtube/channels';
import { VideoCard } from '../components/video/VideoCard';
import { ChannelSkeleton, VideoGridSkeleton } from '../components/ui/Skeleton';
import { YouTubeApiError } from '../services/youtube/client';
import type { YouTubeChannel, YouTubeVideo, YouTubePlaylist } from '../types/youtube';
import { formatViewCount, formatPublishedDate } from '../services/youtube/videos';
import { AlertCircle, Users, Video, ListVideo } from 'lucide-react';

type Tab = 'videos' | 'playlists' | 'about';

export default function Channel() {
  const { channelId } = useParams<{ channelId: string }>();
  const [channel, setChannel] = useState<YouTubeChannel | null>(null);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [playlists, setPlaylists] = useState<YouTubePlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('videos');

  useEffect(() => {
    if (!channelId) return;
    
    const loadChannel = async () => {
      setLoading(true);
      setError(null);

      try {
        const channelData = await getChannel(channelId);
        if (!channelData) {
          setError('Channel not found.');
          setLoading(false);
          return;
        }
        setChannel(channelData);

        // Load videos
        try {
          const videosResponse = await getChannelVideos(channelId, 20);
          setVideos(videosResponse.items as YouTubeVideo[]);
        } catch {
          // Videos may not be available
        }

        // Load playlists
        try {
          const playlistsResponse = await getChannelPlaylists(channelId, 10);
          setPlaylists(playlistsResponse.items);
        } catch {
          // Playlists may not be available
        }
      } catch (err: unknown) {
        if (err instanceof YouTubeApiError) {
          setError(`Error: ${err.message}`);
        } else {
          setError('Failed to load channel.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadChannel();
  }, [channelId]);

  if (loading) return <ChannelSkeleton />;

  if (error || !channel) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <AlertCircle size={48} className="mb-4" style={{ color: 'var(--text-muted)' }} />
        <p className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
          {error || 'Channel not found'}
        </p>
        <Link to="/" className="mt-4 text-sm no-underline" style={{ color: 'var(--color-brand)' }}>
          Back to Home
        </Link>
      </div>
    );
  }

  const bannerUrl = channel.brandingSettings?.image?.bannerExternalUrl;
  const avatarUrl = channel.snippet.thumbnails.high?.url || channel.snippet.thumbnails.default?.url || '';

  return (
    <div className="max-w-[1800px] mx-auto">
      {/* Banner */}
      {bannerUrl && (
        <div className="w-full h-32 md:h-48 overflow-hidden">
          <img src={bannerUrl} alt="Channel banner" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Channel header */}
      <div className="p-4 md:p-6 flex flex-col md:flex-row items-start md:items-center gap-4 border-b"
        style={{ borderColor: 'var(--border-color)' }}>
        <img
          src={avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(channel.snippet.title)}&background=6366f1&color=fff&size=128`}
          alt={channel.snippet.title}
          className="w-20 h-20 rounded-full"
        />
        <div className="flex-1">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {channel.snippet.title}
          </h1>
          <div className="flex items-center gap-2 mt-1 text-sm flex-wrap" style={{ color: 'var(--text-secondary)' }}>
            {channel.snippet.customUrl && <span>{channel.snippet.customUrl}</span>}
            {channel.statistics?.subscriberCount && (
              <>
                <span>•</span>
                <span>{formatSubscriberCount(channel.statistics.subscriberCount)}</span>
              </>
            )}
            {channel.statistics?.videoCount && (
              <>
                <span>•</span>
                <span>{channel.statistics.videoCount} videos</span>
              </>
            )}
          </div>
          <p className="text-sm mt-2 line-clamp-2 max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
            {channel.snippet.description}
          </p>
        </div>
        <button
          className="px-6 py-2 rounded-full text-sm font-medium"
          style={{ backgroundColor: 'var(--text-primary)', color: 'var(--bg-primary)' }}
        >
          Subscribe
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b px-4" style={{ borderColor: 'var(--border-color)' }}>
        {([
          { id: 'videos' as Tab, label: 'Videos', icon: <Video size={16} /> },
          { id: 'playlists' as Tab, label: 'Playlists', icon: <ListVideo size={16} /> },
          { id: 'about' as Tab, label: 'About', icon: <Users size={16} /> },
        ]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id ? '' : 'border-transparent'
            }`}
            style={{ 
              color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
              borderBottomColor: activeTab === tab.id ? 'var(--text-primary)' : 'transparent'
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-4">
        {activeTab === 'videos' && (
          videos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
              {videos.map((video, index) => (
                <VideoCard key={`${video.id}-${index}`} video={video} />
              ))}
            </div>
          ) : (
            <p className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>No videos found.</p>
          )
        )}

        {activeTab === 'playlists' && (
          playlists.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {playlists.map(playlist => (
                <Link key={playlist.id} to={`/playlist/${playlist.id}`} className="no-underline group">
                  <div className="aspect-video rounded-xl overflow-hidden relative" style={{ backgroundColor: 'var(--bg-hover)' }}>
                    <img
                      src={playlist.snippet.thumbnails.medium?.url || playlist.snippet.thumbnails.default?.url || ''}
                      alt={playlist.snippet.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    {playlist.contentDetails?.itemCount && (
                      <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                        <ListVideo size={12} />
                        {playlist.contentDetails.itemCount}
                      </div>
                    )}
                  </div>
                  <h3 className="text-sm font-medium mt-2 line-clamp-2" style={{ color: 'var(--text-primary)' }}>
                    {playlist.snippet.title}
                  </h3>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {playlist.snippet.channelTitle}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>No playlists found.</p>
          )
        )}

        {activeTab === 'about' && (
          <div className="max-w-2xl">
            <h3 className="text-lg font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Description</h3>
            <p className="text-sm whitespace-pre-wrap mb-6" style={{ color: 'var(--text-secondary)' }}>
              {channel.snippet.description || 'No description available.'}
            </p>
            <h3 className="text-lg font-medium mb-3" style={{ color: 'var(--text-primary)' }}>Statistics</h3>
            <div className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              {channel.statistics?.viewCount && (
                <p>Total views: {formatViewCount(channel.statistics.viewCount)}</p>
              )}
              {channel.statistics?.subscriberCount && (
                <p>Subscribers: {formatSubscriberCount(channel.statistics.subscriberCount)}</p>
              )}
              {channel.statistics?.videoCount && (
                <p>Videos: {channel.statistics.videoCount}</p>
              )}
              {channel.snippet.publishedAt && (
                <p>Joined: {formatPublishedDate(channel.snippet.publishedAt)}</p>
              )}
              {channel.snippet.country && (
                <p>Country: {channel.snippet.country}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
