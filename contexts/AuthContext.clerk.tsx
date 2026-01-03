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

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { isSignedIn, isLoaded: clerkLoaded } = useClerkAuth();
  const { user: clerkUser } = useUser();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sync user with Supabase
  useEffect(() => {
    const syncUser = async () => {
      if (!clerkLoaded) {
        setIsLoading(true);
        return;
      }

      if (isSignedIn && clerkUser) {
        try {
          if (!supabase) {
            console.warn('Supabase not configured, using Clerk user only');
            // Create a minimal user object from Clerk
            setUser({
              _id: clerkUser.id,
              clerkId: clerkUser.id,
              email: clerkUser.primaryEmailAddress?.emailAddress || '',
              role: (clerkUser.publicMetadata?.role as 'user' | 'assistant' | 'admin') || 'user',
              createdAt: clerkUser.createdAt?.toISOString() || new Date().toISOString(),
              updatedAt: clerkUser.updatedAt?.toISOString() || new Date().toISOString(),
            });
            setIsLoading(false);
            return;
          }

          // Get or create user in Supabase
          const { data: existingUser, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('clerk_id', clerkUser.id)
            .single();

          if (existingUser) {
            setUser({
              _id: existingUser.id,
              clerkId: existingUser.clerk_id,
              email: existingUser.email,
              role: existingUser.role,
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
              setUser({
                _id: newUser.id,
                clerkId: newUser.clerk_id,
                email: newUser.email,
                role: newUser.role,
                createdAt: newUser.created_at,
                updatedAt: newUser.updated_at,
              });
            }
          } else if (fetchError) {
            throw fetchError;
          }
        } catch (error) {
          console.error('Error syncing user:', error);
          Toast.show({
            type: 'error',
            text1: 'Sync Error',
            text2: 'Failed to sync user data',
          });
        }
      } else {
        setUser(null);
      }

      setIsLoading(false);
    };

    syncUser();
  }, [isSignedIn, clerkUser, clerkLoaded]);

  const login = async (email: string, password: string) => {
    // Clerk handles login through their UI components
    // This method is kept for compatibility but should use Clerk's sign-in flow
    Toast.show({
      type: 'info',
      text1: 'Use Clerk Sign-In',
      text2: 'Please use the Clerk sign-in component',
    });
    return false;
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
    <AuthContext.Provider value={{ isAuthenticated: isSignedIn || false, isLoading, user, login, logout }}>
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

