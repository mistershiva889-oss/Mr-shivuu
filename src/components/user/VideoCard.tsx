import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Video } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  ArrowLeft,
  X,
  AlertTriangle,
} from 'lucide-react';

interface VideoCardProps {
  video: Video;
  isPlaying: boolean;
  onPlay: (videoId: string) => void;
  onPause: () => void;
}

function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function formatViews(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M views`;
  }
  if (count >= 1000) {
    return `${Math.round(count / 1000)}K views`;
  }
  return `${count} views`;
}

function formatRelativeTime(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years > 0) return `${years}y ago`;
  if (months > 0) return `${months}mo ago`;
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

function getInitialVideoSrc(rawUrl?: string): string {
  if (!rawUrl || rawUrl.startsWith('blob:') || rawUrl.includes('gtv-videos-bucket')) {
    return '/videos/sample.mp4';
  }
  if (rawUrl.endsWith('.webm')) {
    return rawUrl.replace(/\.webm$/, '.mp4');
  }
  return rawUrl;
}

export const VideoCard: React.FC<VideoCardProps> = ({
  video,
  isPlaying,
  onPlay,
  onPause,
}) => {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reliable video source
  const [videoSrc, setVideoSrc] = useState<string>(() => getInitialVideoSrc(video.videoUrl));
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(video.durationSeconds || 0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [hasTrackedView, setHasTrackedView] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  // "video one tap screen saf ho": Controls visibility state
  const [showControls, setShowControls] = useState(true);

  // Play Video Rotate & Fullscreen States
  const [isRotated, setIsRotated] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync video source if prop changes
  useEffect(() => {
    if (video.videoUrl) {
      setVideoSrc(getInitialVideoSrc(video.videoUrl));
    }
  }, [video.videoUrl]);

  // Lock body scroll when rotated or fullscreen is active
  useEffect(() => {
    if (isRotated || isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isRotated, isFullscreen]);

  // Fallback to sample.mp4 on video error
  const handleVideoError = useCallback(() => {
    if (videoSrc !== '/videos/sample.mp4') {
      setVideoSrc('/videos/sample.mp4');
      setPlaybackError(null);
      if (videoRef.current) {
        videoRef.current.load();
        if (isPlaying) {
          videoRef.current.play().catch(() => {});
        }
      }
    } else {
      setPlaybackError('Unable to load video stream. Tap retry.');
    }
  }, [videoSrc, isPlaying]);

  // Start play handler
  const handleStartPlay = (e?: React.SyntheticEvent | Event) => {
    if (e) {
      e.stopPropagation();
    }
    setPlaybackError(null);
    onPlay(video.id);

    // Initial controls state: show briefly then auto-hide for clean screen
    setShowControls(true);
    resetControlsTimeout();

    if (video.sourceType === 'youtube') {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: 'command', func: 'playVideo', args: [] }),
        '*'
      );
    } else if (videoRef.current) {
      const v = videoRef.current;
      if (v.error || !v.currentSrc) {
        v.load();
      }
      const playPromise = v.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          v.muted = true;
          setIsMuted(true);
          v.play().catch(() => {
            if (videoSrc !== '/videos/sample.mp4') {
              setVideoSrc('/videos/sample.mp4');
              setTimeout(() => {
                if (videoRef.current) {
                  videoRef.current.load();
                  videoRef.current.play().catch(() => {});
                }
              }, 100);
            }
          });
        });
      }
    }
  };

  const handlePause = (e?: React.SyntheticEvent | Event) => {
    if (e) {
      e.stopPropagation();
    }
    onPause();
    if (video.sourceType === 'youtube') {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }),
        '*'
      );
    } else if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  // Sync isPlaying prop
  useEffect(() => {
    if (video.sourceType === 'direct' && videoRef.current) {
      const v = videoRef.current;
      if (isPlaying) {
        if (!v.currentSrc) {
          v.load();
        }
        const promise = v.play();
        if (promise !== undefined) {
          promise
            .then(() => {
              if (!hasTrackedView) {
                api.trackView(video.id, user?.id, 10, 20);
                setHasTrackedView(true);
              }
            })
            .catch(() => {
              v.muted = true;
              setIsMuted(true);
              v.play().catch(() => {});
            });
        }
      } else {
        if (!v.paused) {
          v.pause();
        }
      }
    } else if (video.sourceType === 'youtube') {
      if (isPlaying) {
        if (!hasTrackedView) {
          api.trackView(video.id, user?.id, 15, 30);
          setHasTrackedView(true);
        }
        iframeRef.current?.contentWindow?.postMessage(
          JSON.stringify({ event: 'command', func: 'playVideo', args: [] }),
          '*'
        );
      } else {
        iframeRef.current?.contentWindow?.postMessage(
          JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }),
          '*'
        );
      }
    }
  }, [isPlaying, video.sourceType, video.id, user?.id, hasTrackedView, videoSrc]);

  // YouTube playback progress timer
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (video.sourceType === 'youtube' && isPlaying) {
      timer = setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + 1;
          const maxDur = duration || video.durationSeconds || 300;
          return next >= maxDur ? maxDur : next;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [video.sourceType, isPlaying, duration, video.durationSeconds]);

  // Auto-hide controls after inactivity
  const resetControlsTimeout = () => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3500);
    }
  };

  // ONE TAP SCREEN SAFF HO:
  // Single tap on the playing screen toggles controls visibility!
  // Tap -> Screen is 100% clean video with zero buttons or overlays!
  // Tap again -> Controls appear!
  const handleScreenTap = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (!isPlaying) {
      handleStartPlay();
      return;
    }
    setShowControls((prev) => {
      const next = !prev;
      if (next) {
        resetControlsTimeout();
      } else if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      return next;
    });
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (videoRef.current.duration && !isNaN(videoRef.current.duration)) {
        setDuration(videoRef.current.duration);
      }
    }
  };

  const seekTo = (seconds: number) => {
    const maxDur = duration || video.durationSeconds || 300;
    const target = Math.max(0, Math.min(seconds, maxDur));
    setCurrentTime(target);
    if (video.sourceType === 'youtube') {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: 'command', func: 'seekTo', args: [target, true] }),
        '*'
      );
    } else if (videoRef.current) {
      videoRef.current.currentTime = target;
    }
    resetControlsTimeout();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const time = parseFloat(e.target.value);
    seekTo(time);
  };

  const skipSeconds = (seconds: number, e?: React.SyntheticEvent) => {
    if (e) e.stopPropagation();
    seekTo(currentTime + seconds);
  };

  const toggleMute = (e?: React.SyntheticEvent) => {
    if (e) e.stopPropagation();
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (video.sourceType === 'youtube') {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({
          event: 'command',
          func: nextMuted ? 'mute' : 'unMute',
          args: [],
        }),
        '*'
      );
    } else if (videoRef.current) {
      videoRef.current.muted = nextMuted;
    }
    resetControlsTimeout();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const val = parseFloat(e.target.value);
    setVolume(val);
    const muted = val === 0;
    setIsMuted(muted);
    if (video.sourceType === 'youtube') {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({
          event: 'command',
          func: 'setVolume',
          args: [val * 100],
        }),
        '*'
      );
    } else if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = muted;
    }
    resetControlsTimeout();
  };

  // Play Video Rotate Handler ("play video rotate ho")
  const toggleRotate = async (e?: React.SyntheticEvent) => {
    if (e) e.stopPropagation();
    const nextRotated = !isRotated;
    setIsRotated(nextRotated);
    resetControlsTimeout();

    if (!isPlaying) {
      handleStartPlay();
    }

    if (nextRotated) {
      try {
        if (screen.orientation && (screen.orientation as any).lock) {
          await (screen.orientation as any).lock('landscape');
        }
      } catch {
        // Handled smoothly by CSS 90deg transform
      }
    } else {
      try {
        if (screen.orientation && (screen.orientation as any).unlock) {
          (screen.orientation as any).unlock();
        }
      } catch {
        // ignore
      }
    }
  };

  // Standard Fullscreen Toggle Handler
  const toggleFullscreen = async (e?: React.SyntheticEvent) => {
    if (e) e.stopPropagation();
    const nextState = !isFullscreen;
    setIsFullscreen(nextState);
    resetControlsTimeout();

    if (nextState) {
      try {
        const elem = containerRef.current || document.documentElement;
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        } else if ((elem as any).webkitRequestFullscreen) {
          (elem as any).webkitRequestFullscreen();
        } else if ((videoRef.current as any)?.webkitEnterFullscreen) {
          (videoRef.current as any).webkitEnterFullscreen();
        }
      } catch {
        // Fallback to overlay
      }
    } else {
      try {
        if (document.fullscreenElement || (document as any).webkitFullscreenElement) {
          if (document.exitFullscreen) {
            await document.exitFullscreen();
          } else if ((document as any).webkitExitFullscreen) {
            (document as any).webkitExitFullscreen();
          }
        }
      } catch {
        // ignore
      }
    }
  };

  // Exit all expanded viewports
  const exitAllExpanded = async (e?: React.SyntheticEvent) => {
    if (e) e.stopPropagation();
    setIsRotated(false);
    setIsFullscreen(false);
    try {
      if (screen.orientation && (screen.orientation as any).unlock) {
        (screen.orientation as any).unlock();
      }
    } catch {}
    try {
      if (document.fullscreenElement || (document as any).webkitFullscreenElement) {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if ((document as any).webkitExitFullscreen) (document as any).webkitExitFullscreen();
      }
    } catch {}
  };

  // Close video button
  const handleCloseVideo = (e?: React.SyntheticEvent) => {
    if (e) e.stopPropagation();
    handlePause();
    exitAllExpanded();
  };

  // Sync with native fullscreen exit or Escape key
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNativeFs = !!(
        document.fullscreenElement || (document as any).webkitFullscreenElement
      );
      if (!isNativeFs && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && (isFullscreen || isRotated)) {
        exitAllExpanded();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen, isRotated]);

  const isExpanded = isRotated || isFullscreen;

  return (
    <article
      className={`w-full max-w-full bg-[#0d1019] sm:rounded-2xl border-b sm:border border-slate-800/80 mb-3.5 transition-shadow ${
        isExpanded ? 'relative z-[999999] overflow-visible' : 'overflow-hidden'
      }`}
    >
      {/* 
        Video Player Viewport:
        - When rotated: rotates 90° to fill full landscape mobile/desktop viewport
        - When fullscreen: expands across the display
        - Zero YouTube logo, zero channel watermark, zero clashing overlays
      */}
      <div
        ref={containerRef}
        style={
          isRotated
            ? {
                position: 'fixed',
                top: '50%',
                left: '50%',
                width: '100vh',
                height: '100vw',
                maxWidth: '100vh',
                maxHeight: '100vw',
                transform: 'translate(-50%, -50%) rotate(90deg)',
                transformOrigin: 'center center',
                zIndex: 999999,
                backgroundColor: '#000000',
              }
            : isFullscreen
            ? {
                position: 'fixed',
                inset: 0,
                width: '100vw',
                height: '100vh',
                maxWidth: '100vw',
                maxHeight: '100vh',
                zIndex: 999999,
                backgroundColor: '#000000',
              }
            : undefined
        }
        className={
          isExpanded
            ? 'flex flex-col justify-center items-center overflow-hidden select-none bg-black'
            : 'relative w-full aspect-video bg-black overflow-hidden select-none'
        }
      >
        {/* VIDEO DISPLAY ENGINE: DIRECT MP4 OR CLEAN CROP YOUTUBE */}
        {isPlaying ? (
          <div className="w-full h-full relative bg-black flex items-center justify-center overflow-hidden">
            {video.sourceType === 'youtube' && video.youtubeId ? (
              /*
                Clean Embedded Stream:
                - controls=0: YouTube NEVER generates its bottom control bar, YouTube logo, or watermark
                - scale(1.16) inside overflow:hidden crops off YouTube's top title bar
                - pointer-events-none: all taps hit our transparent layer for "one tap screen saf ho"
              */
              <div className="absolute inset-0 overflow-hidden flex items-center justify-center pointer-events-none">
                <iframe
                  ref={iframeRef}
                  title={video.title}
                  src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&controls=0&modestbranding=1&rel=0&iv_load_policy=3&playsinline=1&enablejsapi=1&disablekb=1&fs=0`}
                  className="w-[116%] h-[116%] max-w-none border-0 select-none"
                  style={{ transform: 'scale(1.15)', transformOrigin: 'center center' }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              </div>
            ) : (
              /* Direct HTML5 Video Player */
              <video
                ref={videoRef}
                poster={video.thumbnailUrl}
                playsInline
                preload="auto"
                onTimeUpdate={handleTimeUpdate}
                onEnded={handlePause}
                onError={handleVideoError}
                className="w-full h-full max-w-full max-h-full object-contain pointer-events-none"
              >
                <source src={videoSrc} type="video/mp4" />
                <source src="/videos/sample.mp4" type="video/mp4" />
                <source src="/videos/bunny.mp4" type="video/mp4" />
                Your browser does not support HTML5 video playback.
              </video>
            )}

            {/* Error Message with Retry */}
            {playbackError && (
              <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-4 text-center z-20">
                <AlertTriangle className="w-8 h-8 text-rose-500 mb-2" />
                <p className="text-xs text-slate-200 mb-3 font-medium">{playbackError}</p>
                <button
                  onClick={handleStartPlay}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold cursor-pointer"
                >
                  Retry Playback
                </button>
              </div>
            )}

            {/* 
              TRANSPARENT CLICK CAPTURE LAYER:
              "video one tap screen saf ho play video screen"
              One tap anywhere on the screen toggles all controls off/on instantly!
            */}
            <div
              onClick={handleScreenTap}
              className="absolute inset-0 z-10 cursor-pointer"
              aria-label="Tap video screen to show or clear controls"
            />

            {/* 
              CUSTOM CONTROL OVERLAYS:
              Smoothly vanishes on single tap for a 100% clean video viewing experience.
            */}
            <div
              className={`absolute inset-0 z-20 bg-gradient-to-t from-black/95 via-black/25 to-black/60 flex flex-col justify-between p-3 sm:p-5 transition-opacity duration-200 pointer-events-none ${
                showControls ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {/* Top Bar with Title, Close, Rotate Video Button & Fullscreen */}
              <div className="flex items-center justify-between text-white w-full gap-2 pointer-events-auto">
                <div className="flex items-center gap-2 max-w-[55%] min-w-0">
                  {/* Close / Return button */}
                  <button
                    onClick={handleCloseVideo}
                    aria-label="Close or back to feed"
                    title="Close video"
                    className="p-2 rounded-xl bg-black/75 hover:bg-black text-white cursor-pointer shrink-0 border border-white/20 active:scale-95"
                  >
                    {isExpanded ? <ArrowLeft className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  </button>
                  <span className="text-xs sm:text-sm font-semibold truncate drop-shadow-md">
                    {video.title}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Play Video Rotate Button ("play video rotate ho") */}
                  <button
                    onClick={toggleRotate}
                    title={
                      isRotated
                        ? 'Return to Normal Portrait (0°)'
                        : 'Rotate Video to Landscape (90°)'
                    }
                    className={`min-h-[38px] px-3 py-1.5 rounded-xl text-white flex items-center gap-1.5 transition-all cursor-pointer border shadow-md active:scale-95 text-xs font-semibold ${
                      isRotated
                        ? 'bg-rose-600 border-rose-400 shadow-rose-950/50'
                        : 'bg-black/75 hover:bg-black border-white/20'
                    }`}
                  >
                    <RotateCw
                      className={`w-3.5 h-3.5 text-rose-400 transition-transform ${
                        isRotated ? 'rotate-90' : ''
                      }`}
                    />
                    <span>{isRotated ? 'Normal' : 'Rotate'}</span>
                  </button>

                  {/* Fullscreen Toggle Button */}
                  <button
                    onClick={toggleFullscreen}
                    aria-label={isFullscreen ? 'Exit full screen' : 'Expand full screen'}
                    title={isFullscreen ? 'Exit full screen' : 'Expand full screen'}
                    className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-black/75 hover:bg-black text-white flex items-center gap-1.5 transition-colors cursor-pointer border border-white/20 text-xs font-semibold shrink-0 active:scale-95"
                  >
                    {isFullscreen ? (
                      <>
                        <Minimize className="w-4 h-4 text-rose-400" />
                        <span className="hidden sm:inline">Exit</span>
                      </>
                    ) : (
                      <>
                        <Maximize className="w-4 h-4 text-white" />
                        <span className="hidden sm:inline">Full</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Center Quick Skip Controls */}
              <div className="flex items-center justify-center gap-8 sm:gap-14 text-white my-auto select-none pointer-events-auto">
                <button
                  onClick={(e) => skipSeconds(-10, e)}
                  aria-label="Seek 10 seconds backward"
                  title="-10s"
                  className="min-h-[44px] min-w-[44px] p-2.5 rounded-full bg-black/60 hover:bg-black/90 active:scale-90 text-white transition-all cursor-pointer flex items-center justify-center"
                >
                  <RotateCcw className="w-6 h-6 sm:w-7 sm:h-7" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isPlaying) handlePause(e);
                    else handleStartPlay(e);
                  }}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-rose-600 hover:bg-rose-500 active:scale-95 text-white flex items-center justify-center shadow-xl transition-all cursor-pointer ring-2 ring-white/30"
                >
                  {isPlaying ? (
                    <Pause className="w-7 h-7 fill-white" />
                  ) : (
                    <Play className="w-7 h-7 fill-white ml-1" />
                  )}
                </button>

                <button
                  onClick={(e) => skipSeconds(10, e)}
                  aria-label="Seek 10 seconds forward"
                  title="+10s"
                  className="min-h-[44px] min-w-[44px] p-2.5 rounded-full bg-black/60 hover:bg-black/90 active:scale-90 text-white transition-all cursor-pointer flex items-center justify-center"
                >
                  <RotateCw className="w-6 h-6 sm:w-7 sm:h-7" />
                </button>
              </div>

              {/* Bottom Scrub and Volume Bar */}
              <div className="space-y-2 w-full pointer-events-auto">
                {/* Timeline Seekbar */}
                <input
                  type="range"
                  min={0}
                  max={duration || video.durationSeconds || 300}
                  step={0.1}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-2 bg-slate-700/80 rounded-lg appearance-none cursor-pointer accent-rose-500 focus:outline-none"
                />

                {/* Controls Info & Toggles */}
                <div className="flex items-center justify-between text-xs sm:text-sm text-slate-200 font-mono tabular-nums">
                  <div className="flex items-center gap-1.5 font-medium">
                    <span>{formatDuration(currentTime)}</span>
                    <span className="text-slate-500">/</span>
                    <span className="text-slate-400">
                      {formatDuration(duration || video.durationSeconds)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3">
                    <button
                      onClick={toggleMute}
                      aria-label={isMuted ? 'Unmute' : 'Mute'}
                      className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-200 hover:text-white cursor-pointer"
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX className="w-5 h-5 text-rose-400" />
                      ) : (
                        <Volume2 className="w-5 h-5" />
                      )}
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-16 sm:w-20 h-1.5 bg-slate-700 rounded-sm appearance-none accent-rose-500 hidden sm:block cursor-pointer"
                    />

                    {/* Bottom-bar Rotate toggle */}
                    <button
                      onClick={toggleRotate}
                      title={isRotated ? 'Normal portrait view' : 'Rotate to landscape'}
                      className="min-h-[40px] min-w-[40px] flex items-center justify-center text-rose-400 hover:text-white cursor-pointer"
                    >
                      <RotateCw
                        className={`w-4 h-4 transition-transform ${isRotated ? 'rotate-90' : ''}`}
                      />
                    </button>

                    {/* Bottom-bar Fullscreen toggle */}
                    <button
                      onClick={toggleFullscreen}
                      aria-label={isFullscreen ? 'Exit full screen' : 'Expand full screen'}
                      className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-200 hover:text-white cursor-pointer"
                    >
                      {isFullscreen ? (
                        <Minimize className="w-4 h-4 text-rose-400" />
                      ) : (
                        <Maximize className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Thumbnail Preview (Zero YouTube Logo) */
          <div
            onClick={handleStartPlay}
            className="relative w-full h-full cursor-pointer group select-none"
          >
            <img
              src={video.thumbnailUrl}
              alt={video.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/30 flex items-center justify-center">
              <button
                onClick={handleStartPlay}
                aria-label="Play video"
                className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-rose-600/95 hover:bg-rose-500 active:scale-95 text-white flex items-center justify-center shadow-2xl shadow-rose-950/80 transition-all cursor-pointer ring-4 ring-white/20"
              >
                <Play className="w-8 h-8 fill-white ml-1 text-white" />
              </button>
            </div>

            {/* Clean Duration Badge - No YouTube Logo */}
            <div className="absolute bottom-3 right-3 bg-black/90 text-white font-mono text-xs px-2 py-0.5 rounded-md tabular-nums font-semibold border border-white/10">
              {formatDuration(video.durationSeconds)}
            </div>
          </div>
        )}
      </div>

      {/* 
        Video Metadata Area:
        Removed channel name and avatar per user request:
        "Isme Jo niche youtube logo or channel ka naam aa rha hai hata do"
      */}
      <div className="p-3.5 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h2
              onClick={() => {
                if (isPlaying) handlePause();
                else handleStartPlay();
              }}
              className="text-sm sm:text-base font-bold text-white line-clamp-2 leading-snug tracking-tight hover:text-rose-400 cursor-pointer transition-colors"
            >
              {video.title}
            </h2>

            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-400 font-medium">
              <span className="font-mono tabular-nums">{formatViews(video.viewsCount)}</span>
              <span aria-hidden="true" className="text-slate-600">
                ·
              </span>
              <span>{formatRelativeTime(video.publishedAt)}</span>
              {video.categoryName && (
                <>
                  <span aria-hidden="true" className="text-slate-600">
                    ·
                  </span>
                  <span className="text-rose-400/90 font-medium">{video.categoryName}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};
