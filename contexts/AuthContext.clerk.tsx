/**
 * Clerk-based AuthContext
 * 
 * To use this instead of the mock AuthContext:
 * 1. Install dependencies: npm install @clerk/clerk-expo @supabase/supabase-js
 * 2. Set up environment variables (see BACKEND_INTEGRATION_GUIDE.md)
 * 3. Replace import in app/_layout.tsx:
 *    - Change: import { AuthProvider } from '@/contexts/AuthContext';
 *    - To: import { AuthProvider } from '@/contexts/AuthContext.clerk';
 */

import { supabase } from '@/lib/supabase';
import type { User } from '@/types/api';
import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-expo';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import Toast from 'react-native-toast-message';
import Constants from 'expo-constants';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { isSignedIn, isLoaded: clerkLoaded, getToken } = useClerkAuth();
  const { user: clerkUser } = useUser();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sync user from backend API
  useEffect(() => {
    const syncUser = async () => {
      console.log('🔍 Auth State Check:', { 
        clerkLoaded, 
        isSignedIn, 
        hasClerkUser: !!clerkUser,
        userEmail: clerkUser?.primaryEmailAddress?.emailAddress 
      });

      if (!clerkLoaded) {
        setIsLoading(true);
        return;
      }

      if (isSignedIn && clerkUser) {
        try {
          // Get JWT token from Clerk
          const token = await getToken();
          
          if (!token) {
            console.error('No Clerk token available');
            setIsLoading(false);
            return;
          }

          // Fetch user profile from backend API
          const apiBaseUrl = 
            process.env.EXPO_PUBLIC_API_BASE_URL || 
            Constants.expoConfig?.extra?.apiBaseUrl ||
            'https://virtual-lab-irk-api-iead3.ondigitalocean.app';

          console.log('🌐 Fetching user profile from backend:', apiBaseUrl);

          const response = await fetch(`${apiBaseUrl}/api/users/profile`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const responseData = await response.json();
            console.log('✅ User profile from backend:', responseData);
            
            // Backend returns { success: boolean, user: User }
            const userData = responseData.user || responseData;
            
            // Normalize role to lowercase for consistent comparison
            const normalizedRole = (userData.role || 'user').toLowerCase();
            
            setUser({
              _id: userData._id || userData.id || clerkUser.id,
              clerkId: clerkUser.id,
              email: userData.email || clerkUser.primaryEmailAddress?.emailAddress || '',
              role: normalizedRole as 'user' | 'assistant' | 'admin',
              name: userData.name,
              createdAt: userData.createdAt || clerkUser.createdAt?.toISOString() || new Date().toISOString(),
              updatedAt: userData.updatedAt || clerkUser.updatedAt?.toISOString() || new Date().toISOString(),
            });
          } else {
            console.warn('Backend API returned error:', response.status);
            
            // Fallback: Try Supabase or use Clerk metadata
            if (supabase) {
              // Try Supabase fallback
              const { data: existingUser, error: fetchError } = await supabase
                .from('users')
                .select('*')
                .eq('clerk_id', clerkUser.id)
                .single();

              if (existingUser) {
                const normalizedRole = (existingUser.role || 'user').toLowerCase();
                setUser({
                  _id: existingUser.id,
                  clerkId: existingUser.clerk_id,
                  email: existingUser.email,
                  role: normalizedRole as 'user' | 'assistant' | 'admin',
                  createdAt: existingUser.created_at,
                  updatedAt: existingUser.updated_at,
                });
              } else if (fetchError && fetchError.code === 'PGRST116') {
                // User doesn't exist, create it
                const { data: newUser, error: createError } = await supabase
                  .from('users')
                  .insert({
                    clerk_id: clerkUser.id,
                    email: clerkUser.primaryEmailAddress?.emailAddress || '',
                    role: (clerkUser.publicMetadata?.role as 'user' | 'assistant' | 'admin') || 'user',
                  })
                  .select()
                  .single();

                if (createError) {
                  console.error('Error creating user:', createError);
                  throw createError;
                }

                if (newUser) {
                  const normalizedRole = (newUser.role || 'user').toLowerCase();
                  setUser({
                    _id: newUser.id,
                    clerkId: newUser.clerk_id,
                    email: newUser.email,
                    role: normalizedRole as 'user' | 'assistant' | 'admin',
                    createdAt: newUser.created_at,
                    updatedAt: newUser.updated_at,
                  });
                }
              } else if (fetchError) {
                throw fetchError;
              }
            } else {
              // No Supabase, use Clerk metadata as fallback
              console.warn('Using Clerk metadata as fallback');
              const clerkRole = clerkUser.publicMetadata?.role as string;
              const normalizedRole = (clerkRole || 'user').toLowerCase();
              setUser({
                _id: clerkUser.id,
                clerkId: clerkUser.id,
                email: clerkUser.primaryEmailAddress?.emailAddress || '',
                role: normalizedRole as 'user' | 'assistant' | 'admin',
                createdAt: clerkUser.createdAt?.toISOString() || new Date().toISOString(),
                updatedAt: clerkUser.updatedAt?.toISOString() || new Date().toISOString(),
              });
            }
          }
        } catch (error) {
          console.error('❌ Error syncing user:', error);
          
          // Last fallback: use Clerk data only
          console.warn('⚠️ Using Clerk data as last fallback');
          const clerkRole = clerkUser.publicMetadata?.role as string;
          const normalizedRole = (clerkRole || 'user').toLowerCase();
          setUser({
            _id: clerkUser.id,
            clerkId: clerkUser.id,
            email: clerkUser.primaryEmailAddress?.emailAddress || '',
            role: normalizedRole as 'user' | 'assistant' | 'admin',
            createdAt: clerkUser.createdAt?.toISOString() || new Date().toISOString(),
            updatedAt: clerkUser.updatedAt?.toISOString() || new Date().toISOString(),
          });
        }
      } else {
        console.log('❌ User not signed in, clearing user state');
        setUser(null);
      }

      setIsLoading(false);
      console.log('✅ Auth sync complete. Authenticated:', isSignedIn);
    };

    syncUser();
  }, [isSignedIn, clerkUser, clerkLoaded, getToken]);

  const login = async (email: string, password: string) => {
    // Clerk handles login through their UI components
    // This method is kept for compatibility but should use Clerk's sign-in flow
    Toast.show({
      type: 'info',
      text1: 'Use Clerk Sign-In',
      text2: 'Please use the Clerk sign-in component or navigate to /sign-in',
    });
  };

  const signUp = async (email: string, password: string) => {
    // Clerk handles sign up through their UI components
    // This method is kept for compatibility but should use Clerk's sign-up flow
    Toast.show({
      type: 'info',
      text1: 'Use Clerk Sign-Up',
      text2: 'Please use the Clerk sign-up component or navigate to /sign-up',
    });
  };

  const logout = async () => {
    try {
      // Clerk handles logout through their components
      // Clear Supabase session if needed
      if (supabase) {
        await supabase.auth.signOut();
      }
      setUser(null);
      Toast.show({
        type: 'info',
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
    <AuthContext.Provider value={{ isAuthenticated: isSignedIn || false, isLoading, user, login, signUp, logout }}>
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

