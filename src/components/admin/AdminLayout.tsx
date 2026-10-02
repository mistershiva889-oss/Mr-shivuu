import React, { useState } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext.tsx';
import { useApp } from '../../context/AppContext.tsx';
import { AdminDashboard } from './AdminDashboard.tsx';
import { UserManagement } from './UserManagement.tsx';
import { VideoManagement } from './VideoManagement.tsx';
import { VideoAnalyticsView } from './VideoAnalyticsView.tsx';
import { CategoryManagement } from './CategoryManagement.tsx';
import { AppSettingsView } from './AppSettingsView.tsx';
import { ActivityLogsView } from './ActivityLogsView.tsx';
import { ChangePasswordModal } from './ChangePasswordModal.tsx';
import {
  LayoutDashboard,
  Users,
  Video,
  Tags,
  Sliders,
  FileCode2,
  LogOut,
  Smartphone,
  Shield,
  Menu,
  X,
  KeyRound,
} from 'lucide-react';

interface AdminLayoutProps {
  onBackToUserApp: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ onBackToUserApp }) => {
  const { admin, logout } = useAdminAuth();
  const { categories, refreshCategories, settings } = useApp();

  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'users' | 'videos' | 'analytics' | 'categories' | 'settings' | 'logs'
  >('dashboard');

  const [inspectedVideoId, setInspectedVideoId] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const handleInspectAnalytics = (videoId: string) => {
    setInspectedVideoId(videoId);
    setActiveTab('analytics');
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'videos', label: 'Videos', icon: Video },
    { id: 'categories', label: 'Categories', icon: Tags },
    { id: 'settings', label: 'App Settings', icon: Sliders },
    { id: 'logs', label: 'Activity Logs', icon: FileCode2 },
  ] as const;

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col md:flex-row antialiased selection:bg-rose-500 selection:text-white overflow-x-hidden">
      {/* Mobile Top Bar */}
      <div className="md:hidden h-14 bg-[#0d1019] border-b border-slate-800 px-3.5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            aria-label="Toggle menu"
            className="p-1.5 rounded-lg text-slate-300 hover:text-white cursor-pointer"
          >
            {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <span className="font-bold text-sm text-white">StreamVibe Admin</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsPasswordModalOpen(true)}
            title="Change Admin Password"
            className="text-xs bg-slate-900 text-slate-300 hover:text-white border border-slate-800 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5 text-rose-500" />
            <span className="hidden sm:inline">Password</span>
          </button>
          <button
            onClick={onBackToUserApp}
            className="text-xs bg-rose-600/10 text-rose-400 hover:text-white hover:bg-rose-600 border border-rose-500/30 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>User App</span>
          </button>
        </div>
      </div>

      {/* Mobile Quick Horizontal Nav Tabs (Always visible on mobile phone) */}
      <div className="md:hidden flex items-center gap-1.5 overflow-x-auto scrollbar-none px-3 py-2 bg-[#0a0d14] border-b border-slate-800/80 sticky top-14 z-20">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            activeTab === item.id || (item.id === 'videos' && activeTab === 'analytics');

          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setInspectedVideoId(null);
                setIsMobileSidebarOpen(false);
              }}
              className={`h-8 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer ${
                isActive
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white bg-slate-900/80 border border-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Backdrop for Mobile Sidebar Drawer */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="md:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-xs"
        />
      )}

      {/* Sidebar (Desktop 260px wide, or Mobile Slide-over) */}
      <aside
        className={`${
          isMobileSidebarOpen
            ? 'fixed top-0 bottom-0 left-0 z-50 bg-[#0d1019] flex flex-col p-6 w-72 shadow-2xl border-r border-slate-800'
            : 'hidden md:flex flex-col w-64 lg:w-72 bg-[#0d1019] border-r border-slate-800/80 p-5 shrink-0 min-h-screen'
        }`}
      >
        {/* Brand Zone */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-800/80 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-600/10 border border-rose-500/30 text-rose-500 flex items-center justify-center font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-extrabold text-white block tracking-tight">
                {settings?.appName || 'StreamVibe'}
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-medium">
                Admin Console
              </span>
            </div>
          </div>
          {isMobileSidebarOpen && (
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="md:hidden text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation List */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              activeTab === item.id || (item.id === 'videos' && activeTab === 'analytics');

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setInspectedVideoId(null);
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full h-11 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-950/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Quick Launch User App & Admin Profile */}
        <div className="pt-6 border-t border-slate-800/80 space-y-3">
          <button
            onClick={onBackToUserApp}
            className="w-full h-10 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 border border-slate-800 transition-colors cursor-pointer"
          >
            <Smartphone className="w-3.5 h-3.5 text-rose-500" />
            <span>Switch to Mobile View</span>
          </button>

          <div className="p-3 rounded-xl bg-[#090b11] border border-slate-800 flex items-center justify-between">
            <div className="overflow-hidden min-w-0 pr-2">
              <span className="text-xs font-semibold text-white block truncate">
                {admin?.name || 'Administrator'}
              </span>
              <span className="text-[10px] text-slate-500 block truncate">
                {admin?.email}
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setIsPasswordModalOpen(true)}
                title="Change Admin Password"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
              </button>
              <button
                onClick={() => logout()}
                title="Sign Out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Workspace Canvas */}
      <main className="flex-1 p-3.5 sm:p-8 lg:p-10 max-w-7xl w-full overflow-y-auto overflow-x-hidden min-w-0">
        {activeTab === 'dashboard' && <AdminDashboard />}
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'videos' && (
          <VideoManagement
            categories={categories}
            onInspectAnalytics={handleInspectAnalytics}
          />
        )}
        {activeTab === 'analytics' && inspectedVideoId && (
          <VideoAnalyticsView
            videoId={inspectedVideoId}
            onBack={() => {
              setInspectedVideoId(null);
              setActiveTab('videos');
            }}
          />
        )}
        {activeTab === 'categories' && (
          <CategoryManagement
            categories={categories}
            onRefreshCategories={refreshCategories}
          />
        )}
        {activeTab === 'settings' && <AppSettingsView />}
        {activeTab === 'logs' && <ActivityLogsView />}
      </main>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
};
