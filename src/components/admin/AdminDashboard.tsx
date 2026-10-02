import React, { useState, useEffect } from 'react';
import { DashboardStats } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import {
  Users,
  Video,
  Eye,
  Activity,
  Calendar,
  TrendingUp,
  BarChart3,
  RefreshCw,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewTimeframe, setViewTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAdminDashboard();
      setStats(data);
    } catch (e) {
      console.error('Failed to load dashboard statistics:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (isLoading || !stats) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-slate-400 text-sm">
          <div className="w-5 h-5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading telemetry and video statistics...</span>
        </div>
      </div>
    );
  }

  // Active chart data
  const chartData =
    viewTimeframe === 'daily'
      ? stats.dailyViews.map((d) => ({ label: d.date, value: d.views }))
      : viewTimeframe === 'weekly'
      ? stats.weeklyViews.map((w) => ({ label: w.week, value: w.views }))
      : stats.monthlyViews.map((m) => ({ label: m.month, value: m.views }));

  const maxVal = Math.max(...chartData.map((c) => c.value), 1);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            System Overview & Metrics
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Real-time streaming consumption, registered user reach, and video catalog health.
          </p>
        </div>
        <button
          onClick={loadStats}
          className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* 5 Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3.5">
        {/* Total Users */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#0d1019] border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] sm:text-xs font-medium">Total Users</span>
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white font-mono tabular-nums">
            {stats.totalUsers.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Registered on app</span>
        </div>

        {/* Active Users */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#0d1019] border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] sm:text-xs font-medium">Active Users</span>
            <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white font-mono tabular-nums">
            {stats.activeUsers.toLocaleString()}
          </div>
          <span className="text-[10px] text-emerald-400/90 mt-1 block">Active status</span>
        </div>

        {/* Total Videos */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#0d1019] border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] sm:text-xs font-medium">Total Videos</span>
            <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-violet-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white font-mono tabular-nums">
            {stats.totalVideos.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Hosted & YouTube</span>
        </div>

        {/* Total Views */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#0d1019] border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] sm:text-xs font-medium">Total Views</span>
            <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white font-mono tabular-nums truncate">
            {stats.totalViews.toLocaleString()}
          </div>
          <span className="text-[10px] text-rose-400/90 mt-1 block">Aggregate streams</span>
        </div>

        {/* Published Today */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-[#0d1019] border border-slate-800 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] sm:text-xs font-medium">Published Today</span>
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-white font-mono tabular-nums">
            {stats.videosPublishedToday}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">In last 24 hours</span>
        </div>
      </div>

      {/* Views Analytics Chart */}
      <div className="p-4 sm:p-6 rounded-2xl bg-[#0d1019] border border-slate-800 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500" />
            <h2 className="text-sm sm:text-base font-bold text-white">Stream Consumption Analytics</h2>
          </div>

          {/* Segmented Timeframe Control */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl self-start sm:self-auto">
            {(['daily', 'weekly', 'monthly'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setViewTimeframe(t)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-colors cursor-pointer ${
                  viewTimeframe === t
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Responsive Horizontal-Scrollable Bar Chart with clear container boundary */}
        <div className="w-full overflow-x-auto scrollbar-none pb-2 -mx-1 px-1">
          <div className="min-w-[320px] w-full h-48 sm:h-56 flex items-end gap-1.5 sm:gap-3 pt-4 pb-2 border-b border-slate-800">
            {chartData.map((item, index) => {
              const heightPercent = Math.max(12, Math.round((item.value / maxVal) * 100));
              return (
                <div key={index} className="flex-1 min-w-[20px] flex flex-col items-center gap-1.5 h-full justify-end group">
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 border border-slate-700 text-white text-[9px] sm:text-[10px] font-mono py-0.5 px-1 rounded-sm pointer-events-none whitespace-nowrap mb-1">
                    {item.value.toLocaleString()}
                  </div>
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-full max-w-[24px] sm:max-w-[32px] rounded-t-md sm:rounded-t-lg bg-gradient-to-t from-rose-700 to-rose-500 group-hover:from-rose-600 group-hover:to-rose-400 transition-all cursor-pointer shadow-xs shadow-rose-950"
                  />
                  <span className="text-[9px] sm:text-xs text-slate-400 font-medium truncate w-full text-center">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Most Watched Videos Table */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#0d1019] border border-slate-800">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-rose-500" />
          <h2 className="text-base font-bold text-white">Most Watched Videos</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="pb-3 pl-2">Rank</th>
                <th className="pb-3">Video Title</th>
                <th className="pb-3">Channel</th>
                <th className="pb-3 text-right">Views</th>
                <th className="pb-3 text-right pr-2">Completion Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {stats.mostWatchedVideos.map((video, idx) => (
                <tr key={video.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="py-3 pl-2 font-mono text-slate-500">#{idx + 1}</td>
                  <td className="py-3 pr-4 max-w-xs truncate text-white font-semibold">
                    {video.title}
                  </td>
                  <td className="py-3 text-slate-400">{video.channelName}</td>
                  <td className="py-3 text-right font-mono tabular-nums text-slate-200">
                    {video.views.toLocaleString()}
                  </td>
                  <td className="py-3 text-right pr-2 font-mono tabular-nums text-emerald-400">
                    {video.completionRate}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
