import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Search, X, Mic, Sun, Moon, Monitor } from 'lucide-react';
import { useDebounce, useTheme, type Theme } from '../../hooks';

interface TopBarProps {
  onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const debouncedQuery = useDebounce(searchQuery, 0); // We'll search on submit only
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSearchIconClick = () => {
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      setShowSearch(true);
      searchInputRef.current?.focus();
    }
  };

  const cycleTheme = () => {
    const themes: Theme[] = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setTheme(nextTheme);
  };

  return (
    <header 
      className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center px-4 gap-2 border-b"
      style={{ 
        backgroundColor: 'var(--header-bg)', 
        borderColor: 'var(--border-color)' 
      }}
    >
      {/* Left section */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-full hover:opacity-80 transition-opacity"
          style={{ color: 'var(--text-primary)' }}
          aria-label="Toggle menu"
        >
          <Menu size={20} />
        </button>
        <Link to="/" className="flex items-center gap-1.5 no-underline">
          <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
          <span className="font-bold text-lg hidden sm:block" style={{ color: 'var(--text-primary)' }}>
            StreamNest
          </span>
        </Link>
      </div>

      {/* Center - Search */}
      <div className={`flex-1 flex justify-center ${showSearch ? 'flex' : 'hidden md:flex'}`}>
        <form onSubmit={handleSearch} className="flex items-center w-full max-w-xl">
          <div className="flex flex-1 items-center border rounded-l-full overflow-hidden"
            style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 bg-transparent outline-none text-sm"
              style={{ color: 'var(--text-primary)' }}
              aria-label="Search"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1 mr-2"
                style={{ color: 'var(--text-secondary)' }}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-5 py-2 border border-l-0 rounded-r-full"
            style={{ 
              borderColor: 'var(--border-color)', 
              backgroundColor: 'var(--bg-hover)',
              color: 'var(--text-primary)'
            }}
            aria-label="Search"
          >
            <Search size={18} />
          </button>
        </form>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={handleSearchIconClick}
          className="p-2 rounded-full md:hidden"
          style={{ color: 'var(--text-primary)' }}
          aria-label="Search"
        >
          <Search size={20} />
        </button>
        <button
          onClick={cycleTheme}
          className="p-2 rounded-full"
          style={{ color: 'var(--text-primary)' }}
          aria-label="Toggle theme"
          title={`Theme: ${theme}`}
        >
          {theme === 'dark' && <Moon size={20} />}
          {theme === 'light' && <Sun size={20} />}
          {theme === 'system' && <Monitor size={20} />}
        </button>
        <button
          className="p-2 rounded-full hidden sm:block"
          style={{ color: 'var(--text-primary)' }}
          aria-label="Create"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <line x1="12" y1="8" x2="12" y2="16"/>
            <line x1="8" y1="12" x2="16" y2="12"/>
          </svg>
        </button>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-sm font-medium ml-1">
          S
        </div>
      </div>
    </header>
  );
}
