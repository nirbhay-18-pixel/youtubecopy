import React from 'react';
import { useLocalStorage } from '../hooks';
import { VideoCard } from '../components/video/VideoCard';
import { getWatchHistory } from '../services/recommendations';
import type { YouTubeVideo } from '../types/youtube';
import { History as HistoryIcon, Trash2, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

interface HistoryItem {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  watchedAt: string;
}

export default function History() {
  const [history, setHistory] = useLocalStorage<HistoryItem[]>('streamnest-history', []);
  
  // Get detailed watch activity for "Continue Watching"
  const watchActivity = getWatchHistory();
  const continueWatching = watchActivity.filter(
    activity => activity.completionPercentage > 10 && activity.completionPercentage < 90
  ).slice(0, 6);

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

      {/* Continue Watching Section */}
      {continueWatching.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Play size={24} style={{ color: 'var(--color-brand)' }} />
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Continue Watching
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-6">
            {continueWatching.map((activity) => (
              <Link 
                key={activity.videoId} 
                to={`/watch/${activity.videoId}`}
                className="no-underline group"
              >
                <div className="relative">
                  <div className="aspect-video rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--bg-hover)' }}>
                    <img
                      src={activity.thumbnailUrl}
                      alt={activity.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  {/* Progress bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
                    <div 
                      className="h-full bg-red-500"
                      style={{ width: `${activity.completionPercentage}%` }}
                    />
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                    {activity.completionPercentage}% watched
                  </div>
                </div>
                <div className="mt-2">
                  <h3 className="text-sm font-medium line-clamp-2" style={{ color: 'var(--text-primary)' }}>
                    {activity.title}
                  </h3>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                    {activity.channelTitle}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Full History */}
      <section>
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Recently Watched
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
          {historyAsVideos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      </section>
    </div>
  );
}
