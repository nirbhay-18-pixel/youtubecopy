import React from 'react';
import { useTheme, type Theme } from '../hooks';
import { Sun, Moon, Monitor, Info } from 'lucide-react';

export default function Settings() {
  const { theme, setTheme } = useTheme();

  const themes: { id: Theme; label: string; icon: React.ReactNode }[] = [
    { id: 'light', label: 'Light', icon: <Sun size={20} /> },
    { id: 'dark', label: 'Dark', icon: <Moon size={20} /> },
    { id: 'system', label: 'System', icon: <Monitor size={20} /> },
  ];

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Settings</h1>

      {/* Theme */}
      <div className="mb-8">
        <h2 className="text-lg font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
          Appearance
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${
                theme === t.id ? '' : ''
              }`}
              style={{
                borderColor: theme === t.id ? 'var(--color-brand)' : 'var(--border-color)',
                backgroundColor: theme === t.id ? 'var(--bg-hover)' : 'var(--bg-secondary)',
                color: 'var(--text-primary)',
              }}
            >
              {t.icon}
              <span className="text-sm font-medium">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* About */}
      <div className="mb-8">
        <h2 className="text-lg font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
          About
        </h2>
        <div className="p-4 rounded-xl border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
          <div className="flex items-start gap-3">
            <Info size={20} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--text-secondary)' }} />
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                StreamNest
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                A modern video discovery platform powered by the YouTube Data API v3.
                Videos are played using the official YouTube embedded player.
              </p>
              <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
                This application uses the official YouTube Data API and YouTube IFrame Player.
                No videos are downloaded, scraped, or proxied.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* API Status */}
      <div>
        <h2 className="text-lg font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
          API Configuration
        </h2>
        <div className="p-4 rounded-xl border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-2 h-2 rounded-full ${import.meta.env.VITE_YOUTUBE_API_KEY ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              YouTube API Key
            </span>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {import.meta.env.VITE_YOUTUBE_API_KEY 
              ? 'API key is configured. You can browse and search videos.'
              : 'No API key configured. Set VITE_YOUTUBE_API_KEY in your environment to enable video browsing.'}
          </p>
        </div>
      </div>
    </div>
  );
}
