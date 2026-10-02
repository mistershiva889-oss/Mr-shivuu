import React, { useState, useEffect, useCallback } from 'react';
import { Video } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { useApp } from '../../context/AppContext.tsx';
import { FeedHeader } from './FeedHeader.tsx';
import { CategoryChips } from './CategoryChips.tsx';
import { VideoCard } from './VideoCard.tsx';
import { UserProfileModal } from './UserProfileModal.tsx';
import { Video as VideoIcon, RefreshCw, AlertCircle } from 'lucide-react';

interface UserHomeScreenProps {
  onSwitchToAdmin: () => void;
}

export const UserHomeScreen: React.FC<UserHomeScreenProps> = ({ onSwitchToAdmin }) => {
  const { categories } = useApp();

  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeSort, setActiveSort] = useState<'latest' | 'trending'>('trending');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Sync hash with direct video play
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#watch/')) {
        const id = hash.replace('#watch/', '');
        setActivePlayingId(id);
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const fetchFeedVideos = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getVideos({
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        sort: activeSort,
        search: searchQuery.trim() || undefined,
      });
      setVideos(data);
    } catch (err: any) {
      setError(err.message || 'Unable to load streaming feed. Check your connection.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, activeSort, searchQuery]);

  useEffect(() => {
    fetchFeedVideos();
  }, [fetchFeedVideos]);

  const handlePlayVideo = (videoId: string) => {
    setActivePlayingId(videoId);
  };

  const handlePauseVideo = () => {
    setActivePlayingId(null);
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col">
      {/* Feed Header */}
      <FeedHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenProfile={() => setIsProfileOpen(true)}
        onSwitchToAdmin={onSwitchToAdmin}
      />

      {/* Horizontal Category & Sorting Segmented Bar */}
      <CategoryChips
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={(slug) => {
          setSelectedCategory(slug);
          setActivePlayingId(null);
        }}
        activeSort={activeSort}
        onSelectSort={(sort) => {
          setActiveSort(sort);
          setActivePlayingId(null);
        }}
      />

      {/* Main Feed (Normal vertical scrolling) */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-0 sm:px-4 py-3 sm:py-6">
        {/* Error State with Retry Button */}
        {error && (
          <div className="m-4 p-5 rounded-2xl bg-rose-950/30 border border-rose-900/50 text-center">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
            <p className="text-sm text-slate-200 font-medium mb-3">{error}</p>
            <button
              onClick={() => fetchFeedVideos()}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs inline-flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Loading Skeletons */}
        {isLoading && (
          <div className="space-y-4 px-0 sm:px-0">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="w-full bg-[#0d1019] sm:rounded-2xl overflow-hidden border-b sm:border border-slate-800/80 animate-pulse"
              >
                <div className="w-full aspect-video bg-slate-900" />
                <div className="p-4 flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="w-4/5 h-4 bg-slate-800 rounded-sm" />
                    <div className="w-2/5 h-3 bg-slate-850 rounded-sm" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && videos.length === 0 && (
          <div className="py-20 px-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto mb-4">
              <VideoIcon className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">No videos found</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto mb-5 leading-relaxed">
              {searchQuery
                ? `No videos match "${searchQuery}". Try different keywords or reset filters.`
                : 'There are currently no published videos in this category.'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
              >
                Clear Search
              </button>
            )}
          </div>
        )}

        {/* Video Cards Stream (YouTube-style vertical scroll) */}
        {!isLoading && !error && videos.length > 0 && (
          <div className="space-y-0 sm:space-y-4">
            {videos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                isPlaying={activePlayingId === video.id}
                onPlay={handlePlayVideo}
                onPause={handlePauseVideo}
              />
            ))}
          </div>
        )}
      </main>

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </div>
  );
};
