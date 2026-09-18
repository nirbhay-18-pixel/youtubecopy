import React, { useState, useEffect } from 'react';
import { useLocalStorage } from '../hooks';
import { VideoCard } from '../components/video/VideoCard';
import { getVideoDetails } from '../services/youtube/videos';
import { VideoGridSkeleton } from '../components/ui/Skeleton';
import type { YouTubeVideo } from '../types/youtube';
import { Bookmark, Trash2 } from 'lucide-react';

interface BookmarkData {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  addedAt: string;
}

export default function Bookmarks() {
  const [bookmarks, setBookmarks] = useLocalStorage<BookmarkData[]>('streamnest-bookmark-data', []);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBookmarkedVideos = async () => {
      if (bookmarks.length === 0) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Load in batches of 50
        const videoIds = bookmarks.map(b => b.videoId);
        const batches = [];
        for (let i = 0; i < videoIds.length; i += 50) {
          batches.push(videoIds.slice(i, i + 50));
        }

        const allVideos: YouTubeVideo[] = [];
        for (const batch of batches) {
          const response = await getVideoDetails(batch);
          allVideos.push(...response.items);
        }
        setVideos(allVideos);
      } catch {
        // If API fails, we still show the bookmarks we have
      } finally {
        setLoading(false);
      }
    };

    loadBookmarkedVideos();
  }, [bookmarks]);

  const handleRemoveBookmark = (videoId: string) => {
    setBookmarks((prev: BookmarkData[]) => prev.filter(b => b.videoId !== videoId));
  };

  const handleClearAll = () => {
    setBookmarks([] as BookmarkData[]);
    setVideos([]);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Bookmarks</h1>
        <VideoGridSkeleton count={8} />
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <Bookmark size={48} className="mb-4" style={{ color: 'var(--text-muted)' }} />
        <h2 className="text-xl font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
          No bookmarks yet
        </h2>
        <p className="text-sm text-center max-w-md" style={{ color: 'var(--text-secondary)' }}>
          Save videos to watch later by clicking the bookmark button on any video.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-[1800px] mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Bookmarks ({bookmarks.length})
        </h1>
        <button
          onClick={handleClearAll}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm"
          style={{ color: 'var(--danger)', backgroundColor: 'var(--bg-hover)' }}
        >
          <Trash2 size={16} />
          Clear All
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
        {videos.map((video) => (
          <div key={video.id} className="relative group">
            <VideoCard video={video} />
            <button
              onClick={() => handleRemoveBookmark(video.id)}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Remove bookmark"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
