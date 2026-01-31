import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { User, UserRole, AuthState } from '@/types';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<User | null>;
  signup: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  createUser: (email: string, password: string, name: string, role: UserRole) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Mock users for demo - In production, this would be replaced with API calls
const MOCK_USERS: (User & { passwordHash: string })[] = [
  {
    id: '1',
    email: 'admin@shivfurniture.com',
    name: 'Admin User',
    role: 'admin',
    createdAt: '2024-01-01',
    passwordHash: 'hashed_admin123', // In real app, never store passwords client-side
  },
  {
    id: '2',
    email: 'customer@example.com',
    name: 'John Customer',
    role: 'customer',
    createdAt: '2024-01-15',
    passwordHash: 'hashed_customer123',
  },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = sessionStorage.getItem('auth_user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setState({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch {
        sessionStorage.removeItem('auth_user');
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<User | null> => {
    // SECURITY: In production, send credentials to backend for validation
    // Backend handles password hashing/verification
    // Never log or store passwords in frontend

    setState(prev => ({ ...prev, isLoading: true }));

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock validation - In production, this is handled by backend
    const mockUser = MOCK_USERS.find(u => u.email === email);

    if (mockUser) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, ...userWithoutPassword } = mockUser;

      sessionStorage.setItem('auth_user', JSON.stringify(userWithoutPassword));

      setState({
        user: userWithoutPassword,
        isAuthenticated: true,
        isLoading: false,
      });

      return userWithoutPassword;
    }

    setState(prev => ({ ...prev, isLoading: false }));
    return null;
  }, []);

  const signup = useCallback(async (email: string, password: string, name: string): Promise<boolean> => {
    // SECURITY: In production, send to backend for:
    // 1. Email validation
    // 2. Password hashing (bcrypt)
    // 3. User creation
    // Never store password in frontend state after submit

    setState(prev => ({ ...prev, isLoading: true }));

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check if user already exists
    const existingUser = MOCK_USERS.find(u => u.email === email);
    if (existingUser) {
      setState(prev => ({ ...prev, isLoading: false }));
      return false;
    }

    // Create new user (mock)
    const newUser: User = {
      id: crypto.randomUUID(),
      email,
      name,
      role: 'customer', // Default role for signup
      createdAt: new Date().toISOString(),
    };

    sessionStorage.setItem('auth_user', JSON.stringify(newUser));

    setState({
      user: newUser,
      isAuthenticated: true,
      isLoading: false,
    });

    return true;
  }, []);

  const createUser = useCallback(async (
    email: string,
    password: string,
    name: string,
    role: UserRole
  ): Promise<boolean> => {
    // SECURITY: Admin-only function
    // In production, backend validates admin privileges before creating user

    if (state.user?.role !== 'admin') {
      return false;
    }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    // In production, this would be a backend API call
    // Password is sent securely and hashed server-side

    return true;
  }, [state.user]);

  const logout = useCallback(() => {
    sessionStorage.removeItem('auth_user');
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
