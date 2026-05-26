import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, AuthContextType } from '../types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface DecodedToken {
  sub: string;
  email: string;
  exp?: number;
}

const decodeToken = (token: string): DecodedToken | null => {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding authentication token:', error);
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (savedToken) {
      const decoded = decodeToken(savedToken);
      if (decoded) {
        // Optional expiration check
        const isExpired = decoded.exp ? decoded.exp * 1000 < Date.now() : false;
        if (!isExpired) {
          setToken(savedToken);
          setUser({
            id: decoded.sub,
            email: decoded.email,
            name: decoded.email.split('@')[0],
          });
        } else {
          // Remove expired credentials
          localStorage.removeItem('token');
          localStorage.removeItem('accessToken');
        }
      } else {
        // If token is invalid or unparseable, clean it
        localStorage.removeItem('token');
        localStorage.removeItem('accessToken');
      }
    }
    setLoading(false);
  }, []);

  const login = (newToken: string) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('accessToken', newToken);
    setToken(newToken);
    const decoded = decodeToken(newToken);
    if (decoded) {
      setUser({
        id: decoded.sub,
        email: decoded.email,
        name: decoded.email.split('@')[0],
      });
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ token, isAuthenticated, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
