import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { Search, X, Play } from 'lucide-react';

interface FeedHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenProfile: () => void;
  onSwitchToAdmin: () => void;
}

export const FeedHeader: React.FC<FeedHeaderProps> = ({
  searchQuery,
  onSearchChange,
  onOpenProfile,
  onSwitchToAdmin,
}) => {
  const { settings } = useApp();
  const { user } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const logoTapCountRef = useRef(0);
  const lastLogoTapRef = useRef(0);

  const appName = settings?.appName || 'StreamVibe';
  const appLogo = settings?.appLogo || '/src/assets/images/app_brand_logo_1790671540965.jpg';

  return (
    <header className="sticky top-0 z-30 w-full h-14 bg-[#0a0d14]/90 backdrop-blur-md border-b border-slate-800/80 px-4 flex items-center justify-between transition-all">
      {/* Normal Mode */}
      {!isSearchOpen ? (
        <>
          {/* Brand Left Zone (Secret 5-tap gesture for admin access) */}
          <div
            onClick={() => {
              const now = Date.now();
              if (now - lastLogoTapRef.current > 2000) {
                logoTapCountRef.current = 1;
              } else {
                logoTapCountRef.current += 1;
              }
              lastLogoTapRef.current = now;
              if (logoTapCountRef.current >= 5) {
                logoTapCountRef.current = 0;
                window.location.hash = 'admin';
                onSwitchToAdmin();
              }
            }}
            className="flex items-center gap-2.5 cursor-pointer select-none"
            title={appName}
          >
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-800 ring-1 ring-white/10 shrink-0 relative flex items-center justify-center">
              <img
                src={appLogo}
                alt={appName}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <Play className="w-4 h-4 text-rose-500 fill-rose-500 absolute" />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-white font-['Plus_Jakarta_Sans',sans-serif]">
              {appName}
            </span>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1 sm:gap-2">

            {/* Search Trigger Button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              aria-label="Open search"
              className="min-h-[44px] min-w-[44px] rounded-full text-slate-300 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* User Profile Avatar Button */}
            {user && (
              <button
                onClick={onOpenProfile}
                aria-label="Open user profile"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-600 to-red-500 text-white font-bold text-xs flex items-center justify-center ring-2 ring-slate-800 shadow-xs">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </button>
            )}
          </div>
        </>
      ) : (
        /* Search Active Mode */
        <div className="w-full max-w-full flex items-center gap-2 animate-in fade-in duration-150">
          <div className="relative flex-1 min-w-0 flex items-center">
            <Search className="w-4 h-4 absolute left-3 text-slate-400 pointer-events-none" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search videos, creators..."
              className="w-full h-10 pl-9 pr-8 bg-slate-900 border border-slate-700/80 rounded-full text-sm text-white placeholder-slate-400 focus:outline-none focus:border-rose-500"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => {
              setIsSearchOpen(false);
              onSearchChange('');
            }}
            className="text-xs font-semibold text-slate-300 hover:text-white px-2 py-1.5 cursor-pointer shrink-0"
          >
            Cancel
          </button>
        </div>
      )}


    </header>
  );
};
