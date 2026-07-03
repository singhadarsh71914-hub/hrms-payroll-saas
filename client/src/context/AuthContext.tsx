import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { getCurrentUser, logout as authLogout } from '../services/auth.service';
import { getToken, setUserLocal, clearAuth } from '../utils/auth';
import api from '../services/api';
import * as Sentry from '@sentry/react';

interface AuthContextType {
  user: any;
  setUser: (user: any) => void;
  logout: () => void;
  isLoading: boolean;
  isInitialized: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const authRequest = useRef<Promise<any> | null>(null);

  useEffect(() => {
    let mounted = true;
    
    const initAuth = async () => {
      const storedUser = getCurrentUser();
      const token = getToken();

      if (!token) {
        if (mounted) {
          setUser(null);
          setIsLoading(false);
          setIsInitialized(true);
        }
        return;
      }

      try {
        if (!authRequest.current) {
          authRequest.current = api.get('/auth/me');
        }
        const res = await authRequest.current;
        if (mounted) {
          setUser(res.data.user);
          setUserLocal(res.data.user);
        }
      } catch (error) {
        if (mounted) {
          setUser(null);
          clearAuth();
        }
      } finally {
        if (mounted) {
          authRequest.current = null;
          setIsLoading(false);
          setIsInitialized(true);
        }
      }
    };
    initAuth();

    const handleLogoutEvent = () => {
      if (mounted) {
        setUser(null);
      }
    };

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'accessToken' && !e.newValue) {
        handleLogoutEvent();
      }
    };

    window.addEventListener('auth-logout', handleLogoutEvent);
    window.addEventListener('storage', handleStorageEvent);

    return () => { 
      mounted = false; 
      window.removeEventListener('auth-logout', handleLogoutEvent);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, []);

  useEffect(() => {
    if (user) {
      Sentry.setUser({
        id: user.id,
        email: user.email,
        role: user.role,
        companyId: user.company_id
      });
    } else {
      Sentry.setUser(null);
    }
  }, [user]);

  const logout = () => {
    authLogout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout, isLoading, isInitialized }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
