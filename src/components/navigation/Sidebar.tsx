import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, Compass, PlaySquare, Clock, ThumbsUp, 
  Bookmark, ListVideo, Settings, History, Flame, Zap
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  isMini?: boolean;
  onClose: () => void;
}

interface NavItem {
  icon: React.ReactNode;
  label: string;
  path: string;
}

const mainNav: NavItem[] = [
  { icon: <Home size={20} />, label: 'Home', path: '/' },
  { icon: <Zap size={20} />, label: 'Shorts', path: '/shorts' },
  { icon: <Compass size={20} />, label: 'Explore', path: '/explore' },
  { icon: <PlaySquare size={20} />, label: 'Subscriptions', path: '/subscriptions' },
];

const libraryNav: NavItem[] = [
  { icon: <History size={20} />, label: 'History', path: '/history' },
  { icon: <Clock size={20} />, label: 'Watch Later', path: '/watch-later' },
  { icon: <ThumbsUp size={20} />, label: 'Liked Videos', path: '/liked' },
  { icon: <Bookmark size={20} />, label: 'Bookmarks', path: '/bookmarks' },
  { icon: <ListVideo size={20} />, label: 'Playlists', path: '/playlists' },
];

const moreNav: NavItem[] = [
  { icon: <Flame size={20} />, label: 'Trending', path: '/trending' },
  { icon: <Settings size={20} />, label: 'Settings', path: '/settings' },
];

export function Sidebar({ isOpen, isMini, onClose }: SidebarProps) {
  const location = useLocation();

  const renderNavItem = (item: NavItem) => {
    const isActive = location.pathname === item.path;
    
    if (isMini) {
      return (
        <Link
          key={item.path}
          to={item.path}
          className={`flex flex-col items-center justify-center py-4 px-1 rounded-lg text-xs gap-1.5 no-underline transition-colors ${
            isActive ? 'font-medium' : ''
          }`}
          style={{ 
            color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
            backgroundColor: isActive ? 'var(--bg-hover)' : 'transparent'
          }}
          onClick={onClose}
        >
          {item.icon}
          <span className="text-[10px]">{item.label}</span>
        </Link>
      );
    }

    return (
      <Link
        key={item.path}
        to={item.path}
        className={`flex items-center gap-5 px-3 py-2.5 rounded-lg text-sm no-underline transition-colors ${
          isActive ? 'font-medium' : ''
        }`}
        style={{ 
          color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
          backgroundColor: isActive ? 'var(--bg-hover)' : 'transparent'
        }}
        onClick={onClose}
      >
        <span style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
          {item.icon}
        </span>
        <span>{item.label}</span>
      </Link>
    );
  };

  const renderSection = (items: NavItem[], title?: string) => (
    <div className={`${!isMini ? 'py-3 border-b' : ''}`} style={{ borderColor: 'var(--border-color)' }}>
      {title && !isMini && (
        <h3 className="px-3 mb-1 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h3>
      )}
      {items.map(renderNavItem)}
    </div>
  );

  // Mini sidebar (icon only)
  if (isMini) {
    return (
      <aside className="fixed left-0 top-14 bottom-0 w-[72px] overflow-y-auto hide-scrollbar z-30 hidden lg:block"
        style={{ backgroundColor: 'var(--sidebar-bg)' }}>
        <nav className="flex flex-col items-center py-1">
          {mainNav.map(renderNavItem)}
        </nav>
      </aside>
    );
  }

  // Full sidebar (desktop)
  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={`fixed left-0 top-14 bottom-0 w-60 overflow-y-auto z-40 transition-transform duration-200 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:hidden'
        }`}
        style={{ backgroundColor: 'var(--sidebar-bg)' }}
      >
        <nav className="py-2 px-2">
          {renderSection(mainNav)}
          {renderSection(libraryNav, 'Library')}
          {renderSection(moreNav, 'More')}
          
          <div className="py-4 px-3">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              © 2024 StreamNest
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Powered by YouTube API
            </p>
          </div>
        </nav>
      </aside>
    </>
  );
}
