import { useAuth as useClerkAuth } from '@clerk/clerk-expo';
import { useCallback } from 'react';

// Tracks pending GET requests to avoid duplicate network calls
const pendingRequests = new Map<string, Promise<Response>>();

const withTimeout = async (promise: Promise<Response>, timeoutMs = 30000) => {
  let timeoutHandle: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<Response>((_, reject) => {
    timeoutHandle = setTimeout(() => reject(new Error('Request timed out')), timeoutMs);
  });
  const result = await Promise.race([promise, timeoutPromise]);
  clearTimeout(timeoutHandle!);
  return result as Response;
};

export function useApiAuth() {
  const { getToken, isSignedIn } = useClerkAuth();

  const getAuthHeaders = useCallback(async () => {
    if (!isSignedIn) {
      throw new Error('Not authenticated');
    }
    
    // Get the actual JWT token from Clerk
    const token = await getToken();
    
    if (!token) {
      throw new Error('Failed to get authentication token');
    }
    
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }, [getToken, isSignedIn]);

  const apiCall = useCallback(
    async (endpoint: string, options: RequestInit = {}) => {
      const isGetRequest = !options.method || options.method.toUpperCase() === 'GET';
      const requestKey = isGetRequest ? `${endpoint}_${JSON.stringify(options.headers || {})}` : null;

      if (requestKey && pendingRequests.has(requestKey)) {
        return pendingRequests.get(requestKey)!;
      }

      const headers = await getAuthHeaders();
      const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000';

      const requestPromise = withTimeout(
        fetch(`${baseUrl}${endpoint}`, {
          ...options,
          headers: {
            ...headers,
            ...options.headers,
          },
        }),
      ).finally(() => {
        if (requestKey) pendingRequests.delete(requestKey);
      });

      if (requestKey) pendingRequests.set(requestKey, requestPromise);
      return requestPromise;
    },
    [getAuthHeaders],
  );

  return { getAuthHeaders, apiCall };
}
