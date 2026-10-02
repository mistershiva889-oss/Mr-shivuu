import React, { useState, useEffect } from 'react';
import { Video, Category } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { VideoUploadModal } from './VideoUploadModal.tsx';
import {
  Plus,
  Search,
  Eye,
  Trash2,
  Edit2,
  BarChart2,
  Youtube,
  FileVideo,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';

interface VideoManagementProps {
  categories: Category[];
  onInspectAnalytics: (videoId: string) => void;
}

export const VideoManagement: React.FC<VideoManagementProps> = ({
  categories,
  onInspectAnalytics,
}) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [videoToDelete, setVideoToDelete] = useState<Video | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchVideos = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAdminVideos(
        selectedCategory !== 'all' ? selectedCategory : undefined,
        search.trim() || undefined
      );
      setVideos(data);
    } catch (e) {
      console.error('Failed to load admin videos:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [selectedCategory]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVideos();
  };

  const handleTogglePublish = async (video: Video) => {
    try {
      const updated = await api.updateVideo(video.id, {
        isPublished: !video.isPublished,
      });
      setVideos(prev => prev.map(v => (v.id === video.id ? updated : v)));
      setNotification({
        type: 'success',
        message: `Video is now ${updated.isPublished ? 'Published' : 'Draft'}.`,
      });
    } catch (e: any) {
      setNotification({ type: 'error', message: `Could not toggle status: ${e.message}` });
    }
  };

  const handleDeleteClick = (video: Video) => {
    setVideoToDelete(video);
  };

  const confirmDeleteVideo = async () => {
    if (!videoToDelete) return;
    setIsDeleting(true);
    try {
      await api.deleteVideo(videoToDelete.id);
      setVideos(prev => prev.filter(v => v.id !== videoToDelete.id));
      setNotification({
        type: 'success',
        message: `"${videoToDelete.title}" has been removed from catalog.`,
      });
      setVideoToDelete(null);
    } catch (e: any) {
      setNotification({ type: 'error', message: `Delete failed: ${e.message}` });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Video Catalog & Ingestion
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Publish YouTube embeds, direct hosted MP4 streams, and manage visibility.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditingVideo(null);
              setIsUploadModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-rose-950/40 cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Video</span>
          </button>
        </div>
      </div>

      {/* In-app Notification Banner */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl text-xs font-medium flex items-center justify-between gap-3 animate-in fade-in duration-200 border ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <span>{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="text-xs opacity-70 hover:opacity-100 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search form */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search catalog by title or channel..."
            className="w-full h-10 pl-10 pr-4 bg-[#0d1019] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
          />
        </form>

        {/* Category filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="h-10 px-3 bg-[#0d1019] border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <button
          onClick={fetchVideos}
          className="h-10 px-3 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs flex items-center justify-center cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Video Roster Table */}
      <div className="bg-[#0d1019] border border-slate-800 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
            <span>Loading streaming catalog...</span>
          </div>
        ) : videos.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No videos found matching your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Preview & Title</th>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4 text-right">Views</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {videos.map((video) => (
                  <tr key={video.id} className="hover:bg-slate-900/40 transition-colors">
                    {/* Thumbnail & Title */}
                    <td className="py-3 px-4 max-w-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-20 aspect-video rounded-lg overflow-hidden bg-black shrink-0 relative">
                          <img
                            src={video.thumbnailUrl}
                            alt={video.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="overflow-hidden">
                          <span className="font-semibold text-white line-clamp-1 block">
                            {video.title}
                          </span>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            {video.categoryName || 'General'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Channel */}
                    <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                      {video.channelName}
                    </td>

                    {/* Source */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {video.sourceType === 'youtube' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-400">
                          <Youtube className="w-3.5 h-3.5" />
                          <span>YouTube</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-400">
                          <FileVideo className="w-3.5 h-3.5" />
                          <span>Direct MP4</span>
                        </span>
                      )}
                    </td>

                    {/* Views */}
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-200 whitespace-nowrap">
                      {video.viewsCount.toLocaleString()}
                    </td>

                    {/* Published status */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => handleTogglePublish(video)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold cursor-pointer ${
                          video.isPublished
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {video.isPublished ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            <span>Published</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            <span>Draft</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Action buttons */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Analytics Trigger */}
                        <button
                          onClick={() => onInspectAnalytics(video.id)}
                          title="View In-Depth Analytics"
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                        >
                          <BarChart2 className="w-4 h-4" />
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => {
                            setEditingVideo(video);
                            setIsUploadModalOpen(true);
                          }}
                          title="Edit Details"
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteClick(video)}
                          title="Delete Video"
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {videoToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-[#0f121d] border border-slate-800 rounded-2xl shadow-2xl p-6">
            <div className="flex items-center gap-3 text-rose-400 mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Delete Video?</h3>
                <p className="text-xs text-slate-400">This action cannot be undone.</p>
              </div>
            </div>

            <div className="my-4 p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
              <img
                src={videoToDelete.thumbnailUrl}
                alt={videoToDelete.title}
                className="w-16 aspect-video rounded-lg object-cover bg-black shrink-0"
              />
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-white line-clamp-1">{videoToDelete.title}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{videoToDelete.channelName}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-5">
              Are you sure you want to permanently delete this video from the public streaming catalog?
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setVideoToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteVideo}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 shadow-md shadow-rose-950/40 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Delete Video</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Modal */}
      <VideoUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          setEditingVideo(null);
        }}
        categories={categories}
        initialVideo={editingVideo}
        onVideoCreated={(newVideo) => {
          setVideos((prev) => [newVideo, ...prev]);
          setNotification({ type: 'success', message: `"${newVideo.title}" published successfully.` });
        }}
        onVideoUpdated={(updated) => {
          setVideos((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
          setNotification({ type: 'success', message: `"${updated.title}" updated successfully.` });
        }}
      />
    </div>
  );
};
