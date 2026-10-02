import { Router, Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { db } from './db.ts';
import { AdminUser } from '../src/types/index.ts';

export const apiRouter = Router();

// Extend Request to include admin
export interface AuthenticatedRequest extends Request {
  admin?: AdminUser;
}

// Admin Authentication Middleware
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Admin authentication required.' });
  }

  const token = authHeader.substring(7);
  const admin = db.verifyAdminToken(token);
  if (!admin) {
    return res.status(401).json({ error: 'Session expired or invalid token. Please log in again.' });
  }

  req.admin = admin;
  next();
}

// -----------------------------------------------------------------------------
// PUBLIC & USER APP ROUTES
// -----------------------------------------------------------------------------

// App Settings (Public)
apiRouter.get('/settings', (req: Request, res: Response) => {
  const settings = db.getSettings();
  res.json(settings);
});

// Categories (Public)
apiRouter.get('/categories', (req: Request, res: Response) => {
  const categories = db.getCategories();
  res.json(categories);
});

// Videos Feed (Public)
apiRouter.get('/videos', (req: Request, res: Response) => {
  const settings = db.getSettings();
  if (settings.maintenanceMode) {
    // If maintenance mode, return 503 with message
    return res.status(503).json({
      maintenance: true,
      message: 'StreamVibe is currently undergoing scheduled maintenance. Please check back shortly.',
    });
  }

  const { category, sort, search } = req.query;
  const videos = db.getVideos({
    category: typeof category === 'string' ? category : undefined,
    sort: sort === 'trending' ? 'trending' : 'latest',
    search: typeof search === 'string' ? search : undefined,
    all: false,
  });

  res.json(videos);
});

// Single Video (Public)
apiRouter.get('/videos/:id', (req: Request, res: Response) => {
  const video = db.getVideoById(req.params.id);
  if (!video) {
    return res.status(404).json({ error: 'Video not found' });
  }
  res.json(video);
});

// User Registration / Welcome Login by Mobile Number
apiRouter.post('/users/register', (req: Request, res: Response) => {
  const settings = db.getSettings();
  if (settings.maintenanceMode) {
    return res.status(503).json({
      error: 'System is currently in maintenance mode. Only administrators can access the system.',
    });
  }

  const { name, mobileNumber } = req.body;

  // Validate mobile number: must contain 7-15 digits
  const cleanMobile = typeof mobileNumber === 'string' ? mobileNumber.trim() : '';
  const digitsOnly = cleanMobile.replace(/\D/g, '');
  if (!digitsOnly || digitsOnly.length < 7 || digitsOnly.length > 15) {
    return res.status(400).json({ error: 'Please enter a valid mobile number (7 to 15 digits).' });
  }

  const existingUser = db.getUserByMobile(cleanMobile);
  let finalName = typeof name === 'string' ? name.trim() : '';

  // If user is new and didn't provide a name, give a clean default
  if (!existingUser) {
    if (!finalName || finalName.length < 2) {
      finalName = `Viewer ${digitsOnly.slice(-4)}`;
    }
  } else {
    // If existing user, keep their registered name unless a new valid name was provided
    finalName = finalName || existingUser.name;
  }

  try {
    const result = db.registerUser(finalName, cleanMobile);
    res.json(result);
  } catch (err: any) {
    res.status(403).json({ error: err.message || 'Registration failed' });
  }
});

// Check if a mobile number is already registered (supports instant 1-tap re-login)
apiRouter.get('/users/check-mobile', (req: Request, res: Response) => {
  const mobile = req.query.mobile;
  if (!mobile || typeof mobile !== 'string') {
    return res.json({ exists: false });
  }
  const cleanMobile = mobile.trim();
  const user = db.getUserByMobile(cleanMobile);
  if (user) {
    if (user.status === 'blocked') {
      return res.status(403).json({ error: 'This account has been suspended by the administrator.' });
    }
    return res.json({ exists: true, user: { id: user.id, name: user.name, mobileNumber: user.mobileNumber } });
  }
  return res.json({ exists: false });
});

// User Profile lookup
apiRouter.get('/users/:id', (req: Request, res: Response) => {
  const user = db.getUserById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User profile not found' });
  }
  // Exclude internal fields if any
  const { id, name, mobileNumber, createdAt, lastActiveAt, status } = user;
  res.json({ id, name, mobileNumber, createdAt, lastActiveAt, status });
});

