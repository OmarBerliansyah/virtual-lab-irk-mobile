/**
 * AuthContext - Unified Authentication Context
 * 
 * This context supports multiple authentication modes:
 * 1. Mock Auth (Default for development) - Uses mockAuth for local testing
 * 2. Clerk Auth - Uses Clerk for production authentication with Hono backend
 * 3. Supabase Auth - Uses Supabase for authentication (legacy support)
 * 
 * Set EXPO_PUBLIC_AUTH_MODE in .env to switch between modes:
 * - 'mock' (default): Uses mock authentication
 * - 'clerk': Uses Clerk + Hono backend
 * - 'supabase': Uses Supabase authentication
 */

import { mockAuth, mockUsers } from '@/lib/mockAuth';
import type { User } from '@/types/api';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import Toast from 'react-native-toast-message';

// Determine auth mode from environment
const AUTH_MODE = process.env.EXPO_PUBLIC_AUTH_MODE || 'mock';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state based on mode
  useEffect(() => {
    const initAuth = async () => {
      if (AUTH_MODE === 'mock') {
        // Mock auth - get current mock user
        const currentUser = mockAuth.getCurrentUser();
        setUser(currentUser);
        setIsLoading(false);
        return;
      }

      // For clerk or supabase mode, we'll handle initialization separately
      // In production, you would integrate with Clerk here
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      if (AUTH_MODE === 'mock') {
        // Mock auth login
        const result = await mockAuth.login(email, password);
        if (result.success && result.user) {
          setUser(result.user);
          Toast.show({
            type: 'success',
            text1: 'Login Successful',
            text2: `Welcome, ${result.user.email}!`,
          });
        } else {
          Toast.show({
            type: 'error',
            text1: 'Login Failed',
            text2: result.error || 'Invalid credentials',
          });
          throw new Error(result.error || 'Login failed');
        }
        return;
      }

      // For clerk mode, login is handled by Clerk components
      // This is just a fallback
      Toast.show({
        type: 'info',
        text1: 'Use Sign In',
        text2: 'Please use the sign-in button',
      });
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      if (AUTH_MODE === 'mock') {
        // Mock doesn't support sign up
        Toast.show({
          type: 'info',
          text1: 'Demo Mode',
          text2: 'Use one of the demo accounts to login',
        });
        return;
      }

      // For clerk mode, sign up is handled by Clerk components
      Toast.show({
        type: 'info',
        text1: 'Use Sign Up',
        text2: 'Please use the sign-up button',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      if (AUTH_MODE === 'mock') {
        await mockAuth.logout();
      }
      setUser(null);
      Toast.show({
        type: 'info',
        text1: 'Logged Out',
        text2: 'You have been logged out successfully',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Logout Error',
        text2: error instanceof Error ? error.message : 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        signUp,
        logout,
        isAuthenticated: user !== null,
      }}>
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

// Export mock users for login screen (only used in mock mode)
export { mockUsers };
