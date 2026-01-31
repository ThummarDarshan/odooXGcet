import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { User, UserRole, AuthState } from '@/types';

import api from '@/services/api';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<User | null>;
  signup: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  createUser: (email: string, password: string, name: string, role: UserRole) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (storedUser && token) {
      try {
        const backendUser = JSON.parse(storedUser);
        // Normalize role to lowercase
        const user = {
          ...backendUser,
          role: backendUser.role.toLowerCase() as UserRole
        };
        setState({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<User | null> => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user: backendUser } = response.data.data;

      // Normalize role to lowercase for frontend
      const user = {
        ...backendUser,
        role: backendUser.role.toLowerCase() as UserRole
      };

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
      });

      return user;
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      console.error('Login failed:', error);
      return null;
    }
  }, []);

  const signup = useCallback(async (email: string, password: string, name: string): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // Use signup endpoint
      await api.post('/auth/signup', { email, password, name });
      // After signup, user might need to login or auto-login. 
      // For now, let's assume they need to login, or we auto-login.
      // Let's just return true and let UI handle redirection to login.
      setState(prev => ({ ...prev, isLoading: false }));
      return true;
    } catch (error) {
      console.error('Signup failed:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  }, []);

  const createUser = useCallback(async (
    email: string,
    password: string,
    name: string,
    role: UserRole
  ): Promise<boolean> => {
    if (state.user?.role !== 'admin') {
      return false;
    }

    try {
      await api.post('/auth/register', { email, password, name, role });
      return true;
    } catch (error) {
      console.error('Create user failed:', error);
      return false;
    }
  }, [state.user]);

  const logout = useCallback(() => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    sessionStorage.removeItem('auth_user'); // Clean up old
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        signup,
        logout,
        createUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