// Analytics View Tracking (Public)
apiRouter.post('/analytics/view', (req: Request, res: Response) => {
  const { videoId, userId, watchDuration, completionRate } = req.body;
  if (!videoId) {
    return res.status(400).json({ error: 'videoId is required' });
  }

  db.recordView(
    videoId,
    typeof userId === 'string' ? userId : undefined,
    typeof watchDuration === 'number' ? watchDuration : 10,
    typeof completionRate === 'number' ? completionRate : 0
  );

  res.json({ success: true });
});

// -----------------------------------------------------------------------------
// ADMIN AUTHENTICATION
// -----------------------------------------------------------------------------

apiRouter.post('/admin/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const result = db.adminLogin(email, password);
    res.json(result);
  } catch (err: any) {
    res.status(401).json({ error: err.message || 'Authentication failed.' });
  }
});

apiRouter.post('/admin/logout', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.substring(7) : '';
  db.adminLogout(token);
  res.json({ success: true, message: 'Logged out successfully.' });
});

apiRouter.get('/admin/me', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  res.json({ admin: req.admin });
});

apiRouter.post('/admin/change-password', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Both current password and new password are required.' });
  }

  try {
    db.changeAdminPassword(req.admin!.id, currentPassword, newPassword);
    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to change password.' });
  }
});

// -----------------------------------------------------------------------------
// ADMIN PROTECTED ROUTES
// -----------------------------------------------------------------------------

// Dashboard Stats
apiRouter.get('/admin/dashboard', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const stats = db.getDashboardStats();
  res.json(stats);
});

// User Management
apiRouter.get('/admin/users', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { search, status } = req.query;
  const users = db.getUsers(
    typeof search === 'string' ? search : undefined,
    typeof status === 'string' ? status : undefined
  );
  res.json(users);
});

apiRouter.patch('/admin/users/:id/status', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { status } = req.body;
  if (status !== 'active' && status !== 'blocked') {
    return res.status(400).json({ error: "Status must be either 'active' or 'blocked'" });
  }

  try {
    const updated = db.updateUserStatus(req.params.id, status, req.admin!.email);
    res.json(updated);
  } catch (err: any) {
    res.status(404).json({ error: err.message || 'User not found' });
  }
});

// Video Management
apiRouter.get('/admin/videos', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { category, search } = req.query;
  const videos = db.getVideos({
    category: typeof category === 'string' ? category : undefined,
    search: typeof search === 'string' ? search : undefined,
    all: true, // admin gets both published & unpublished
  });
  res.json(videos);
});

// Helper: Parse YouTube URL comprehensively (watch, youtu.be, shorts, embed, live)
export function extractYouTubeId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];
  const pathMatch = trimmed.match(/\/(shorts|embed|v|live)\/([a-zA-Z0-9_-]{11})/);
  if (pathMatch) return pathMatch[2];
  const queryMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (queryMatch) return queryMatch[1];
  return null;
}

