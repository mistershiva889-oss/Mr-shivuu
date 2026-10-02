export interface User {
  id: string;
  name: string;
  mobileNumber: string;
  createdAt: string;
  lastActiveAt: string;
  status: 'active' | 'blocked';
  totalVideosWatched?: number;
}

export interface Video {
  id: string;
  title: string;
  description: string;
  channelName: string;
  channelAvatar?: string;
  thumbnailUrl: string;
  videoUrl: string;
  sourceType: 'youtube' | 'direct';
  youtubeId?: string;
  durationSeconds: number;
  categoryId: string;
  categoryName?: string;
  viewsCount: number;
  uniqueViewersCount: number;
  avgWatchDurationSeconds: number;
  completionRate: number; // percentage e.g. 68.5%
  isPublished: boolean;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  order: number;
  videoCount?: number;
}

export interface VideoViewAnalytics {
  id: string;
  videoId: string;
  userId?: string;
  watchDurationSeconds: number;
  completionRate: number;
  viewedAt: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'superadmin' | 'admin' | 'editor';
  createdAt: string;
  lastLoginAt: string;
}

export interface AdminActivityLog {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  entityType: 'video' | 'user' | 'category' | 'settings' | 'auth';
  entityId?: string;
  details: string;
  ipAddress: string;
  createdAt: string;
}

export interface AppSettings {
  appName: string;
  appLogo: string;
  tagline: string;
  maintenanceMode: boolean;
  termsAndPrivacy: string;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalVideos: number;
  totalViews: number;
  videosPublishedToday: number;
  dailyViews: { date: string; views: number }[];
  weeklyViews: { week: string; views: number }[];
  monthlyViews: { month: string; views: number }[];
  mostWatchedVideos: (Video & { views: number })[];
}
