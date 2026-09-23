import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Zap, Compass, Library } from 'lucide-react';
import { useLocation } from 'react-router-dom';

interface MobileNavProps {
  className?: string;
}

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Zap, label: 'Shorts', path: '/shorts' },
  { icon: Compass, label: 'Explore', path: '/explore' },
  { icon: Library, label: 'Library', path: '/history' },
];

export function MobileNav({ className = '' }: MobileNavProps) {
  const location = useLocation();

  return (
    <nav 
      className={`fixed bottom-0 left-0 right-0 flex items-center justify-around h-14 border-t z-30 md:hidden ${className}`}
      style={{ 
        backgroundColor: 'var(--header-bg)',
        borderColor: 'var(--border-color)'
      }}
    >
      {navItems.map(({ icon: Icon, label, path }) => {
        const isActive = location.pathname === path;
        return (
          <Link
            key={path}
            to={path}
            className={`flex flex-col items-center justify-center gap-0.5 py-1 px-3 no-underline text-[10px] ${
              isActive ? 'font-medium' : ''
            }`}
            style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}
          >
            <Icon size={20} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
