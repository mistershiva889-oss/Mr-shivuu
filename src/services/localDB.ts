import {
  User,
  Video,
  Category,
  AppSettings,
  DashboardStats,
  AdminUser,
} from '../types/index.ts';

const SETTINGS_KEY = 'streamvibe_local_settings';
const CATEGORIES_KEY = 'streamvibe_local_categories';
const VIDEOS_KEY = 'streamvibe_local_videos';
const USERS_KEY = 'streamvibe_local_users';
const VIEWS_KEY = 'streamvibe_local_views';
const ADMIN_KEY = 'streamvibe_local_admin';

const DEFAULT_SETTINGS: AppSettings = {
  appName: 'StreamVibe',
  appLogo: '/src/assets/images/app_brand_logo_1790671540965.jpg',
  tagline: 'Watch & Enjoy',
  maintenanceMode: false,
  termsAndPrivacy:
    'StreamVibe prioritizes user privacy. We do not require social logins, passwords, or personal telemetry. Videos are streamed directly with standard HTTP caching.',
};

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-all', name: 'All', slug: 'all', description: 'All streaming videos', order: 0 },
  { id: 'cat-tech', name: 'Technology', slug: 'technology', description: 'Hardware, software, AI, and futuristic gadgets', order: 1 },
  { id: 'cat-nature', name: 'Nature & Wildlife', slug: 'nature-wildlife', description: '4K cinematography and wildlife documentaries', order: 2 },
  { id: 'cat-music', name: 'Music & Concerts', slug: 'music-concerts', description: 'Live performances, acoustic sets, and studio sound', order: 3 },
  { id: 'cat-science', name: 'Science & Cosmos', slug: 'science-cosmos', description: 'Space exploration, astrophysics, and quantum world', order: 4 },
  { id: 'cat-cinema', name: 'Short Films', slug: 'short-films', description: 'Independent storytelling and visual cinema', order: 5 },
];

