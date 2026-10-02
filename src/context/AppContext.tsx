import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppSettings, Category } from '../types/index.ts';
import { api } from '../services/api.ts';

interface AppContextType {
  settings: AppSettings | null;
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  refreshSettings: () => Promise<void>;
  refreshCategories: () => Promise<void>;
}

const defaultSettings: AppSettings = {
  appName: 'StreamVibe',
  appLogo: '/src/assets/images/app_brand_logo_1790671540965.jpg',
  tagline: 'Watch & Enjoy',
  maintenanceMode: false,
  termsAndPrivacy: 'StreamVibe values your privacy. No personal telemetry or unnecessary tracking is used.',
};

const AppContext = createContext<AppContextType>({
  settings: defaultSettings,
  categories: [],
  isLoading: true,
  error: null,
  refreshSettings: async () => {},
  refreshCategories: async () => {},
});

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings | null>(defaultSettings);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshSettings = async () => {
    try {
      const data = await api.getSettings();
      setSettings(data);
    } catch (err: any) {
      console.warn('Could not load settings:', err);
    }
  };

  const refreshCategories = async () => {
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch (err: any) {
      console.warn('Could not load categories:', err);
    }
  };

  useEffect(() => {
    async function init() {
      setIsLoading(true);
      try {
        await Promise.allSettled([refreshSettings(), refreshCategories()]);
      } catch (err: any) {
        setError(err.message || 'Initialization failed');
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  return (
    <AppContext.Provider
      value={{
        settings,
        categories,
        isLoading,
        error,
        refreshSettings,
        refreshCategories,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