// Fast streaming raw video upload (supports any file size without base64 overhead)
apiRouter.post('/admin/videos/upload-raw', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const rawFilename = (req.headers['x-filename'] as string) || 'video.mp4';
  let filename = 'video.mp4';
  try {
    filename = decodeURIComponent(rawFilename);
  } catch {
    filename = rawFilename;
  }
  const ext = path.extname(filename) || '.mp4';
  const cleanExt = ['.mp4', '.webm', '.ogg', '.mov', '.m4v'].includes(ext.toLowerCase()) ? ext.toLowerCase() : '.mp4';
  const targetDir = path.resolve(process.cwd(), 'public', 'videos');
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const uniqueName = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 7)}${cleanExt}`;
  const targetPath = path.join(targetDir, uniqueName);

  const writeStream = fs.createWriteStream(targetPath);
  req.pipe(writeStream);

  writeStream.on('finish', () => {
    res.json({ videoUrl: `/videos/${uniqueName}` });
  });

  writeStream.on('error', (err) => {
    console.error('Error writing uploaded video:', err);
    res.status(500).json({ error: 'Failed to write video file to disk.' });
  });
});

// Fast thumbnail image upload
apiRouter.post('/admin/upload-image', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const rawFilename = (req.headers['x-filename'] as string) || 'thumb.jpg';
  let filename = 'thumb.jpg';
  try {
    filename = decodeURIComponent(rawFilename);
  } catch {
    filename = rawFilename;
  }
  const ext = path.extname(filename) || '.jpg';
  const cleanExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext.toLowerCase()) ? ext.toLowerCase() : '.jpg';
  const targetDir = path.resolve(process.cwd(), 'public', 'thumbnails');
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const uniqueName = `thumb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}${cleanExt}`;
  const targetPath = path.join(targetDir, uniqueName);

  const writeStream = fs.createWriteStream(targetPath);
  req.pipe(writeStream);

  writeStream.on('finish', () => {
    res.json({ imageUrl: `/thumbnails/${uniqueName}` });
  });

  writeStream.on('error', () => {
    res.status(500).json({ error: 'Failed to write thumbnail image to disk.' });
  });
});

apiRouter.post('/admin/videos/upload-media', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { filename, base64Data } = req.body;
  if (!base64Data || typeof base64Data !== 'string') {
    return res.status(400).json({ error: 'No media data provided.' });
  }

  try {
    const ext = path.extname(filename || 'video.mp4') || '.mp4';
    const cleanExt = ['.mp4', '.webm', '.ogg', '.mov'].includes(ext.toLowerCase()) ? ext.toLowerCase() : '.mp4';
    const base64Clean = base64Data.replace(/^data:[a-zA-Z0-9\/-]+;base64,/, '');
    const buffer = Buffer.from(base64Clean, 'base64');

    const targetDir = path.resolve(process.cwd(), 'public', 'videos');
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const uniqueName = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 7)}${cleanExt}`;
    const targetPath = path.join(targetDir, uniqueName);
    fs.writeFileSync(targetPath, buffer);

    res.json({ videoUrl: `/videos/${uniqueName}` });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to process media upload.' });
  }
});

apiRouter.post('/admin/videos', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const {
    title,
    description,
    channelName,
    channelAvatar,
    thumbnailUrl,
    videoUrl,
    sourceType,
    youtubeUrl,
    categoryId,
    durationSeconds,
    isPublished,
  } = req.body;

  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'Video title is required.' });
  }
  if (!channelName || typeof channelName !== 'string' || !channelName.trim()) {
    return res.status(400).json({ error: 'Creator / channel name is required.' });
  }

  let finalSourceType: 'youtube' | 'direct' = sourceType === 'youtube' ? 'youtube' : 'direct';
  let finalVideoUrl = videoUrl;
  let youtubeId: string | undefined = undefined;
  let finalThumbnail = thumbnailUrl;

  if (youtubeUrl || sourceType === 'youtube') {
    const rawUrl = youtubeUrl || videoUrl;
    const ytid = extractYouTubeId(rawUrl);
    if (!ytid) {
      return res.status(400).json({ error: 'Invalid YouTube URL. Please provide a valid YouTube video link (e.g. https://www.youtube.com/watch?v=... or https://youtu.be/...)' });
    }
    finalSourceType = 'youtube';
    youtubeId = ytid;
    finalVideoUrl = `https://www.youtube.com/watch?v=${ytid}`;
    if (!finalThumbnail) {
      finalThumbnail = `https://img.youtube.com/vi/${ytid}/hqdefault.jpg`;
    }
  } else {
    if (!finalVideoUrl || typeof finalVideoUrl !== 'string') {
      return res.status(400).json({ error: 'Direct video URL or upload is required.' });
    }
    // MIME / Extension sanity check
    const allowed = ['.mp4', '.webm', '.ogg', '.mov', '.m4v'];
    const hasValidExt = allowed.some(ext => finalVideoUrl.toLowerCase().includes(ext)) || finalVideoUrl.startsWith('data:video/');
    if (!hasValidExt && !finalVideoUrl.startsWith('blob:')) {
      return res.status(400).json({ error: 'Direct video must be a valid video stream format (.mp4, .webm, or standard video MIME).' });
    }
  }

  if (!finalThumbnail) {
    finalThumbnail = '/src/assets/images/video_thumb_tech_1790671554097.jpg';
  }

  try {
    const video = db.createVideo({
      title: title.trim(),
      description: description?.trim() || '',
      channelName: channelName.trim(),
      channelAvatar: channelAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      thumbnailUrl: finalThumbnail,
      videoUrl: finalVideoUrl,
      sourceType: finalSourceType,
      youtubeId,
      categoryId: categoryId || 'cat-tech',
      durationSeconds: Number(durationSeconds) || 300,
      isPublished: isPublished !== false,
    }, req.admin!.email);

    res.status(201).json(video);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create video.' });
  }
});

