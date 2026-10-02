import {
  User,
  Video,
  Category,
  AppSettings,
  DashboardStats,
  AdminUser,
  AdminActivityLog,
} from '../types/index.ts';
import { localDB } from './localDB.ts';

const API_BASE = '/api';

function getAdminToken(): string | null {
  return localStorage.getItem('streamvibe_admin_token');
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  fallback?: () => T | Promise<T>
): Promise<T> {
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getAdminToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const contentType = response.headers.get('content-type') || '';

    // If 404, or non-JSON HTML (Vercel SPA rewrite returns index.html), or server error
    if (!response.ok || response.status === 404 || contentType.includes('text/html')) {
      if (fallback) {
        return await fallback();
      }
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || data.message || `Request failed with status ${response.status}`);
    }

    const data = await response.json().catch(() => null);
    if (data === null && fallback) {
      return await fallback();
    }

    return data as T;
  } catch (err: any) {
    if (fallback) {
      return await fallback();
    }
    throw err;
  }
}

export const api = {
  // Public & User App
  getSettings: () => request<AppSettings>('/settings', {}, () => localDB.getSettings()),

  getCategories: () => request<Category[]>('/categories', {}, () => localDB.getCategories()),

  getVideos: (params?: { category?: string; sort?: 'latest' | 'trending'; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.sort) query.set('sort', params.sort);
    if (params?.search) query.set('search', params.search);
    const qs = query.toString();
    return request<Video[]>(`/videos${qs ? `?${qs}` : ''}`, {}, () => localDB.getVideos(params));
  },

  getVideo: (id: string) => request<Video>(`/videos/${id}`, {}, () => localDB.getVideoById(id)),

  registerUser: (name: string, mobileNumber: string) =>
    request<{ user: User; isNew: boolean }>(
      '/users/register',
      {
        method: 'POST',
        body: JSON.stringify({ name, mobileNumber }),
      },
      () => localDB.registerUser(name, mobileNumber)
    ),

  checkMobile: (mobile: string) =>
    request<{ exists: boolean; user?: { id: string; name: string; mobileNumber: string } }>(
      `/users/check-mobile?mobile=${encodeURIComponent(mobile)}`,
      {},
      () => localDB.checkMobile(mobile)
    ),

  getUserProfile: (id: string) => request<User>(`/users/${id}`, {}, () => localDB.getUserProfile(id)),

  trackView: (videoId: string, userId?: string, watchDuration = 10, completionRate = 0) =>
    request<{ success: boolean }>(
      '/analytics/view',
      {
        method: 'POST',
        body: JSON.stringify({ videoId, userId, watchDuration, completionRate }),
      },
      () => localDB.trackView(videoId, userId, watchDuration, completionRate)
    ),

  // Admin Auth
  adminLogin: (email: string, pass: string) =>
    request<{ token: string; admin: AdminUser }>(
      '/admin/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password: pass }),
      },
      () => localDB.adminLogin(email, pass)
    ),

  adminLogout: () =>
    request<{ success: boolean }>(
      '/admin/logout',
      {
        method: 'POST',
      },
      () => localDB.adminLogout()
    ),

  getAdminMe: () => request<{ admin: AdminUser }>('/admin/me', {}, () => localDB.getAdminMe()),

  changeAdminPassword: (currentPassword: string, newPassword: string) =>
    request<{ success: boolean; message: string }>(
      '/admin/change-password',
      {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      },
      () => localDB.changeAdminPassword()
    ),

  // Admin Protected
  getAdminDashboard: () =>
    request<DashboardStats>('/admin/dashboard', {}, () => localDB.getAdminDashboard()),

  getAdminUsers: (search?: string, status?: string) => {
    const query = new URLSearchParams();
    if (search) query.set('search', search);
    if (status) query.set('status', status);
    const qs = query.toString();
    return request<User[]>(`/admin/users${qs ? `?${qs}` : ''}`, {}, () =>
      localDB.getAdminUsers(search, status)
    );
  },

  updateUserStatus: (id: string, status: 'active' | 'blocked') =>
    request<User>(
      `/admin/users/${id}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      },
      () => localDB.updateUserStatus(id, status)
    ),

  getAdminVideos: (category?: string, search?: string) => {
    const query = new URLSearchParams();
    if (category) query.set('category', category);
    if (search) query.set('search', search);
    const qs = query.toString();
    return request<Video[]>(`/admin/videos${qs ? `?${qs}` : ''}`, {}, () =>
      localDB.getAdminVideos(category, search)
    );
  },

  uploadVideoFile: async (file: File): Promise<{ videoUrl: string }> => {
    try {
      const token = getAdminToken();
      const headers = new Headers();
      if (token) headers.set('Authorization', `Bearer ${token}`);
      headers.set('x-filename', encodeURIComponent(file.name));
      headers.set('Content-Type', file.type || 'video/mp4');

      const response = await fetch('/api/admin/videos/upload-raw', {
        method: 'POST',
        headers,
        body: file,
      });
      if (response.ok) {
        return await response.json();
      }
    } catch {}

    // Fallback: local object URL
    return { videoUrl: URL.createObjectURL(file) };
  },

  uploadImageFile: async (file: File): Promise<{ imageUrl: string }> => {
    try {
      const token = getAdminToken();
      const headers = new Headers();
      if (token) headers.set('Authorization', `Bearer ${token}`);
      headers.set('x-filename', encodeURIComponent(file.name));
      headers.set('Content-Type', file.type || 'image/jpeg');

      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        headers,
        body: file,
      });
      if (response.ok) {
        return await response.json();
      }
    } catch {}

    // Fallback: local object URL
    return { imageUrl: URL.createObjectURL(file) };
  },

  uploadMedia: (filename: string, base64Data: string) =>
    request<{ videoUrl: string }>(
      '/admin/videos/upload-media',
      {
        method: 'POST',
        body: JSON.stringify({ filename, base64Data }),
      },
      () => ({ videoUrl: base64Data })
    ),

  createVideo: (videoData: any) =>
    request<Video>(
      '/admin/videos',
      {
        method: 'POST',
        body: JSON.stringify(videoData),
      },
      () => localDB.createVideo(videoData)
    ),

  updateVideo: (id: string, videoData: any) =>
    request<Video>(
      `/admin/videos/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(videoData),
      },
      () => localDB.updateVideo(id, videoData)
    ),

  deleteVideo: (id: string) =>
    request<{ success: boolean }>(
      `/admin/videos/${id}`,
      {
        method: 'DELETE',
      },
      () => localDB.deleteVideo(id)
    ),

  getVideoAnalytics: (id: string) =>
    request<{ video: Video; analytics: any }>(
      `/admin/videos/${id}/analytics`,
      {},
      () => ({
        video: localDB.getVideoById(id),
        analytics: { views: 100, completion: 75 },
      })
    ),

  getAdminCategories: () =>
    request<Category[]>('/admin/categories', {}, () => localDB.getCategories()),

  createCategory: (name: string, description: string) =>
    request<Category>(
      '/admin/categories',
      {
        method: 'POST',
        body: JSON.stringify({ name, description }),
      },
      () => ({
        id: `cat_${Date.now()}`,
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        description,
        order: 99,
      })
    ),

  updateCategory: (id: string, name: string, description: string) =>
    request<Category>(
      `/admin/categories/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify({ name, description }),
      },
      () => ({
        id,
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        description,
        order: 1,
      })
    ),

  deleteCategory: (id: string) =>
    request<{ success: boolean }>(
      `/admin/categories/${id}`,
      {
        method: 'DELETE',
      },
      () => ({ success: true })
    ),

  getAdminSettings: () =>
    request<AppSettings>('/admin/settings', {}, () => localDB.getSettings()),

  updateAdminSettings: (settings: Partial<AppSettings>) =>
    request<AppSettings>(
      '/admin/settings',
      {
        method: 'PUT',
        body: JSON.stringify(settings),
      },
      () => localDB.updateSettings(settings)
    ),

  getAdminLogs: () =>
    request<AdminActivityLog[]>('/admin/logs', {}, () => []),
};
