import React, { useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TopBar } from './components/navigation/TopBar';
import { Sidebar } from './components/navigation/Sidebar';
import { MobileNav } from './components/navigation/MobileNav';
import { ToastProvider } from './components/ui/Toast';
import { useTheme } from './hooks';

// Lazy load pages
const Home = lazy(() => import('./pages/Home'));
const Watch = lazy(() => import('./pages/Watch'));
const Search = lazy(() => import('./pages/Search'));
const Channel = lazy(() => import('./pages/Channel'));
const Playlist = lazy(() => import('./pages/Playlist'));
const Bookmarks = lazy(() => import('./pages/Bookmarks'));
const History = lazy(() => import('./pages/History'));
const Settings = lazy(() => import('./pages/Settings'));
const Shorts = lazy(() => import('./pages/Shorts'));

// Simple placeholder pages
function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
      <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{title}</h1>
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        This feature is coming soon.
      </p>
    </div>
  );
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarMini, setSidebarMini] = useState(false);
  const { theme } = useTheme();

  const handleMenuClick = () => {
    if (window.innerWidth >= 1024) {
      setSidebarMini(!sidebarMini);
    } else {
      setSidebarOpen(!sidebarOpen);
    }
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  return (
    <BrowserRouter>
      <ToastProvider>
      <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <TopBar onMenuClick={handleMenuClick} />
        
        <div className="flex pt-14">
          {/* Desktop sidebar */}
          <div className="hidden lg:block">
            <Sidebar isOpen={sidebarOpen} isMini={sidebarMini} onClose={handleSidebarClose} />
          </div>
          
          {/* Mobile sidebar */}
          <div className="lg:hidden">
            <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} />
          </div>

          {/* Main content */}
          <main 
            className={`flex-1 min-h-[calc(100vh-56px)] pb-14 md:pb-0 transition-all ${
              sidebarMini ? 'lg:ml-[72px]' : 'lg:ml-60'
            }`}
          >
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/shorts" element={<Shorts />} />
                <Route path="/watch/:videoId" element={<Watch />} />
                <Route path="/search" element={<Search />} />
                <Route path="/channel/:channelId" element={<Channel />} />
                <Route path="/explore" element={<Home />} />
                <Route path="/subscriptions" element={<PlaceholderPage title="Subscriptions" />} />
                <Route path="/history" element={<History />} />
                <Route path="/watch-later" element={<PlaceholderPage title="Watch Later" />} />
                <Route path="/liked" element={<PlaceholderPage title="Liked Videos" />} />
                <Route path="/bookmarks" element={<Bookmarks />} />
                <Route path="/playlists" element={<PlaceholderPage title="Playlists" />} />
                <Route path="/trending" element={<Home />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/playlist/:playlistId" element={<Playlist />} />
                <Route path="*" element={<PlaceholderPage title="Page Not Found" />} />
              </Routes>
            </Suspense>
          </main>
        </div>

        {/* Mobile bottom nav */}
        <MobileNav />
      </div>
      </ToastProvider>
    </BrowserRouter>
  );
}