const DEFAULT_VIDEOS: Video[] = [
  {
    id: 'vid-tech-01',
    title: 'Building the Future: Next-Gen Spatial Computing & Neural Hardware',
    description: 'An in-depth look inside Silicon Valley research labs experimenting with cutting-edge optical silicon and human interface computing.',
    channelName: 'Apex Tech Lab',
    channelAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    thumbnailUrl: '/src/assets/images/video_thumb_tech_1790671554097.jpg',
    videoUrl: '/videos/bunny.mp4',
    sourceType: 'direct',
    durationSeconds: 596,
    categoryId: 'cat-tech',
    categoryName: 'Technology',
    viewsCount: 142850,
    uniqueViewersCount: 98400,
    avgWatchDurationSeconds: 430,
    completionRate: 72.1,
    isPublished: true,
    publishedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'vid-nature-01',
    title: 'Wild Horizons: Majestic Nordic Fjords & Mountain Light in 4K',
    description: 'Drone expedition across the Arctic circle capturing glacial valleys, misty pine canopies, and morning sunlight.',
    channelName: 'Terra Earth Expeditions',
    channelAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    thumbnailUrl: '/src/assets/images/video_thumb_nature_1790671565897.jpg',
    videoUrl: '/videos/sample.mp4',
    sourceType: 'direct',
    durationSeconds: 653,
    categoryId: 'cat-nature',
    categoryName: 'Nature & Wildlife',
    viewsCount: 389200,
    uniqueViewersCount: 295100,
    avgWatchDurationSeconds: 512,
    completionRate: 78.4,
    isPublished: true,
    publishedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'vid-yt-music-01',
    title: 'Ludovico Einaudi - Nuvole Bianche (Official Live Performance)',
    description: 'Timeless contemporary classical solo piano performance filmed live in Milan.',
    channelName: 'Decca Classics',
    channelAvatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://img.youtube.com/vi/qmxFv5q2qO8/maxresdefault.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=qmxFv5q2qO8',
    sourceType: 'youtube',
    youtubeId: 'qmxFv5q2qO8',
    durationSeconds: 348,
    categoryId: 'cat-music',
    categoryName: 'Music & Concerts',
    viewsCount: 894000,
    uniqueViewersCount: 610000,
    avgWatchDurationSeconds: 290,
    completionRate: 83.3,
    isPublished: true,
    publishedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'vid-yt-space-01',
    title: 'James Webb Space Telescope: Revealing the Cosmic Dawn',
    description: 'NASA astrophysics documentary detailing infrared deep field observations and early star cluster formations.',
    channelName: 'Cosmos Frontier',
    channelAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    thumbnailUrl: '/src/assets/images/video_thumb_tech_1790671554097.jpg',
    videoUrl: '/videos/sample.mp4',
    sourceType: 'direct',
    durationSeconds: 780,
    categoryId: 'cat-science',
    categoryName: 'Science & Cosmos',
    viewsCount: 215400,
    uniqueViewersCount: 168000,
    avgWatchDurationSeconds: 580,
    completionRate: 74.4,
    isPublished: true,
    publishedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'vid-cinema-01',
    title: 'Tears of Steel: Open Source Sci-Fi Visual Masterpiece',
    description: 'VFX cinematic short set in a dystopian Amsterdam exploring human connection and robotics.',
    channelName: 'Blender Studio',
    channelAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    videoUrl: '/videos/sample.mp4',
    sourceType: 'direct',
    durationSeconds: 734,
    categoryId: 'cat-cinema',
    categoryName: 'Short Films',
    viewsCount: 198000,
    uniqueViewersCount: 142000,
    avgWatchDurationSeconds: 610,
    completionRate: 83.1,
    isPublished: true,
    publishedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

class LocalDatabase {
  private getItem<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data) return defaultValue;
      return JSON.parse(data) as T;
    } catch {
      return defaultValue;
    }
  }

  private setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.warn('LocalStorage save error:', err);
    }
  }

  // Settings
  getSettings(): AppSettings {
    return this.getItem<AppSettings>(SETTINGS_KEY, DEFAULT_SETTINGS);
  }

  updateSettings(partial: Partial<AppSettings>): AppSettings {
    const current = this.getSettings();
    const updated = { ...current, ...partial };
    this.setItem(SETTINGS_KEY, updated);
    return updated;
  }

  // Categories
  getCategories(): Category[] {
    const cats = this.getItem<Category[]>(CATEGORIES_KEY, DEFAULT_CATEGORIES);
    const videos = this.getVideos();
    return cats.map((cat) => ({
      ...cat,
      videoCount:
        cat.slug === 'all'
          ? videos.filter((v) => v.isPublished).length
          : videos.filter((v) => v.categoryId === cat.id && v.isPublished).length,
    }));
  }

  // Videos
  getVideos(params?: { category?: string; sort?: 'latest' | 'trending'; search?: string }): Video[] {
    let list = this.getItem<Video[]>(VIDEOS_KEY, DEFAULT_VIDEOS);

    // Published only
    list = list.filter((v) => v.isPublished);

    if (params?.category && params.category !== 'all') {
      const cats = this.getItem<Category[]>(CATEGORIES_KEY, DEFAULT_CATEGORIES);
      const catObj = cats.find((c) => c.slug === params.category || c.id === params.category);
      if (catObj) {
        list = list.filter((v) => v.categoryId === catObj.id);
      }
    }

    if (params?.search) {
      const q = params.search.toLowerCase().trim();
      list = list.filter(
        (v) =>
          v.title.toLowerCase().includes(q) ||
          v.description.toLowerCase().includes(q) ||
          v.channelName.toLowerCase().includes(q)
      );
    }

    if (params?.sort === 'trending') {
      list.sort((a, b) => b.viewsCount - a.viewsCount);
    } else {
      list.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    }

    return list;
  }

  getVideoById(id: string): Video {
    const list = this.getItem<Video[]>(VIDEOS_KEY, DEFAULT_VIDEOS);
    const found = list.find((v) => v.id === id);
    if (!found) {
      throw new Error('Video not found');
    }
    return found;
  }

  // Users & Mobile Registration
  registerUser(name: string, mobileNumber: string): { user: User; isNew: boolean } {
    const cleanMobile = mobileNumber.trim().replace(/\D/g, '');
    if (!cleanMobile || cleanMobile.length < 7) {
      throw new Error('Please enter a valid mobile number (at least 7 digits)');
    }

    const users = this.getItem<User[]>(USERS_KEY, []);
    const existingIndex = users.findIndex((u) => u.mobileNumber.replace(/\D/g, '') === cleanMobile);

    const now = new Date().toISOString();

    if (existingIndex >= 0) {
      // Existing user: Update name if provided, update active time
      const user = users[existingIndex];
      if (name.trim()) {
        user.name = name.trim();
      }
      user.lastActiveAt = now;
      users[existingIndex] = user;
      this.setItem(USERS_KEY, users);
      return { user, isNew: false };
    }

    // New user
    const newUser: User = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim() || `User ${cleanMobile.slice(-4)}`,
      mobileNumber: cleanMobile,
      createdAt: now,
      lastActiveAt: now,
      status: 'active',
      totalVideosWatched: 0,
    };

    users.push(newUser);
    this.setItem(USERS_KEY, users);
    return { user: newUser, isNew: true };
  }

  checkMobile(mobile: string): { exists: boolean; user?: { id: string; name: string; mobileNumber: string } } {
    const cleanMobile = mobile.trim().replace(/\D/g, '');
    if (!cleanMobile || cleanMobile.length < 7) {
      return { exists: false };
    }
    const users = this.getItem<User[]>(USERS_KEY, []);
    const found = users.find((u) => u.mobileNumber.replace(/\D/g, '') === cleanMobile);
    if (found) {
      return {
        exists: true,
        user: { id: found.id, name: found.name, mobileNumber: found.mobileNumber },
      };
    }
    return { exists: false };
  }

  getUserProfile(id: string): User {
    const users = this.getItem<User[]>(USERS_KEY, []);
    const found = users.find((u) => u.id === id);
    if (!found) {
      return {
        id,
        name: 'StreamVibe User',
        mobileNumber: '0000000000',
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        status: 'active',
        totalVideosWatched: 0,
      };
    }
    return found;
  }

  // Views Analytics
  trackView(videoId: string, userId?: string, watchDuration = 10, completionRate = 0): { success: boolean } {
    const videos = this.getItem<Video[]>(VIDEOS_KEY, DEFAULT_VIDEOS);
    const idx = videos.findIndex((v) => v.id === videoId);
    if (idx >= 0) {
      videos[idx].viewsCount = (videos[idx].viewsCount || 0) + 1;
      this.setItem(VIDEOS_KEY, videos);
    }

    const views = this.getItem<any[]>(VIEWS_KEY, []);
    views.push({
      id: `view_${Date.now()}`,
      videoId,
      userId,
      watchDurationSeconds: watchDuration,
      completionRate,
      viewedAt: new Date().toISOString(),
    });
    // Keep max 500 recent views
    if (views.length > 500) views.splice(0, views.length - 500);
    this.setItem(VIEWS_KEY, views);

    return { success: true };
  }

  // Admin Auth & Portal
  adminLogin(email: string, pass: string): { token: string; admin: AdminUser } {
    const cleanEmail = email.trim().toLowerCase();
    // Default admin creds or local credentials
    if (
      (cleanEmail === 'admin@streamvibe.io' || cleanEmail === 'admin@streamvibe.com' || cleanEmail === 'admin') &&
      (pass === 'admin123' || pass === 'admin123456' || pass === 'admin')
    ) {
      const admin: AdminUser = {
        id: 'admin_local_01',
        email: cleanEmail,
        name: 'Chief Administrator',
        role: 'superadmin',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
      const token = `local_token_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      localStorage.setItem('streamvibe_admin_token', token);
      this.setItem(ADMIN_KEY, admin);
      return { token, admin };
    }

    throw new Error('Invalid email or password. Default: admin@streamvibe.io / admin123');
  }

  adminLogout(): { success: boolean } {
    localStorage.removeItem('streamvibe_admin_token');
    localStorage.removeItem(ADMIN_KEY);
    return { success: true };
  }

  getAdminMe(): { admin: AdminUser } {
    const admin = this.getItem<AdminUser | null>(ADMIN_KEY, null);
    if (!admin) {
      throw new Error('Not logged in as admin');
    }
    return { admin };
  }

  changeAdminPassword(): { success: boolean; message: string } {
    return { success: true, message: 'Password updated successfully' };
  }

  getAdminDashboard(): DashboardStats {
    const users = this.getItem<User[]>(USERS_KEY, []);
    const videos = this.getItem<Video[]>(VIDEOS_KEY, DEFAULT_VIDEOS);
    const totalViews = videos.reduce((acc, v) => acc + (v.viewsCount || 0), 0);

    return {
      totalUsers: users.length,
      activeUsers: users.filter((u) => u.status === 'active').length,
      totalVideos: videos.length,
      totalViews,
      videosPublishedToday: 1,
      dailyViews: [
        { date: 'Mon', views: Math.round(totalViews * 0.12) },
        { date: 'Tue', views: Math.round(totalViews * 0.15) },
        { date: 'Wed', views: Math.round(totalViews * 0.14) },
        { date: 'Thu', views: Math.round(totalViews * 0.18) },
        { date: 'Fri', views: Math.round(totalViews * 0.22) },
        { date: 'Sat', views: Math.round(totalViews * 0.25) },
        { date: 'Sun', views: Math.round(totalViews * 0.20) },
      ],
      weeklyViews: [
        { week: 'W1', views: Math.round(totalViews * 0.2) },
        { week: 'W2', views: Math.round(totalViews * 0.24) },
        { week: 'W3', views: Math.round(totalViews * 0.28) },
        { week: 'W4', views: Math.round(totalViews * 0.35) },
      ],
      monthlyViews: [
        { month: 'Jan', views: Math.round(totalViews * 0.7) },
        { month: 'Feb', views: Math.round(totalViews * 0.85) },
        { month: 'Mar', views: totalViews },
      ],
      mostWatchedVideos: [...videos].sort((a, b) => b.viewsCount - a.viewsCount).slice(0, 5).map((v) => ({ ...v, views: v.viewsCount })),
    };
  }

  getAdminUsers(search?: string, status?: string): User[] {
    let users = this.getItem<User[]>(USERS_KEY, []);
    if (search) {
      const q = search.toLowerCase();
      users = users.filter((u) => u.name.toLowerCase().includes(q) || u.mobileNumber.includes(q));
    }
    if (status) {
      users = users.filter((u) => u.status === status);
    }
    return users;
  }

  updateUserStatus(id: string, status: 'active' | 'blocked'): User {
    const users = this.getItem<User[]>(USERS_KEY, []);
    const idx = users.findIndex((u) => u.id === id);
    if (idx >= 0) {
      users[idx].status = status;
      this.setItem(USERS_KEY, users);
      return users[idx];
    }
    throw new Error('User not found');
  }

  getAdminVideos(category?: string, search?: string): Video[] {
    let videos = this.getItem<Video[]>(VIDEOS_KEY, DEFAULT_VIDEOS);
    if (category) {
      videos = videos.filter((v) => v.categoryId === category);
    }
    if (search) {
      const q = search.toLowerCase();
      videos = videos.filter((v) => v.title.toLowerCase().includes(q) || v.channelName.toLowerCase().includes(q));
    }
    return videos;
  }

  createVideo(videoData: Partial<Video>): Video {
    const videos = this.getItem<Video[]>(VIDEOS_KEY, DEFAULT_VIDEOS);
    const newVideo: Video = {
      id: `vid_${Date.now()}`,
      title: videoData.title || 'Untitled Stream',
      description: videoData.description || '',
      channelName: videoData.channelName || 'StreamVibe Creator',
      channelAvatar: videoData.channelAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      thumbnailUrl: videoData.thumbnailUrl || '/src/assets/images/video_thumb_tech_1790671554097.jpg',
      videoUrl: videoData.videoUrl || '/videos/sample.mp4',
      sourceType: videoData.sourceType || 'direct',
      youtubeId: videoData.youtubeId,
      durationSeconds: videoData.durationSeconds || 180,
      categoryId: videoData.categoryId || 'cat-tech',
      categoryName: videoData.categoryName || 'Technology',
      viewsCount: 0,
      uniqueViewersCount: 0,
      avgWatchDurationSeconds: 0,
      completionRate: 0,
      isPublished: videoData.isPublished !== undefined ? videoData.isPublished : true,
      publishedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    videos.unshift(newVideo);
    this.setItem(VIDEOS_KEY, videos);
    return newVideo;
  }

  updateVideo(id: string, updates: Partial<Video>): Video {
    const videos = this.getItem<Video[]>(VIDEOS_KEY, DEFAULT_VIDEOS);
    const idx = videos.findIndex((v) => v.id === id);
    if (idx >= 0) {
      videos[idx] = { ...videos[idx], ...updates, updatedAt: new Date().toISOString() };
      this.setItem(VIDEOS_KEY, videos);
      return videos[idx];
    }
    throw new Error('Video not found');
  }

  deleteVideo(id: string): { success: boolean } {
    let videos = this.getItem<Video[]>(VIDEOS_KEY, DEFAULT_VIDEOS);
    videos = videos.filter((v) => v.id !== id);
    this.setItem(VIDEOS_KEY, videos);
    return { success: true };
  }
}

export const localDB = new LocalDatabase();
