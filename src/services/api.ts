import {
  User,
  Video,
  Category,
  AppSettings,
  DashboardStats,
  AdminUser,
  AdminActivityLog,
} from '../types/index.ts';

const API_BASE = '/api';

function getAdminToken(): string | null {
  return localStorage.getItem('streamvibe_admin_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getAdminToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || data.message || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Public & User App
  getSettings: () => request<AppSettings>('/settings'),
  getCategories: () => request<Category[]>('/categories'),
  getVideos: (params?: { category?: string; sort?: 'latest' | 'trending'; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.sort) query.set('sort', params.sort);
    if (params?.search) query.set('search', params.search);
    const qs = query.toString();
    return request<Video[]>(`/videos${qs ? `?${qs}` : ''}`);
  },
  getVideo: (id: string) => request<Video>(`/videos/${id}`),
  registerUser: (name: string, mobileNumber: string) =>
    request<{ user: User; isNew: boolean }>('/users/register', {
      method: 'POST',
      body: JSON.stringify({ name, mobileNumber }),
    }),
  checkMobile: (mobile: string) =>
    request<{ exists: boolean; user?: { id: string; name: string; mobileNumber: string } }>(
      `/users/check-mobile?mobile=${encodeURIComponent(mobile)}`
    ),
  getUserProfile: (id: string) => request<User>(`/users/${id}`),
  trackView: (videoId: string, userId?: string, watchDuration = 10, completionRate = 0) =>
    request<{ success: boolean }>('/analytics/view', {
      method: 'POST',
      body: JSON.stringify({ videoId, userId, watchDuration, completionRate }),
    }),

  // Admin Auth
  adminLogin: (email: string, pass: string) =>
    request<{ token: string; admin: AdminUser }>('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: pass }),
    }),
  adminLogout: () =>
    request<{ success: boolean }>('/admin/logout', {
      method: 'POST',
    }),
  getAdminMe: () => request<{ admin: AdminUser }>('/admin/me'),
  changeAdminPassword: (currentPassword: string, newPassword: string) =>
    request<{ success: boolean; message: string }>('/admin/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  // Admin Protected
  getAdminDashboard: () => request<DashboardStats>('/admin/dashboard'),
  getAdminUsers: (search?: string, status?: string) => {
    const query = new URLSearchParams();
    if (search) query.set('search', search);
    if (status) query.set('status', status);
    const qs = query.toString();
    return request<User[]>(`/admin/users${qs ? `?${qs}` : ''}`);
  },
  updateUserStatus: (id: string, status: 'active' | 'blocked') =>
    request<User>(`/admin/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  getAdminVideos: (category?: string, search?: string) => {
    const query = new URLSearchParams();
    if (category) query.set('category', category);
    if (search) query.set('search', search);
    const qs = query.toString();
    return request<Video[]>(`/admin/videos${qs ? `?${qs}` : ''}`);
  },
  uploadVideoFile: async (file: File): Promise<{ videoUrl: string }> => {
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
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || 'Failed to upload video file.');
    }
    return data;
  },
  uploadImageFile: async (file: File): Promise<{ imageUrl: string }> => {
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
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || 'Failed to upload image file.');
    }
    return data;
  },
  uploadMedia: (filename: string, base64Data: string) =>
    request<{ videoUrl: string }>('/admin/videos/upload-media', {
      method: 'POST',
      body: JSON.stringify({ filename, base64Data }),
    }),
  createVideo: (videoData: any) =>
    request<Video>('/admin/videos', {
      method: 'POST',
      body: JSON.stringify(videoData),
    }),
  updateVideo: (id: string, videoData: any) =>
    request<Video>(`/admin/videos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(videoData),
    }),
  deleteVideo: (id: string) =>
    request<{ success: boolean }>(`/admin/videos/${id}`, {
      method: 'DELETE',
    }),
  getVideoAnalytics: (id: string) =>
    request<{ video: Video; analytics: any }>(`/admin/videos/${id}/analytics`),
  getAdminCategories: () => request<Category[]>('/admin/categories'),
  createCategory: (name: string, description: string) =>
    request<Category>('/admin/categories', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    }),
  updateCategory: (id: string, name: string, description: string) =>
    request<Category>(`/admin/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, description }),
    }),
  deleteCategory: (id: string) =>
    request<{ success: boolean }>(`/admin/categories/${id}`, {
      method: 'DELETE',
    }),
  getAdminSettings: () => request<AppSettings>('/admin/settings'),
  updateAdminSettings: (settings: Partial<AppSettings>) =>
    request<AppSettings>('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),
  getAdminLogs: () => request<AdminActivityLog[]>('/admin/logs'),
};
