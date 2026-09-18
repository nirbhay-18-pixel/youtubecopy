import React from 'react';
import { useLocalStorage } from '../hooks';
import { VideoCard } from '../components/video/VideoCard';
import type { YouTubeVideo } from '../types/youtube';
import { History as HistoryIcon, Trash2 } from 'lucide-react';

interface HistoryItem {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  watchedAt: string;
}

export default function History() {
  const [history, setHistory] = useLocalStorage<HistoryItem[]>('streamnest-history', []);

  const handleClearHistory = () => {
    setHistory([] as HistoryItem[]);
  };

  // Convert history items to a format VideoCard can use
  const historyAsVideos: YouTubeVideo[] = history.map((item) => ({
    id: item.videoId,
    snippet: {
      title: item.title,
      description: '',
      channelTitle: item.channelTitle,
      channelId: '',
      publishedAt: item.watchedAt,
      thumbnails: {
        medium: { url: item.thumbnailUrl, width: 320, height: 180 },
      },
    },
  }));

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <HistoryIcon size={48} className="mb-4" style={{ color: 'var(--text-muted)' }} />
        <h2 className="text-xl font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
          No watch history
        </h2>
        <p className="text-sm text-center max-w-md" style={{ color: 'var(--text-secondary)' }}>
          Videos you watch will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-[1800px] mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Watch History ({history.length})
        </h1>
        <button
          onClick={handleClearHistory}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm"
          style={{ color: 'var(--danger)', backgroundColor: 'var(--bg-hover)' }}
        >
          <Trash2 size={16} />
          Clear History
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
        {historyAsVideos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
    </div>
  );
}
