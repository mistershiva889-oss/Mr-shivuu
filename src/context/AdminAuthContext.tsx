import React, { createContext, useContext, useState, useEffect } from 'react';
import { AdminUser } from '../types/index.ts';
import { api } from '../services/api.ts';

interface AdminAuthContextType {
  admin: AdminUser | null;
  isAdminLoggedIn: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const ADMIN_TOKEN_KEY = 'streamvibe_admin_token';
const ADMIN_USER_KEY = 'streamvibe_admin_user';

const AdminAuthContext = createContext<AdminAuthContextType>({
  admin: null,
  isAdminLoggedIn: false,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
});

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) {
      setIsLoading(false);
      return;
    }

    const storedUser = localStorage.getItem(ADMIN_USER_KEY);
    if (storedUser) {
      try {
        setAdmin(JSON.parse(storedUser));
      } catch (e) {
        // ignore
      }
    }

    // Verify token with backend
    api.getAdminMe()
      .then(res => {
        setAdmin(res.admin);
        localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(res.admin));
      })
      .catch(() => {
        // Token invalid or expired
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        localStorage.removeItem(ADMIN_USER_KEY);
        setAdmin(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await api.adminLogin(email, pass);
    localStorage.setItem(ADMIN_TOKEN_KEY, res.token);
    localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(res.admin));
    setAdmin(res.admin);
  };

  const logout = async () => {
    try {
      await api.adminLogout();
    } catch (e) {
      // ignore logout errors
    } finally {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      localStorage.removeItem(ADMIN_USER_KEY);
      setAdmin(null);
    }
  };

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        isAdminLoggedIn: !!admin,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => useContext(AdminAuthContext);
