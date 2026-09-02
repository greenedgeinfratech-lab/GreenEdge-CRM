'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import api from '@/lib/api';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  company: {
    id: string;
    name: string;
    state?: string;
  };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: any) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const DEFAULT_USER: User = {
    id: 'demo-user-id',
    email: 'admin@greenedge.local',
    first_name: 'GreenEdge',
    last_name: 'Admin',
    company: {
      id: 'demo-company-id',
      name: 'GreenEdge CRM',
    },
  };

  const [user, setUser] = useState<User | null>(DEFAULT_USER);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const fetchUser = async () => {
    try {
      const response = await api.get('/auth/me/');
      if (response.data?.data) {
        setUser(response.data.data);
      }
    } catch (error) {
      // Auto-login to bypass auth page temporarily
      try {
        await api.post('/auth/login/', { email: 'qa@greenedge.local', password: 'qa_password' });
        const response = await api.get('/auth/me/');
        if (response.data?.data) {
          setUser(response.data.data);
        }
      } catch (autoLoginError) {
        // Keep DEFAULT_USER so pages stay accessible
        setUser(DEFAULT_USER);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();

    // If currently on /login, redirect directly to /crm
    if (pathname === '/login') {
      router.push('/crm');
    }

    const handleUnauthorized = () => {
      // Do not redirect to /login to allow browsing without auth page
      setUser(DEFAULT_USER);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [pathname, router]);

  const login = async (credentials: any) => {
    await api.post('/auth/login/', credentials);
    await fetchUser();
    router.push('/dashboard');
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout/');
    } catch (error) {
      console.error('Logout error', error);
    } finally {
      setUser(null);
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
