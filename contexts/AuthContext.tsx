import { api } from '@/lib/api';
import { mockAuth, mockUsers } from '@/lib/mockAuth';
import { supabase } from '@/lib/supabase';
import type { User } from '@/types/api';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import Toast from 'react-native-toast-message';

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

  // Check Supabase auth session on mount and when auth state changes
  useEffect(() => {
    if (!supabase) {
      // Fallback to mock auth if Supabase not configured
      const currentUser = mockAuth.getCurrentUser();
      setUser(currentUser);
      setIsLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserFromSupabase(session.user.id);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await loadUserFromSupabase(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsLoading(false);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        await loadUserFromSupabase(session.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadUserFromSupabase = async (supabaseUserId: string) => {
    if (!supabase) return;

    try {
      // Try to get user from our users table
      const { user: dbUser } = await api.getProfile(supabaseUserId);
      setUser(dbUser);
    } catch (error: any) {
      // User doesn't exist in users table, create it
      if (error.message === 'User not found') {
        try {
          // Get email from Supabase auth
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (authUser?.email) {
            const newUser = await api.createUser({
              clerkId: supabaseUserId, // Using supabaseUserId as the ID
              email: authUser.email,
              role: 'user',
            });
            setUser(newUser);
            Toast.show({
              type: 'success',
              text1: 'Welcome!',
              text2: 'Your account has been set up.',
            });
          }
        } catch (createError) {
          console.error('Error creating user:', createError);
          // Fallback: create user object from Supabase auth data
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (authUser) {
            setUser({
              _id: authUser.id,
              clerkId: authUser.id,
              email: authUser.email || '',
              role: 'user',
              createdAt: authUser.created_at,
              updatedAt: authUser.updated_at || authUser.created_at,
            });
          }
        }
      } else {
        throw error;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    if (!supabase) {
      // Fallback to mock auth
      setIsLoading(true);
      try {
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
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        Toast.show({
          type: 'error',
          text1: 'Login Failed',
          text2: error.message || 'Invalid credentials',
        });
        throw error;
      }

      if (data.user) {
        await loadUserFromSupabase(data.user.id);
        Toast.show({
          type: 'success',
          text1: 'Login Successful',
          text2: `Welcome, ${data.user.email}!`,
        });
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    if (!supabase) {
      Toast.show({
        type: 'error',
        text1: 'Sign Up Failed',
        text2: 'Supabase not configured',
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) {
        Toast.show({
          type: 'error',
          text1: 'Sign Up Failed',
          text2: error.message || 'Unable to create account',
        });
        throw error;
      }

      if (data.user) {
        // User will be created in loadUserFromSupabase when session is established
        Toast.show({
          type: 'success',
          text1: 'Account Created!',
          text2: 'Please check your email to verify your account.',
        });
      }
    } catch (error) {
      console.error('Sign up error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      if (supabase) {
        await supabase.auth.signOut();
      } else {
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

// Export mock users for login screen (only used when Supabase is disabled)
export { mockUsers };
