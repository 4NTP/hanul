'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
}

interface JWTPayload {
  iss: string;
  iat: number;
  exp: number;
  sub: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (token: string) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
  initialUser?: User | null;
}

export function AuthProvider({ children, initialUser }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser || null);
  const [loading, setLoading] = useState(!initialUser);

  const parseJWT = (token: string): JWTPayload | null => {
    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) return null;
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join(''),
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Failed to parse JWT:', error);
      return null;
    }
  };

  const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return null;
  };

  useEffect(() => {
    // Skip cookie check if we already have initial user data from server
    if (initialUser) {
      setLoading(false);
      return;
    }

    const token = getCookie('accessToken');
    console.log('AuthContext: Token found:', !!token);

    if (token) {
      const payload = parseJWT(token);
      console.log('AuthContext: Payload parsed:', !!payload);

      if (payload && payload.exp * 1000 > Date.now()) {
        const userData = {
          id: payload.sub,
          email: payload.email,
          name: payload.name,
        };
        console.log('AuthContext: Setting user:', userData);
        setUser(userData);
      } else {
        console.log('AuthContext: Token expired or invalid');
      }
    } else {
      console.log('AuthContext: No token found');
    }
    setLoading(false);
  }, [initialUser]);

  const signIn = (token: string) => {
    const payload = parseJWT(token);
    if (payload) {
      setUser({
        id: payload.sub,
        email: payload.email,
        name: payload.name,
      });
    }
  };

  const signOut = async () => {
    try {
      const { authAPI } = await import('@/lib/api/auth');
      await authAPI.signOut();
    } catch (error) {
      console.error('Sign out API call failed:', error);
    }

    document.cookie = 'accessToken=; path=/; max-age=0';
    document.cookie = 'refreshToken=; path=/; max-age=0';
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        signIn,
        signOut,
      }}
    >
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
