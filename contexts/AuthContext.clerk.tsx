/**
 * Clerk-based AuthContext
 * 
 * Uses Clerk for authentication and syncs user data with the backend API.
 */

import type { User } from '@/types/api';
import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-expo';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import Toast from 'react-native-toast-message';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { isSignedIn, isLoaded: clerkLoaded, signOut, getToken: clerkGetToken } = useClerkAuth();
  const { user: clerkUser } = useUser();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user from backend API
  const fetchUserFromBackend = async (authToken: string): Promise<User | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/me`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.user || data;
      } else if (response.status === 404) {
        // User doesn't exist in backend yet - this is okay for new users
        console.log('User not found in backend, using Clerk data');
        return null;
      } else {
        console.error('Failed to fetch user from backend:', response.status);
        return null;
      }
    } catch (error) {
      console.error('Error fetching user from backend:', error);
      return null;
    }
  };

  // Get Clerk token
  const getToken = async (): Promise<string | null> => {
    try {
      const authToken = await clerkGetToken();
      return authToken;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  };

  // Sync user with backend
  useEffect(() => {
    const syncUser = async () => {
      if (!clerkLoaded) {
        setIsLoading(true);
        return;
      }

      if (isSignedIn && clerkUser) {
        try {
          // Get Clerk token
          const authToken = await clerkGetToken();
          setToken(authToken);

          if (authToken) {
            // Try to fetch user from backend
            const backendUser = await fetchUserFromBackend(authToken);
            
            if (backendUser) {
              setUser(backendUser);
            } else {
              // Create user object from Clerk data (backend will create on first API call)
              setUser({
                _id: clerkUser.id,
                clerkId: clerkUser.id,
                email: clerkUser.primaryEmailAddress?.emailAddress || '',
                role: (clerkUser.publicMetadata?.role as 'USER' | 'ASSISTANT' | 'ADMIN') || 'USER',
                createdAt: clerkUser.createdAt?.toISOString() || new Date().toISOString(),
                updatedAt: clerkUser.updatedAt?.toISOString() || new Date().toISOString(),
              });
            }
          } else {
            // No token available, use Clerk user data
            setUser({
              _id: clerkUser.id,
              clerkId: clerkUser.id,
              email: clerkUser.primaryEmailAddress?.emailAddress || '',
              role: (clerkUser.publicMetadata?.role as 'USER' | 'ASSISTANT' | 'ADMIN') || 'USER',
              createdAt: clerkUser.createdAt?.toISOString() || new Date().toISOString(),
              updatedAt: clerkUser.updatedAt?.toISOString() || new Date().toISOString(),
            });
          }
        } catch (error) {
          console.error('Error syncing user:', error);
          // Still set user from Clerk data even if backend sync fails
          setUser({
            _id: clerkUser.id,
            clerkId: clerkUser.id,
            email: clerkUser.primaryEmailAddress?.emailAddress || '',
            role: (clerkUser.publicMetadata?.role as 'USER' | 'ASSISTANT' | 'ADMIN') || 'USER',
            createdAt: clerkUser.createdAt?.toISOString() || new Date().toISOString(),
            updatedAt: clerkUser.updatedAt?.toISOString() || new Date().toISOString(),
          });
        }
      } else {
        setUser(null);
        setToken(null);
      }

      setIsLoading(false);
    };

    syncUser();
  }, [isSignedIn, clerkUser, clerkLoaded]);

  const login = async (_email: string, _password: string) => {
    // Clerk handles login through useSignIn hook in login.tsx
    return false;
  };

  const logout = async () => {
    try {
      await signOut();
      setUser(null);
      setToken(null);
      Toast.show({
        type: 'success',
        text1: 'Logged Out',
        text2: 'You have been successfully logged out.',
      });
    } catch (error) {
      console.error('Logout error:', error);
      Toast.show({
        type: 'error',
        text1: 'Logout Error',
        text2: error instanceof Error ? error.message : 'An unexpected error occurred.',
      });
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated: isSignedIn || false, 
        isLoading, 
        user, 
        token,
        login, 
        logout,
        getToken,
      }}
    >
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

