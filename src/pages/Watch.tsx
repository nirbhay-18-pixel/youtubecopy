import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { YouTubePlayer } from '../components/player/YouTubePlayer';
import { RelatedVideoCard } from '../components/video/VideoCard';
import { WatchPageSkeleton } from '../components/ui/Skeleton';
import { getSingleVideo, formatViewCount, formatPublishedDate } from '../services/youtube/videos';
import { getVideoComments } from '../services/youtube/comments';
import { searchVideos } from '../services/youtube/search';
import { YouTubeApiError } from '../services/youtube/client';
import { useLocalStorage } from '../hooks';
import { useToast } from '../components/ui/Toast';
import type { YouTubeVideo, YouTubeSearchResult, YouTubeComment } from '../types/youtube';
import { 
  ThumbsUp, ThumbsDown, Share2, Bookmark, MoreHorizontal, 
  ChevronDown, ChevronUp, AlertCircle, ArrowLeft
} from 'lucide-react';

export default function Watch() {
  const { videoId } = useParams<{ videoId: string }>();
  const [video, setVideo] = useState<YouTubeVideo | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<(YouTubeVideo | YouTubeSearchResult)[]>([]);
  const [comments, setComments] = useState<YouTubeComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDescription, setShowDescription] = useState(false);
  const [isBookmarked, setIsBookmarked] = useLocalStorage<string[]>(
    'streamnest-bookmarks', [] as string[]
  );
  const [watchHistory, setWatchHistory] = useLocalStorage<{videoId: string; title: string; channelTitle: string; thumbnailUrl: string; watchedAt: string}[]>(
    'streamnest-history', [] as {videoId: string; title: string; channelTitle: string; thumbnailUrl: string; watchedAt: string}[]
  );
  const [bookmarkData, setBookmarkData] = useLocalStorage<{videoId: string; title: string; channelTitle: string; thumbnailUrl: string; addedAt: string}[]>(
    'streamnest-bookmark-data', [] as {videoId: string; title: string; channelTitle: string; thumbnailUrl: string; addedAt: string}[]
  );
  const { showToast } = useToast();

  useEffect(() => {
    if (!videoId) return;
    
    const loadVideo = async () => {
      setLoading(true);
      setError(null);

      try {
        // Load video details
        const videoData = await getSingleVideo(videoId);
        if (!videoData) {
          setError('This video is unavailable. It may have been removed or is private.');
          setLoading(false);
          return;
        }
        setVideo(videoData);

        // Add to watch history
        setWatchHistory((prev: {videoId: string; title: string; channelTitle: string; thumbnailUrl: string; watchedAt: string}[]) => {
          const filtered = prev.filter((item: {videoId: string}) => item.videoId !== videoId);
          return [{
            videoId,
            title: videoData.snippet.title,
            channelTitle: videoData.snippet.channelTitle,
            thumbnailUrl: videoData.snippet.thumbnails.medium?.url || '',
            watchedAt: new Date().toISOString(),
          }, ...filtered].slice(0, 50);
        });

        // Load related videos
        try {
          const related = await searchVideos({
            q: videoData.snippet.title.split(' ').slice(0, 3).join(' '),
            maxResults: 15,
            type: 'video',
          });
          setRelatedVideos(related.items.filter(item => item.id.videoId !== videoId));
        } catch {
          // Related videos are optional
        }

        // Load comments
        try {
          const commentData = await getVideoComments(videoId, 10);
          setComments(commentData.items);
        } catch {
          // Comments may not be available
        }
      } catch (err: unknown) {
        if (err instanceof YouTubeApiError) {
          if (err.code === 'API_KEY_MISSING') {
            setError('YouTube API key is not configured.');
          } else {
            setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
        } else {
          setError('Failed to load video. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadVideo();
  }, [videoId]);

  const handleBookmark = () => {
    if (!videoId || !video) return;
    
    if (isBookmarked.includes(videoId)) {
      setIsBookmarked((prev: string[]) => prev.filter((id: string) => id !== videoId));
      setBookmarkData((prev: {videoId: string; title: string; channelTitle: string; thumbnailUrl: string; addedAt: string}[]) => 
        prev.filter(b => b.videoId !== videoId)
      );
      showToast('Removed from bookmarks', 'info');
    } else {
      setIsBookmarked((prev: string[]) => [...prev, videoId]);
      setBookmarkData((prev: {videoId: string; title: string; channelTitle: string; thumbnailUrl: string; addedAt: string}[]) => [
        {
          videoId,
          title: video.snippet.title,
          channelTitle: video.snippet.channelTitle,
          thumbnailUrl: video.snippet.thumbnails.medium?.url || video.snippet.thumbnails.default?.url || '',
          addedAt: new Date().toISOString(),
        },
        ...prev
      ]);
      showToast('Saved to bookmarks', 'success');
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      showToast('Link copied to clipboard', 'success');
    } catch {
      showToast('Failed to copy link', 'error');
    }
  };

  if (loading) {
    return <WatchPageSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <AlertCircle size={48} className="mb-4" style={{ color: 'var(--text-muted)' }} />
        <h2 className="text-xl font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
          Video Unavailable
        </h2>
        <p className="text-sm text-center max-w-md mb-4" style={{ color: 'var(--text-secondary)' }}>
          {error}
        </p>
        <Link
          to="/"
          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium no-underline"
          style={{ backgroundColor: 'var(--chip-active-bg)', color: 'var(--chip-active-text)' }}
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>
      </div>
    );
  }

  if (!video || !videoId) return null;

  const bookmarked = isBookmarked.includes(videoId);

  return (
    <div className="max-w-[1800px] mx-auto p-4">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Player */}
          <YouTubePlayer videoId={videoId} autoplay={true} />

          {/* Title */}
          <h1 className="text-xl font-bold mt-3 mb-2" style={{ color: 'var(--text-primary)' }}>
            {video.snippet.title}
          </h1>

          {/* Channel info and actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <Link to={`/channel/${video.snippet.channelId}`} className="flex-shrink-0">
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(video.snippet.channelTitle)}&background=6366f1&color=fff&size=40`}
                  alt={video.snippet.channelTitle}
                  className="w-10 h-10 rounded-full"
                />
              </Link>
              <div>
                <Link
                  to={`/channel/${video.snippet.channelId}`}
                  className="font-medium text-sm no-underline hover:opacity-80"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {video.snippet.channelTitle}
                </Link>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {video.statistics ? formatViewCount(video.statistics.viewCount) : ''}
                </p>
              </div>
              <button
                className="px-4 py-2 rounded-full text-sm font-medium ml-2"
                style={{ backgroundColor: 'var(--text-primary)', color: 'var(--bg-primary)' }}
              >
                Subscribe
              </button>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-hover)' }}>
                <button className="flex items-center gap-1.5 px-4 py-2 text-sm" style={{ color: 'var(--text-primary)' }}>
                  <ThumbsUp size={18} />
                  {video.statistics?.likeCount ? formatViewCount(video.statistics.likeCount).replace(' views', '') : 'Like'}
                </button>
                <div className="w-px h-6" style={{ backgroundColor: 'var(--border-color)' }} />
                <button className="px-3 py-2" style={{ color: 'var(--text-primary)' }}>
                  <ThumbsDown size={18} />
                </button>
              </div>
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm"
                style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-primary)' }}
              >
                <Share2 size={18} />
                Share
              </button>
              <button
                onClick={handleBookmark}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm"
                style={{ 
                  backgroundColor: bookmarked ? 'var(--chip-active-bg)' : 'var(--bg-hover)', 
                  color: bookmarked ? 'var(--chip-active-text)' : 'var(--text-primary)' 
                }}
              >
                <Bookmark size={18} fill={bookmarked ? 'currentColor' : 'none'} />
                {bookmarked ? 'Saved' : 'Save'}
              </button>
              <button
                className="p-2 rounded-full"
                style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-primary)' }}
              >
                <MoreHorizontal size={18} />
              </button>
            </div>
          </div>

          {/* Description */}
          <div 
            className="rounded-xl p-3 cursor-pointer mb-6"
            style={{ backgroundColor: 'var(--bg-hover)' }}
            onClick={() => setShowDescription(!showDescription)}
          >
            <div className="flex items-center gap-2 mb-1 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              <span>{video.statistics ? formatViewCount(video.statistics.viewCount) : ''}</span>
              <span>•</span>
              <span>{formatPublishedDate(video.snippet.publishedAt)}</span>
            </div>
            <p className={`text-sm whitespace-pre-wrap ${showDescription ? '' : 'line-clamp-3'}`}
              style={{ color: 'var(--text-secondary)' }}>
              {video.snippet.description}
            </p>
            <button className="text-sm font-medium mt-2 flex items-center gap-1"
              style={{ color: 'var(--text-primary)' }}>
              {showDescription ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              {showDescription ? 'Show less' : 'Show more'}
            </button>
          </div>

          {/* Comments */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-4" style={{ color: 'var(--text-primary)' }}>
              {comments.length > 0 ? `${comments.length} Comments` : 'Comments'}
            </h3>
            {comments.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Comments are not available for this video.
              </p>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <img
                      src={comment.snippet.topLevelComment.snippet.authorProfileImageUrl}
                      alt={comment.snippet.topLevelComment.snippet.authorDisplayName}
                      className="w-10 h-10 rounded-full flex-shrink-0"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {comment.snippet.topLevelComment.snippet.authorDisplayName}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {formatPublishedDate(comment.snippet.topLevelComment.snippet.publishedAt)}
                        </span>
                      </div>
                      <p className="text-sm" style={{ color: 'var(--text-primary)' }}
                        dangerouslySetInnerHTML={{ __html: comment.snippet.topLevelComment.snippet.textDisplay }}
                      />
                      <div className="flex items-center gap-4 mt-1">
                        <button className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                          <ThumbsUp size={14} />
                          {comment.snippet.topLevelComment.snippet.likeCount || 0}
                        </button>
                        <button className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          <ThumbsDown size={14} />
                        </button>
                        <button className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                          Reply
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Related videos sidebar */}
        <div className="lg:w-[402px] flex-shrink-0">
          <h3 className="text-base font-medium mb-3 hidden lg:block" style={{ color: 'var(--text-primary)' }}>
            Related Videos
          </h3>
          <div className="space-y-3">
            {relatedVideos.map((rv, index) => (
              <RelatedVideoCard key={`related-${(rv as YouTubeSearchResult).id?.videoId || index}-${index}`} video={rv} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
