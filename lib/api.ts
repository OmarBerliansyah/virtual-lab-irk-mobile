/**
 * API Layer for Hono Backend Integration
 * 
 * This file provides axios-based API calls to the Hono backend.
 * It exports `publicApi` for unauthenticated calls and
 * `createAuthenticatedApi` factory for authenticated calls.
 */

import axios from 'axios';

// Use IP Address of your laptop if testing on physical device (not localhost)
// Example: 'http://192.168.1.10:8000'
const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// ============================================
// PUBLIC API (No Authentication Required)
// ============================================
export const publicApi = {
  getEvents: async (course?: string) => {
    const params = course && course !== 'all' ? { course } : {};
    const response = await axios.get(`${BASE_URL}/api/events`, { params });
    return response.data;
  },

  getHealth: async () => {
    const response = await axios.get(`${BASE_URL}/health`);
    return response.data;
  },

  getAssistants: async (active?: boolean) => {
    const params = active !== undefined ? { active: String(active) } : {};
    const response = await axios.get(`${BASE_URL}/api/assistants`, { params });
    return response.data;
  },

  getAssistantById: async (id: string) => {
    const response = await axios.get(`${BASE_URL}/api/assistants/${id}`);
    return response.data;
  },
};

// ============================================
// AUTHENTICATED API FACTORY
// Used by useApi.ts hooks
// ============================================
export const createAuthenticatedApi = (getAuthHeaders: () => Promise<Record<string, string>>) => {
  const getHeaders = async () => {
    const headers = await getAuthHeaders();
    return {
      ...headers,
      'Content-Type': 'application/json',
    };
  };

  return {
    // ========== EVENTS ==========
    getEvents: async (course?: string) => {
      const headers = await getHeaders();
      const params = course && course !== 'all' ? { course } : {};
      const response = await axios.get(`${BASE_URL}/api/events`, { headers, params });
      return response.data;
    },

    createEvent: async (data: any) => {
      const headers = await getHeaders();
      const response = await axios.post(`${BASE_URL}/api/events`, data, { headers });
      return response.data;
    },

    updateEvent: async (id: string, data: any) => {
      const headers = await getHeaders();
      const response = await axios.put(`${BASE_URL}/api/events/${id}`, data, { headers });
      return response.data;
    },

    deleteEvent: async (id: string) => {
      const headers = await getHeaders();
      const response = await axios.delete(`${BASE_URL}/api/events/${id}`, { headers });
      return response.data;
    },

    // ========== TASKS ==========
    getTasks: async () => {
      const headers = await getHeaders();
      const response = await axios.get(`${BASE_URL}/api/tasks`, { headers });
      return response.data;
    },

    createTask: async (data: any) => {
      const headers = await getHeaders();
      const response = await axios.post(`${BASE_URL}/api/tasks`, data, { headers });
      return response.data;
    },

    updateTask: async (id: string, data: any) => {
      const headers = await getHeaders();
      const response = await axios.put(`${BASE_URL}/api/tasks/${id}`, data, { headers });
      return response.data;
    },

    deleteTask: async (id: string) => {
      const headers = await getHeaders();
      const response = await axios.delete(`${BASE_URL}/api/tasks/${id}`, { headers });
      return response.data;
    },

    // ========== USER PROFILE ==========
    getProfile: async () => {
      const headers = await getHeaders();
      const response = await axios.get(`${BASE_URL}/api/users/profile`, { headers });
      return response.data;
    },

    updateProfile: async (data: { email?: string }) => {
      const headers = await getHeaders();
      const response = await axios.put(`${BASE_URL}/api/users/profile`, data, { headers });
      return response.data;
    },

    // ========== ASSISTANTS (Authenticated) ==========
    getAssistantMe: async () => {
      const headers = await getHeaders();
      const response = await axios.get(`${BASE_URL}/api/assistants/me`, { headers });
      return response.data;
    },

    createAssistant: async (data: any) => {
      const headers = await getHeaders();
      const response = await axios.post(`${BASE_URL}/api/assistants`, data, { headers });
      return response.data;
    },

    updateAssistant: async (id: string, data: any) => {
      const headers = await getHeaders();
      const response = await axios.put(`${BASE_URL}/api/assistants/${id}`, data, { headers });
      return response.data;
    },

    deleteAssistant: async (id: string) => {
      const headers = await getHeaders();
      const response = await axios.delete(`${BASE_URL}/api/assistants/${id}`, { headers });
      return response.data;
    },

    // ========== ADMIN: USER MANAGEMENT ==========
    getAllUsers: async () => {
      const headers = await getHeaders();
      const response = await axios.get(`${BASE_URL}/api/admin/users`, { headers });
      return response.data;
    },

    getUserById: async (id: string) => {
      const headers = await getHeaders();
      const response = await axios.get(`${BASE_URL}/api/admin/users/${id}`, { headers });
      return response.data;
    },

    updateUser: async (id: string, data: any) => {
      const headers = await getHeaders();
      const response = await axios.put(`${BASE_URL}/api/admin/users/${id}`, data, { headers });
      return response.data;
    },

    updateUserRole: async (id: string, role: string) => {
      const headers = await getHeaders();
      const response = await axios.put(`${BASE_URL}/api/admin/update/${id}/role`, { role }, { headers });
      return response.data;
    },

    deleteUser: async (id: string) => {
      const headers = await getHeaders();
      const response = await axios.delete(`${BASE_URL}/api/admin/users/${id}`, { headers });
      return response.data;
    },
  };
};

// ============================================
// LEGACY EXPORT FOR BACKWARD COMPATIBILITY
// This allows useMockApi.ts to still work during migration
// ============================================
import { mockApi } from './mockApi';
export const api = mockApi;
export { mockApi };
