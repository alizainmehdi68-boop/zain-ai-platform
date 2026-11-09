import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, UserProfile, UserSubscription } from '../types/index.js';

interface UsageStats {
  todayGenerations: number;
  dailyLimit: number;
  remainingToday: number;
  maxWordsPerGen: number;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  subscription: UserSubscription | null;
  usage: UsageStats | null;
  token: string | null;
  isLoading: boolean;
  authModalOpen: boolean;
  authModalMode: 'login' | 'register' | 'forgot';
  openAuthModal: (mode?: 'login' | 'register' | 'forgot') => void;
  closeAuthModal: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: (email?: string, name?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  verifyEmail: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('zainai_token'));
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'forgot'>('login');

  const openAuthModal = (mode: 'login' | 'register' | 'forgot' = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  const refreshUser = useCallback(async () => {
    if (!token) {
      setUser(null);
      setProfile(null);
      setSubscription(null);
      setUsage(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setProfile(data.profile);
        setSubscription(data.subscription);
        setUsage(data.usage);
      } else {
        // Token expired or invalid
        localStorage.removeItem('zainai_token');
        setToken(null);
        setUser(null);
      }
    } catch (err) {
      console.error('Error fetching current user:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to log in');
    }

    localStorage.setItem('zainai_token', data.token);
    setToken(data.token);
    setUser(data.user);
    closeAuthModal();
    await refreshUser();
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    localStorage.setItem('zainai_token', data.token);
    setToken(data.token);
    setUser(data.user);
    closeAuthModal();
    await refreshUser();
  };

  const loginWithGoogle = async (customEmail?: string, customName?: string) => {
    const email = customEmail || 'alizainmehdi68@gmail.com';
    const name = customName || 'Ali Zain';
    const avatarUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80';

    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, avatarUrl }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Google Sign-in failed');
    }

    localStorage.setItem('zainai_token', data.token);
    setToken(data.token);
    setUser(data.user);
    closeAuthModal();
    await refreshUser();
  };

  const logout = () => {
    localStorage.removeItem('zainai_token');
    setToken(null);
    setUser(null);
    setProfile(null);
    setSubscription(null);
    setUsage(null);
  };

  const verifyEmail = async () => {
    if (!token) return;
    const res = await fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (res.ok) {
      await refreshUser();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        subscription,
        usage,
        token,
        isLoading,
        authModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        login,
        register,
        loginWithGoogle,
        logout,
        refreshUser,
        verifyEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
