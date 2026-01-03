import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { createAuthenticatedApi } from '@/lib/api';
import { useApiAuth } from './useApiAuth';
import type { ProfileUser } from '@/types/api';

export function useUserProfile() {
  const { isSignedIn } = useAuth();
  const { getAuthHeaders } = useApiAuth();
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previousRole, setPreviousRole] = useState<string | null>(null);

  const api = createAuthenticatedApi(getAuthHeaders);

  const fetchProfile = useCallback(async () => {
    if (!isSignedIn) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.getProfile();
      if (previousRole && previousRole !== response.user.role) {
        // no window events in RN; log for debugging
        console.log('Role changed', previousRole, '->', response.user.role);
      }
      setPreviousRole(response.user.role);
      setUser(response.user);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load profile';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [api, isSignedIn, previousRole]);

  const updateProfile = async (userData: { email?: string }) => {
    if (!isSignedIn) throw new Error('Not authenticated');
    setLoading(true);
    setError(null);
    try {
      const response = await api.updateProfile(userData);
      setUser(response.user);
      return response.user;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSignedIn && !user && !loading && !error) {
      fetchProfile();
    }
  }, [isSignedIn, user, loading, error, fetchProfile]);

  return {
    user,
    loading,
    error,
    fetchProfile,
    updateProfile,
    isAdmin: user?.role === 'ADMIN',
    isAssistant: user?.role === 'ASSISTANT' || user?.role === 'ADMIN',
    isUser: !!user,
  };
}
