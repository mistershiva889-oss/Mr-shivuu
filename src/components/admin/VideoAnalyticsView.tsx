import React, { useState, useEffect } from 'react';
import { Video } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import {
  ArrowLeft,
  Eye,
  Users,
  Clock,
  CheckCircle2,
  TrendingUp,
  BarChart,
  Calendar,
} from 'lucide-react';

interface VideoAnalyticsViewProps {
  videoId: string;
  onBack: () => void;
}

export const VideoAnalyticsView: React.FC<VideoAnalyticsViewProps> = ({ videoId, onBack }) => {
  const [data, setData] = useState<{ video: Video; analytics: any } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const res = await api.getVideoAnalytics(videoId);
        setData(res);
      } catch (e) {
        console.error('Failed to load video analytics:', e);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [videoId]);

  if (isLoading || !data) {
    return (
      <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
        <div className="w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
        <span>Aggregating video performance telemetry...</span>
      </div>
    );
  }

  const { video, analytics } = data;

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  }

  const maxVal = Math.max(...analytics.dailyBreakdown.map((d: any) => d.views), 1);

  return (
    <div className="space-y-6">
      {/* Top back button & Video Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="self-start text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Video Catalog</span>
        </button>

        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-rose-400 self-start sm:self-auto uppercase tracking-wider">
          Telemetry Inspection
        </span>
      </div>

      {/* Video Overview Banner */}
      <div className="p-5 rounded-2xl bg-[#0d1019] border border-slate-800 flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="w-36 aspect-video rounded-xl overflow-hidden bg-black shrink-0 relative">
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-white tracking-tight line-clamp-1">
            {video.title}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span>By {video.channelName}</span>
            <span aria-hidden="true">·</span>
            <span>{video.categoryName || 'General'}</span>
            <span aria-hidden="true">·</span>
            <span>Source: {video.sourceType.toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* 4 Performance Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-[#0d1019] border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Streams</span>
            <Eye className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">
            {analytics.totalViews.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Accumulated views</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0d1019] border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Unique Viewers</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">
            {analytics.uniqueViewers.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Distinct user profiles</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0d1019] border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Avg Watch Duration</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">
            {formatTime(analytics.avgWatchDurationSeconds)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Out of {formatTime(video.durationSeconds)}</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#0d1019] border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Completion Rate</span>
            <CheckCircle2 className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 font-mono tabular-nums">
            {analytics.completionRate}%
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Full-length engagement</span>
        </div>
      </div>

      {/* Daily Breakdown Chart */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#0d1019] border border-slate-800">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BarChart className="w-5 h-5 text-rose-500" />
            <h2 className="text-base font-bold text-white">Daily Streams (Past 7 Days)</h2>
          </div>
        </div>

        <div className="w-full h-48 flex items-end gap-3 pt-4 pb-2 border-b border-slate-800">
          {analytics.dailyBreakdown.map((day: any, i: number) => {
            const h = Math.max(10, Math.round((day.views / maxVal) * 100));
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 border border-slate-700 text-white text-[10px] font-mono py-0.5 px-1.5 rounded-sm">
                  {day.views.toLocaleString()}
                </span>
                <div
                  style={{ height: `${h}%` }}
                  className="w-full max-w-[28px] rounded-t-lg bg-rose-600 hover:bg-rose-500 transition-all cursor-pointer"
                />
                <span className="text-[11px] text-slate-400 font-medium">
                  {day.date}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