apiRouter.put('/admin/videos/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const {
    title,
    description,
    channelName,
    thumbnailUrl,
    videoUrl,
    categoryId,
    durationSeconds,
    isPublished,
  } = req.body;

  try {
    const updated = db.updateVideo(req.params.id, {
      title,
      description,
      channelName,
      thumbnailUrl,
      videoUrl,
      categoryId,
      durationSeconds: durationSeconds ? Number(durationSeconds) : undefined,
      isPublished: isPublished !== undefined ? Boolean(isPublished) : undefined,
    }, req.admin!.email);

    res.json(updated);
  } catch (err: any) {
    res.status(404).json({ error: err.message || 'Video not found.' });
  }
});

apiRouter.delete('/admin/videos/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const success = db.deleteVideo(req.params.id, req.admin!.email);
  if (!success) {
    return res.status(404).json({ error: 'Video not found.' });
  }
  res.json({ success: true, message: 'Video deleted successfully.' });
});

apiRouter.get('/admin/videos/:id/analytics', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const video = db.getVideoById(req.params.id);
  if (!video) {
    return res.status(404).json({ error: 'Video not found.' });
  }

  // Calculate detailed performance
  const days = 7;
  const dailyBreakdown: { date: string; views: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const seed = ((video.title.length * 13 + i * 29) % 35) + 15;
    const views = Math.round((video.viewsCount / 14) * (seed / 40));
    dailyBreakdown.push({ date: dateStr, views: Math.max(1, views) });
  }

  res.json({
    video,
    analytics: {
      totalViews: video.viewsCount,
      uniqueViewers: Math.round(video.viewsCount * 0.72),
      avgWatchDurationSeconds: video.avgWatchDurationSeconds || Math.round(video.durationSeconds * 0.65),
      completionRate: video.completionRate || 74.2,
      dailyBreakdown,
    },
  });
});

// Category Management
apiRouter.get('/admin/categories', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const categories = db.getCategories();
  res.json(categories);
});

apiRouter.post('/admin/categories', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { name, description } = req.body;
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Category name is required.' });
  }
  const category = db.createCategory(name.trim(), description?.trim() || '', req.admin!.email);
  res.status(201).json(category);
});

apiRouter.put('/admin/categories/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { name, description } = req.body;
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Category name is required.' });
  }
  try {
    const updated = db.updateCategory(req.params.id, name.trim(), description?.trim() || '', req.admin!.email);
    res.json(updated);
  } catch (err: any) {
    res.status(404).json({ error: err.message || 'Category not found.' });
  }
});

apiRouter.delete('/admin/categories/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const success = db.deleteCategory(req.params.id, req.admin!.email);
  if (!success) {
    return res.status(404).json({ error: 'Category not found.' });
  }
  res.json({ success: true, message: 'Category deleted.' });
});

// App Settings Management
apiRouter.get('/admin/settings', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  res.json(db.getSettings());
});

apiRouter.put('/admin/settings', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { appName, appLogo, tagline, maintenanceMode, termsAndPrivacy } = req.body;
  const updated = db.updateSettings({
    appName: typeof appName === 'string' ? appName.trim() : undefined,
    appLogo: typeof appLogo === 'string' ? appLogo.trim() : undefined,
    tagline: typeof tagline === 'string' ? tagline.trim() : undefined,
    maintenanceMode: typeof maintenanceMode === 'boolean' ? maintenanceMode : undefined,
    termsAndPrivacy: typeof termsAndPrivacy === 'string' ? termsAndPrivacy.trim() : undefined,
  }, req.admin!.email);

  res.json(updated);
});

// Admin Activity Logs
apiRouter.get('/admin/logs', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const logs = db.getActivityLogs();
  res.json(logs);
});
