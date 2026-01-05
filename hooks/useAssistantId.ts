/**
 * Hook to get Assistant ID for current user
 * Required by backend when creating/updating tasks
 */

import { useQuery } from '@tanstack/react-query';
import { createAuthenticatedApi } from '@/lib/api';
import { useApiAuth } from './useApiAuth';
import { useAuth } from '@/contexts/AuthContext.clerk';

export function useAssistantId() {
  const { user } = useAuth();
  const { getAuthHeaders } = useApiAuth();
  const api = createAuthenticatedApi(getAuthHeaders);

  // Fetch assistant profile for current user
  const { data: assistantData, isLoading, error } = useQuery({
    queryKey: ['assistant', 'me'],
    queryFn: async () => {
      try {
        const response = await api.getAssistantMe();
        return response.data; // Backend returns { success: true, data: {...} }
      } catch (err) {
        console.log('No assistant profile found for current user');
        return null;
      }
    },
    enabled: user?.role === 'ASSISTANT' || user?.role === 'ADMIN', // Only fetch if user is assistant/admin
    retry: false, // Don't retry if no assistant profile exists
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  return {
    assistantId: assistantData?._id || null,
    isLoading,
    error,
    hasAssistantProfile: !!assistantData,
  };
}

