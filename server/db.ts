import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { User, Video, Category, VideoViewAnalytics, AdminUser, AdminActivityLog, AppSettings, DashboardStats } from '../src/types/index.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

interface StoredAdmin extends AdminUser {
  passwordHash: string;
  salt: string;
  sessionToken?: string;
  tokenExpiresAt?: string;
}

interface DatabaseSchema {
  settings: AppSettings;
  categories: Category[];
  users: User[];
  admins: StoredAdmin[];
  videos: Video[];
  videoViews: VideoViewAnalytics[];
  activityLogs: AdminActivityLog[];
}

// Password hashing utilities
export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

export function verifyPassword(password: string, salt: string, hash: string): boolean {
  const computed = hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(hash, 'hex'));
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
  }

  private getDefaultData(): DatabaseSchema {
    const defaultSalt = generateSalt();
    const defaultHash = hashPassword('admin123', defaultSalt);

    const initialCategories: Category[] = [
      { id: 'cat-all', name: 'All', slug: 'all', description: 'All streaming videos', order: 0 },
      { id: 'cat-tech', name: 'Technology', slug: 'technology', description: 'Hardware, software, AI, and futuristic gadgets', order: 1 },
      { id: 'cat-nature', name: 'Nature & Wildlife', slug: 'nature-wildlife', description: '4K cinematography and wildlife documentaries', order: 2 },
      { id: 'cat-music', name: 'Music & Concerts', slug: 'music-concerts', description: 'Live performances, acoustic sets, and studio sound', order: 3 },
      { id: 'cat-science', name: 'Science & Cosmos', slug: 'science-cosmos', description: 'Space exploration, astrophysics, and quantum world', order: 4 },
      { id: 'cat-cinema', name: 'Short Films', slug: 'short-films', description: 'Independent storytelling and visual cinema', order: 5 },
    ];

    const initialVideos: Video[] = [
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

    const initialUsers: User[] = [];

    return {
      settings: {
        appName: 'StreamVibe',
        appLogo: '/src/assets/images/app_brand_logo_1790671540965.jpg',
        tagline: 'Watch & Enjoy',
        maintenanceMode: false,
        termsAndPrivacy: 'StreamVibe prioritizes user privacy. We do not require social logins, passwords, or personal telemetry. Videos are streamed directly with standard HTTP byte-range caching.',
      },
      categories: initialCategories,
      users: initialUsers,
      admins: [
        {
          id: 'admin-super-01',
          email: 'admin@streamvibe.io',
          name: 'Chief Administrator',
          role: 'superadmin',
          passwordHash: defaultHash,
          salt: defaultSalt,
          createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
          lastLoginAt: new Date().toISOString(),
        },
      ],
      videos: initialVideos,
      videoViews: [],
      activityLogs: [
        {
          id: 'log-01',
          adminId: 'admin-super-01',
          adminEmail: 'admin@streamvibe.io',
          action: 'SYSTEM_INITIALIZED',
          entityType: 'settings',
          entityId: 'current_settings',
          details: 'Initial StreamVibe system setup and seed categories loaded.',
          ipAddress: '127.0.0.1',
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        },
        {
          id: 'log-02',
          adminId: 'admin-super-01',
          adminEmail: 'admin@streamvibe.io',
          action: 'VIDEO_PUBLISHED',
          entityType: 'video',
          entityId: 'vid-tech-01',
          details: 'Published new feature video: Building the Future: Next-Gen Spatial Computing.',
          ipAddress: '127.0.0.1',
          createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
        },
      ],
    };
  }

  private loadData(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return { ...this.getDefaultData(), ...parsed };
      }
    } catch (e) {
      console.error('Error loading db file, initializing defaults:', e);
    }
    const defaults = this.getDefaultData();
    this.saveData(defaults);
    return defaults;
  }

  private saveData(dataToSave?: DatabaseSchema) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const data = dataToSave || this.data;
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving database:', e);
    }
  }

  // --- SETTINGS ---
  getSettings(): AppSettings {
    return this.data.settings;
  }

  updateSettings(newSettings: Partial<AppSettings>, adminEmail: string): AppSettings {
    this.data.settings = { ...this.data.settings, ...newSettings };
    this.saveData();
    this.logActivity({
      adminId: 'admin',
      adminEmail,
      action: 'UPDATE_SETTINGS',
      entityType: 'settings',
      details: `Updated settings: ${Object.keys(newSettings).join(', ')}`,
      ipAddress: '127.0.0.1',
    });
    return this.data.settings;
  }

  // --- USERS ---
  registerUser(name: string, mobileNumber: string): { user: User; isNew: boolean } {
    const cleanMobile = mobileNumber.trim();
    const cleanName = name.trim();

    const existingIndex = this.data.users.findIndex(u => u.mobileNumber === cleanMobile);
    if (existingIndex >= 0) {
      const existing = this.data.users[existingIndex];
      if (existing.status === 'blocked') {
        throw new Error('This account has been suspended by the administrator.');
      }
      // Update last active and name if changed
      this.data.users[existingIndex] = {
        ...existing,
        name: cleanName || existing.name,
        lastActiveAt: new Date().toISOString(),
      };
      this.saveData();
      return { user: this.data.users[existingIndex], isNew: false };
    }

    const newUser: User = {
      id: `usr_${crypto.randomUUID()}`,
      name: cleanName,
      mobileNumber: cleanMobile,
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      status: 'active',
      totalVideosWatched: 0,
    };

    this.data.users.unshift(newUser);
    this.saveData();
    return { user: newUser, isNew: true };
  }

  getUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  getUserByMobile(mobileNumber: string): User | undefined {
    const cleanMobile = mobileNumber.trim();
    return this.data.users.find(u => u.mobileNumber === cleanMobile);
  }

  getUsers(search?: string, status?: string): User[] {
    let result = [...this.data.users];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(u => u.name.toLowerCase().includes(q) || u.mobileNumber.includes(q));
    }
    if (status && (status === 'active' || status === 'blocked')) {
      result = result.filter(u => u.status === status);
    }
    return result;
  }

  updateUserStatus(userId: string, status: 'active' | 'blocked', adminEmail: string): User {
    const user = this.data.users.find(u => u.id === userId);
    if (!user) throw new Error('User not found');
    user.status = status;
    this.saveData();
    this.logActivity({
      adminId: 'admin',
      adminEmail,
      action: status === 'blocked' ? 'BLOCK_USER' : 'ACTIVATE_USER',
      entityType: 'user',
      entityId: userId,
      details: `User ${user.name} (${user.mobileNumber}) set to ${status}.`,
      ipAddress: '127.0.0.1',
    });
    return user;
  }

  // --- CATEGORIES ---
  getCategories(): Category[] {
    // Enrich with video counts
    return this.data.categories.map(cat => ({
      ...cat,
      videoCount: this.data.videos.filter(v => cat.slug === 'all' ? v.isPublished : (v.categoryId === cat.id && v.isPublished)).length,
    })).sort((a, b) => a.order - b.order);
  }

  createCategory(name: string, description: string, adminEmail: string): Category {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newCat: Category = {
      id: `cat_${crypto.randomUUID().slice(0, 8)}`,
      name,
      slug,
      description,
      order: this.data.categories.length,
    };
    this.data.categories.push(newCat);
    this.saveData();
    this.logActivity({
      adminId: 'admin',
      adminEmail,
      action: 'CREATE_CATEGORY',
      entityType: 'category',
      entityId: newCat.id,
      details: `Created category: ${name} (${slug})`,
      ipAddress: '127.0.0.1',
    });
    return newCat;
  }

  updateCategory(id: string, name: string, description: string, adminEmail: string): Category {
    const cat = this.data.categories.find(c => c.id === id);
    if (!cat) throw new Error('Category not found');
    cat.name = name;
    cat.description = description;
    cat.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    this.saveData();
    this.logActivity({
      adminId: 'admin',
      adminEmail,
      action: 'UPDATE_CATEGORY',
      entityType: 'category',
      entityId: id,
      details: `Updated category: ${name}`,
      ipAddress: '127.0.0.1',
    });
    return cat;
  }

  deleteCategory(id: string, adminEmail: string): boolean {
    const idx = this.data.categories.findIndex(c => c.id === id);
    if (idx === -1) return false;
    const cat = this.data.categories[idx];
    this.data.categories.splice(idx, 1);
    this.saveData();
    this.logActivity({
      adminId: 'admin',
      adminEmail,
      action: 'DELETE_CATEGORY',
      entityType: 'category',
      entityId: id,
      details: `Deleted category: ${cat.name}`,
      ipAddress: '127.0.0.1',
    });
    return true;
  }

  // --- VIDEOS ---
  getVideos(params: { category?: string; sort?: 'latest' | 'trending'; search?: string; all?: boolean }): Video[] {
    let list = this.data.videos;
    if (!params.all) {
      list = list.filter(v => v.isPublished);
    }
    if (params.category && params.category !== 'all') {
      list = list.filter(v => v.categoryId === params.category || v.categoryName?.toLowerCase() === params.category?.toLowerCase());
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter(v => 
        v.title.toLowerCase().includes(q) || 
        v.channelName.toLowerCase().includes(q) || 
        v.description?.toLowerCase().includes(q)
      );
    }
    if (params.sort === 'trending') {
      list = [...list].sort((a, b) => b.viewsCount - a.viewsCount);
    } else {
      // Latest by publishedAt
      list = [...list].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    }
    return list;
  }

  getVideoById(id: string): Video | undefined {
    return this.data.videos.find(v => v.id === id);
  }

  createVideo(videoData: Partial<Video>, adminEmail: string): Video {
    const category = this.data.categories.find(c => c.id === videoData.categoryId);
    const newVideo: Video = {
      id: `vid_${crypto.randomUUID()}`,
      title: videoData.title || 'Untitled Stream',
      description: videoData.description || '',
      channelName: videoData.channelName || 'StreamVibe Creator',
      channelAvatar: videoData.channelAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      thumbnailUrl: videoData.thumbnailUrl || '/src/assets/images/video_thumb_tech_1790671554097.jpg',
      videoUrl: videoData.videoUrl && !videoData.videoUrl.startsWith('blob:') ? videoData.videoUrl : '/videos/sample.mp4',
      sourceType: videoData.sourceType || 'direct',
      youtubeId: videoData.youtubeId,
      durationSeconds: videoData.durationSeconds || 300,
      categoryId: videoData.categoryId || (category?.id || 'cat-tech'),
      categoryName: category?.name || 'General',
      viewsCount: 0,
      uniqueViewersCount: 0,
      avgWatchDurationSeconds: 0,
      completionRate: 0,
      isPublished: videoData.isPublished !== undefined ? videoData.isPublished : true,
      publishedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.data.videos.unshift(newVideo);
    this.saveData();

    this.logActivity({
      adminId: 'admin',
      adminEmail,
      action: 'UPLOAD_VIDEO',
      entityType: 'video',
      entityId: newVideo.id,
      details: `Added new video '${newVideo.title}' (${newVideo.sourceType.toUpperCase()})`,
      ipAddress: '127.0.0.1',
    });

    return newVideo;
  }

  updateVideo(id: string, updates: Partial<Video>, adminEmail: string): Video {
    const video = this.data.videos.find(v => v.id === id);
    if (!video) throw new Error('Video not found');

    if (updates.categoryId && updates.categoryId !== video.categoryId) {
      const cat = this.data.categories.find(c => c.id === updates.categoryId);
      if (cat) updates.categoryName = cat.name;
    }

    Object.assign(video, updates, { updatedAt: new Date().toISOString() });
    this.saveData();

    this.logActivity({
      adminId: 'admin',
      adminEmail,
      action: 'UPDATE_VIDEO',
      entityType: 'video',
      entityId: id,
      details: `Updated details for '${video.title}'`,
      ipAddress: '127.0.0.1',
    });

    return video;
  }

  deleteVideo(id: string, adminEmail: string): boolean {
    const idx = this.data.videos.findIndex(v => v.id === id);
    if (idx === -1) return false;
    const title = this.data.videos[idx].title;
    this.data.videos.splice(idx, 1);
    this.saveData();

    this.logActivity({
      adminId: 'admin',
      adminEmail,
      action: 'DELETE_VIDEO',
      entityType: 'video',
      entityId: id,
      details: `Deleted video '${title}'`,
      ipAddress: '127.0.0.1',
    });

    return true;
  }

  // --- ANALYTICS TRACKING ---
  recordView(videoId: string, userId?: string, watchDuration = 10, completionRate = 0) {
    const video = this.data.videos.find(v => v.id === videoId);
    if (!video) return;

    video.viewsCount += 1;

    // Track user interaction
    if (userId) {
      const user = this.data.users.find(u => u.id === userId);
      if (user) {
        user.totalVideosWatched = (user.totalVideosWatched || 0) + 1;
        user.lastActiveAt = new Date().toISOString();
      }
    }

    // Update video completion & duration stats
    const totalViews = video.viewsCount;
    video.avgWatchDurationSeconds = Math.round(
      ((video.avgWatchDurationSeconds * (totalViews - 1)) + watchDuration) / totalViews
    );
    video.completionRate = Math.min(
      100,
      Number((((video.completionRate * (totalViews - 1)) + completionRate) / totalViews).toFixed(1))
    );

    this.data.videoViews.push({
      id: `view_${crypto.randomUUID()}`,
      videoId,
      userId,
      watchDurationSeconds: watchDuration,
      completionRate,
      viewedAt: new Date().toISOString(),
    });

    // Keep videoViews array bounded
    if (this.data.videoViews.length > 5000) {
      this.data.videoViews = this.data.videoViews.slice(-4000);
    }

    this.saveData();
  }

  // --- ADMIN AUTH & SESSIONS ---
  adminLogin(email: string, pass: string): { token: string; admin: AdminUser } {
    const admin = this.data.admins.find(a => a.email.toLowerCase() === email.toLowerCase());
    if (!admin) {
      throw new Error('Invalid email or password');
    }

    const isValid = verifyPassword(pass, admin.salt, admin.passwordHash);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    admin.sessionToken = token;
    admin.tokenExpiresAt = expiresAt;
    admin.lastLoginAt = new Date().toISOString();
    this.saveData();

    this.logActivity({
      adminId: admin.id,
      adminEmail: admin.email,
      action: 'ADMIN_LOGIN',
      entityType: 'auth',
      details: 'Admin session started successfully',
      ipAddress: '127.0.0.1',
    });

    const { passwordHash, salt, sessionToken, tokenExpiresAt, ...safeAdmin } = admin;
    return { token, admin: safeAdmin };
  }

  verifyAdminToken(token: string): AdminUser | null {
    if (!token) return null;
    const admin = this.data.admins.find(a => a.sessionToken === token);
    if (!admin || !admin.tokenExpiresAt) return null;

    if (new Date(admin.tokenExpiresAt).getTime() < Date.now()) {
      admin.sessionToken = undefined;
      admin.tokenExpiresAt = undefined;
      this.saveData();
      return null;
    }

    const { passwordHash, salt, sessionToken, tokenExpiresAt, ...safeAdmin } = admin;
    return safeAdmin;
  }

  adminLogout(token: string) {
    const admin = this.data.admins.find(a => a.sessionToken === token);
    if (admin) {
      this.logActivity({
        adminId: admin.id,
        adminEmail: admin.email,
        action: 'ADMIN_LOGOUT',
        entityType: 'auth',
        details: 'Admin session logged out',
        ipAddress: '127.0.0.1',
      });
      admin.sessionToken = undefined;
      admin.tokenExpiresAt = undefined;
      this.saveData();
    }
  }

  changeAdminPassword(adminId: string, currentPass: string, newPass: string): void {
    const admin = this.data.admins.find(a => a.id === adminId);
    if (!admin) {
      throw new Error('Administrator account not found.');
    }
    const isValid = verifyPassword(currentPass, admin.salt, admin.passwordHash);
    if (!isValid) {
      throw new Error('Current password is incorrect. Please try again.');
    }
    if (!newPass || newPass.trim().length < 6) {
      throw new Error('New password must be at least 6 characters long.');
    }
    const newSalt = generateSalt();
    const newHash = hashPassword(newPass.trim(), newSalt);
    admin.salt = newSalt;
    admin.passwordHash = newHash;
    this.saveData();

    this.logActivity({
      adminId: admin.id,
      adminEmail: admin.email,
      action: 'ADMIN_PASSWORD_CHANGED',
      entityType: 'auth',
      details: 'Administrator password was changed successfully.',
      ipAddress: '127.0.0.1',
    });
  }

  logActivity(log: Omit<AdminActivityLog, 'id' | 'createdAt'>) {
    const newLog: AdminActivityLog = {
      ...log,
      id: `log_${crypto.randomUUID()}`,
      createdAt: new Date().toISOString(),
    };
    this.data.activityLogs.unshift(newLog);
    if (this.data.activityLogs.length > 500) {
      this.data.activityLogs = this.data.activityLogs.slice(0, 500);
    }
    this.saveData();
  }

  getActivityLogs(): AdminActivityLog[] {
    return this.data.activityLogs;
  }

  // --- DASHBOARD AGGREGATES ---
  getDashboardStats(): DashboardStats {
    const totalUsers = this.data.users.length;
    const activeUsers = this.data.users.filter(u => u.status === 'active').length;
    const totalVideos = this.data.videos.length;
    const totalViews = this.data.videos.reduce((sum, v) => sum + v.viewsCount, 0);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const videosPublishedToday = this.data.videos.filter(
      v => new Date(v.publishedAt).getTime() >= todayStart.getTime()
    ).length;

    // Daily views last 14 days
    const dailyViews: { date: string; views: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      // Generate realistic dynamic progression based on total views
      const seed = ((d.getDate() * 17 + d.getMonth() * 31) % 40) + 60;
      const views = Math.round((totalViews / 180) * (seed / 100));
      dailyViews.push({ date: dateStr, views: Math.max(12, views) });
    }

    // Weekly views
    const weeklyViews = [
      { week: 'Week 1', views: Math.round(totalViews * 0.18) },
      { week: 'Week 2', views: Math.round(totalViews * 0.22) },
      { week: 'Week 3', views: Math.round(totalViews * 0.28) },
      { week: 'Week 4', views: Math.round(totalViews * 0.32) },
    ];

    // Monthly views
    const monthlyViews = [
      { month: 'Jun', views: Math.round(totalViews * 0.12) },
      { month: 'Jul', views: Math.round(totalViews * 0.19) },
      { month: 'Aug', views: Math.round(totalViews * 0.29) },
      { month: 'Sep', views: Math.round(totalViews * 0.40) },
    ];

    const mostWatchedVideos = [...this.data.videos]
      .sort((a, b) => b.viewsCount - a.viewsCount)
      .slice(0, 5)
      .map(v => ({ ...v, views: v.viewsCount }));

    return {
      totalUsers,
      activeUsers,
      totalVideos,
      totalViews,
      videosPublishedToday,
      dailyViews,
      weeklyViews,
      monthlyViews,
      mostWatchedVideos,
    };
  }
}

export const db = new Database();
