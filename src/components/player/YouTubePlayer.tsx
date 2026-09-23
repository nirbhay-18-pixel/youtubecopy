import React, { useEffect, useRef, useState } from 'react';

interface YouTubePlayerProps {
  videoId: string;
  autoplay?: boolean;
  className?: string;
}

// YouTube IFrame Player implementation
// Uses the official YouTube IFrame Player API
export function YouTubePlayer({ videoId, autoplay = true, className = '' }: YouTubePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!videoId) return;
    
    setError(null);
    setIsLoaded(false);

    // Create the iframe directly
    const container = containerRef.current;
    if (!container) return;

    // Clear previous content
    container.innerHTML = '';

    // Create iframe using official YouTube embed
    const iframe = document.createElement('iframe');
    iframe.width = '100%';
    iframe.height = '100%';
    iframe.frameBorder = '0';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    iframe.title = 'YouTube video player';
    
    const params = new URLSearchParams({
      v: videoId,
      autoplay: autoplay ? '1' : '0',
      rel: '0',
      modestbranding: '1',
      fs: '1',
    });
    
    iframe.src = `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
    
    iframe.addEventListener('load', () => {
      setIsLoaded(true);
    });

    iframe.addEventListener('error', () => {
      setError('Failed to load video player');
    });

    container.appendChild(iframe);

    return () => {
      container.innerHTML = '';
    };
  }, [videoId, autoplay]);

  if (error) {
    return (
      <div className={`aspect-video rounded-xl flex items-center justify-center ${className}`}
        style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="text-center p-6">
          <p className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            Unable to play video
          </p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            This video may be unavailable or restricted.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl"
          style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading player...</p>
          </div>
        </div>
      )}
      <div 
        ref={containerRef}
        className="aspect-video rounded-xl overflow-hidden"
        style={{ backgroundColor: '#000' }}
      />
    </div>
  );
}
