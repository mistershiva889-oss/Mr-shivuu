import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/index.ts';
import { api } from '../services/api.ts';

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (name: string, mobileNumber: string) => Promise<User>;
  logout: () => void;
}

const STORAGE_KEY = 'streamvibe_active_user';

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoggedIn: false,
  isLoading: true,
  login: async () => ({} as User),
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.id) {
          setUser(parsed);
          // Async sync with backend
          api.getUserProfile(parsed.id)
            .then(freshUser => {
              if (freshUser && freshUser.status === 'blocked') {
                localStorage.removeItem(STORAGE_KEY);
                setUser(null);
              } else if (freshUser) {
                setUser(freshUser);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(freshUser));
              }
            })
            .catch(() => {
              // Offline or fetch failure, retain stored session
            });
        }
      }
    } catch (e) {
      console.error('Failed to restore user session:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (name: string, mobileNumber: string): Promise<User> => {
    const { user: registeredUser } = await api.registerUser(name, mobileNumber);
    setUser(registeredUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(registeredUser));
    return registeredUser;
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
