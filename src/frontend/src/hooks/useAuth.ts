import { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';

export interface User {
  id: string;
  agencyId: string;
  email: string;
  fullName: string;
  role: 'owner' | 'agent';
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('inmofollow_token');
    const storedUser = localStorage.getItem('inmofollow_user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
    setLoading(false);

    const interval = setInterval(async () => {
      const currentToken = localStorage.getItem('inmofollow_token');
      if (currentToken) {
        const res = await apiFetch('/auth/me', { token: currentToken });
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        } else {
          localStorage.removeItem('inmofollow_token');
          localStorage.removeItem('inmofollow_user');
          setToken(null);
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('inmofollow_token', data.token);
      localStorage.setItem('inmofollow_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      setIsAuthenticated(true);
      return data;
    }
    throw new Error(data.error || 'Error de autenticación');
  };

  const logout = () => {
    localStorage.removeItem('inmofollow_token');
    localStorage.removeItem('inmofollow_user');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  return { user, token, isAuthenticated, loading, login, logout };
}
