import React, { useState, useEffect } from 'react';
import { Category, Video } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import {
  X,
  Upload,
  Youtube,
  FileVideo,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface VideoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onVideoCreated: (newVideo: Video) => void;
  initialVideo?: Video | null;
  onVideoUpdated?: (updated: Video) => void;
}

export const VideoUploadModal: React.FC<VideoUploadModalProps> = ({
  isOpen,
  onClose,
  categories,
  onVideoCreated,
  initialVideo,
  onVideoUpdated,
}) => {
  const isEditing = !!initialVideo;

  const [mode, setMode] = useState<'youtube' | 'direct'>(
    initialVideo?.sourceType || 'youtube'
  );
  const [title, setTitle] = useState(initialVideo?.title || '');
  const [description, setDescription] = useState(initialVideo?.description || '');
  const [channelName, setChannelName] = useState(initialVideo?.channelName || '');
  const [categoryId, setCategoryId] = useState(
    initialVideo?.categoryId || categories[1]?.id || categories[0]?.id || ''
  );
  const [youtubeUrl, setYoutubeUrl] = useState(
    initialVideo?.sourceType === 'youtube' ? initialVideo.videoUrl : ''
  );
  const [directVideoUrl, setDirectVideoUrl] = useState(
    initialVideo?.sourceType === 'direct' ? initialVideo.videoUrl : ''
  );
  const [thumbnailUrl, setThumbnailUrl] = useState(initialVideo?.thumbnailUrl || '');
  const [durationSeconds, setDurationSeconds] = useState(
    initialVideo?.durationSeconds ? String(initialVideo.durationSeconds) : '300'
  );
  const [isPublished, setIsPublished] = useState(
    initialVideo?.isPublished !== undefined ? initialVideo.isPublished : true
  );

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  // Sync state whenever initialVideo or isOpen changes
  useEffect(() => {
    if (isOpen) {
      if (initialVideo) {
        setMode(initialVideo.sourceType || 'youtube');
        setTitle(initialVideo.title || '');
        setDescription(initialVideo.description || '');
        setChannelName(initialVideo.channelName || '');
        setCategoryId(initialVideo.categoryId || categories[1]?.id || categories[0]?.id || '');
        setYoutubeUrl(initialVideo.sourceType === 'youtube' ? initialVideo.videoUrl : '');
        setDirectVideoUrl(initialVideo.sourceType === 'direct' ? initialVideo.videoUrl : '');
        setThumbnailUrl(initialVideo.thumbnailUrl || '');
        setDurationSeconds(
          initialVideo.durationSeconds ? String(initialVideo.durationSeconds) : '300'
        );
        setIsPublished(initialVideo.isPublished !== undefined ? initialVideo.isPublished : true);
      } else {
        setMode('youtube');
        setTitle('');
        setDescription('');
        setChannelName('');
        setCategoryId(categories[1]?.id || categories[0]?.id || '');
        setYoutubeUrl('');
        setDirectVideoUrl('');
        setThumbnailUrl('');
        setDurationSeconds('300');
        setIsPublished(true);
      }
      setError(null);
      setIsSubmitting(false);
      setIsUploadingMedia(false);
    }
  }, [isOpen, initialVideo, categories]);

  // Auto extract thumbnail from YouTube URL when entered (supports watch, youtu.be, shorts, embed)
  const handleYoutubeUrlChange = (val: string) => {
    setYoutubeUrl(val);
    const trimmed = val.trim();
    let ytid: string | null = null;
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) ytid = trimmed;
    const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (shortMatch) ytid = shortMatch[1];
    const pathMatch = trimmed.match(/\/(shorts|embed|v|live)\/([a-zA-Z0-9_-]{11})/);
    if (pathMatch) ytid = pathMatch[2];
    const queryMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (queryMatch) ytid = queryMatch[1];

    if (ytid) {
      if (!thumbnailUrl || thumbnailUrl.includes('img.youtube.com')) {
        setThumbnailUrl(`https://img.youtube.com/vi/${ytid}/hqdefault.jpg`);
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Flexible video validation (MIME or common extension)
    const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|m4v|mkv|3gp|avi|ts|ogv)$/i.test(file.name);
    if (!isVideo && file.type) {
      setError('Please select a video file (.mp4, .webm, .mov, etc.).');
      return;
    }

    // Size limit: 200MB
    if (file.size > 200 * 1024 * 1024) {
      setError('Selected video exceeds maximum limit (200MB).');
      return;
    }

    setIsUploadingMedia(true);
    setError(null);

    try {
      // Direct raw binary stream upload - fast and lightweight
      const res = await api.uploadVideoFile(file);
      setDirectVideoUrl(res.videoUrl);
      if (!title.trim()) {
        const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setTitle(cleanTitle);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload video to server.');
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await api.uploadImageFile(file);
      setThumbnailUrl(res.imageUrl);
    } catch {
      // Fallback to data URL
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setThumbnailUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Video title is required.');
      return;
    }
    if (!channelName.trim()) {
      setError('Creator / Channel name is required.');
      return;
    }

    if (mode === 'youtube' && !youtubeUrl.trim()) {
      setError('Please enter a valid YouTube video URL.');
      return;
    }
    if (mode === 'direct' && !directVideoUrl.trim()) {
      setError('Please provide a direct video URL or upload a file.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing && initialVideo) {
        const updated = await api.updateVideo(initialVideo.id, {
          title: title.trim(),
          description: description.trim(),
          channelName: channelName.trim(),
          categoryId,
          thumbnailUrl: thumbnailUrl.trim() || undefined,
          videoUrl: mode === 'youtube' ? youtubeUrl : directVideoUrl,
          durationSeconds: parseInt(durationSeconds, 10) || 300,
          isPublished,
        });
        if (onVideoUpdated) onVideoUpdated(updated);
      } else {
        const created = await api.createVideo({
          title: title.trim(),
          description: description.trim(),
          channelName: channelName.trim(),
          categoryId,
          sourceType: mode,
          youtubeUrl: mode === 'youtube' ? youtubeUrl.trim() : undefined,
          videoUrl: mode === 'direct' ? directVideoUrl.trim() : undefined,
          thumbnailUrl: thumbnailUrl.trim() || undefined,
          durationSeconds: parseInt(durationSeconds, 10) || 300,
          isPublished,
        });
        onVideoCreated(created);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save video details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-[#0d1019] border border-slate-800 rounded-3xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              {isEditing ? 'Edit Video Metadata' : 'Publish New Video'}
            </h2>
            <p className="text-xs text-slate-400">
              Direct cloud streaming or official YouTube embed
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Source Type Selector (YouTube vs Direct) */}
          {!isEditing && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                Video Ingestion Source
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMode('youtube')}
                  className={`h-12 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    mode === 'youtube'
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-950/40 border border-rose-500'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Youtube className="w-4 h-4" />
                  <span>YouTube URL Embed</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('direct')}
                  className={`h-12 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    mode === 'direct'
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-950/40 border border-rose-500'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <FileVideo className="w-4 h-4" />
                  <span>Direct Hosted Stream</span>
                </button>
              </div>
            </div>
          )}

          {/* Source Input */}
          {mode === 'youtube' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                YouTube Video URL
              </label>
              <input
                type="url"
                value={youtubeUrl}
                onChange={(e) => handleYoutubeUrlChange(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                required
                className="w-full h-11 px-3.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Official YouTube branding and playback controls are fully preserved.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Direct Video Stream URL or File
              </label>
              <input
                type="text"
                value={directVideoUrl}
                onChange={(e) => setDirectVideoUrl(e.target.value)}
                placeholder="/videos/sample.mp4 or direct stream URL"
                className="w-full h-11 px-3.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />

              {/* Quick sample preset buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] text-slate-500">Quick presets:</span>
                <button
                  type="button"
                  onClick={() => setDirectVideoUrl('/videos/sample.mp4')}
                  className="px-2.5 py-1 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-700 text-[11px] font-medium text-slate-300 hover:text-white cursor-pointer transition-colors"
                >
                  Sintel 4K (MP4)
                </button>
                <button
                  type="button"
                  onClick={() => setDirectVideoUrl('/videos/bunny.mp4')}
                  className="px-2.5 py-1 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-700 text-[11px] font-medium text-slate-300 hover:text-white cursor-pointer transition-colors"
                >
                  Bunny Animation (MP4)
                </button>
              </div>

              {/* Video upload input */}
              <div className="flex items-center gap-3 pt-1">
                <label className="flex-1 h-10 rounded-xl bg-slate-900 border border-dashed border-slate-700 hover:border-rose-500/70 text-slate-300 hover:text-white text-xs font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors">
                  {isUploadingMedia ? (
                    <div className="flex items-center gap-2 text-rose-400">
                      <div className="w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                      <span>Uploading video file to server...</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 text-rose-400" />
                      <span>Choose local video file (MP4 / WebM / MOV)</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="video/*"
                    disabled={isUploadingMedia}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Inline video player preview */}
              {directVideoUrl && (
                <div className="mt-2 p-2.5 rounded-xl bg-black/60 border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Live Stream Preview
                  </span>
                  <div className="aspect-video w-full rounded-lg overflow-hidden bg-black flex items-center justify-center">
                    <video
                      key={directVideoUrl}
                      src={directVideoUrl}
                      controls
                      playsInline
                      className="w-full h-full object-contain"
                      onLoadedMetadata={(e) => {
                        if (e.currentTarget.duration && !isNaN(e.currentTarget.duration)) {
                          setDurationSeconds(String(Math.round(e.currentTarget.duration)));
                        }
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Next-Generation AI Architectures in 4K"
              required
              className="w-full h-11 px-3.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of the video content..."
              className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Creator / Channel Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Creator / Channel Name
              </label>
              <input
                type="text"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                placeholder="e.g. Terra Expeditions"
                required
                className="w-full h-11 px-3.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full h-11 px-3.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Thumbnail URL & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Thumbnail URL or Upload
              </label>
              <div className="space-y-1.5">
                <input
                  type="text"
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  placeholder="https://... or upload image"
                  className="w-full h-10 px-3.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
                <label className="h-8 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Choose Thumbnail Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Duration (Seconds)
              </label>
              <input
                type="number"
                value={durationSeconds}
                onChange={(e) => setDurationSeconds(e.target.value)}
                placeholder="300"
                className="w-full h-10 px-3.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 font-mono"
              />
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="w-4 h-4 rounded-sm bg-slate-900 border-slate-700 accent-rose-600 cursor-pointer"
                />
                <label htmlFor="isPublished" className="text-xs text-slate-300 cursor-pointer select-none">
                  Publish to mobile feed immediately
                </label>
              </div>
            </div>
          </div>

          {/* Submit buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-rose-950/40 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>{isEditing ? 'Save Changes' : 'Publish Video'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
