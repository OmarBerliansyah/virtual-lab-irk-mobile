/**
 * Example: How to update useMockApi.ts to use the API switcher
 * 
 * This file shows the changes needed. Replace mockApi with api throughout.
 */

import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api'; // Changed from: import { mockApi } from '@/lib/mockApi';
import type { CreateEventRequest, CreateTaskRequest, UpdateEventRequest, UpdateTaskRequest, User } from '@/types/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Events hooks
export const useEvents = (course?: string) => {
  return useQuery({
    queryKey: ['events', course],
    queryFn: () => api.getEvents(course), // Changed from: mockApi.getEvents(course)
  });
};

export const useCreateEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (event: CreateEventRequest) => api.createEvent(event), // Changed
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
};

export const useUpdateEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, event }: { id: string; event: UpdateEventRequest }) =>
      api.updateEvent(id, event), // Changed
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
};

export const useDeleteEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteEvent(id), // Changed
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
};

// Tasks hooks
export const useTasks = (assignee?: string, isAssistantTask?: boolean) => {
  return useQuery({
    queryKey: ['tasks', assignee, isAssistantTask],
    queryFn: () => api.getTasks(assignee, isAssistantTask), // Changed
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (task: CreateTaskRequest) => api.createTask(task), // Changed
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, task }: { id: string; task: UpdateTaskRequest }) =>
      api.updateTask(id, task), // Changed
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteTask(id), // Changed
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

// User profile hooks
export const useUserProfile = () => {
  const { user: authUser } = useAuth(); // Get current user from auth context
  
  return useQuery({
    queryKey: ['profile', authUser?.clerkId],
    queryFn: () => {
      if (!authUser?.clerkId) {
        throw new Error('Not authenticated');
      }
      return api.getProfile(authUser.clerkId); // Changed - now needs clerkId
    },
    select: (data) => data.user,
    enabled: !!authUser?.clerkId, // Only run if authenticated
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { user: authUser } = useAuth();
  
  return useMutation({
    mutationFn: async (data: Partial<{ email: string }>) => {
      if (!authUser?.clerkId) {
        throw new Error('Not authenticated');
      }
      return api.updateProfile(authUser.clerkId, data); // Changed
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

export const useUpdateRole = () => {
  const queryClient = useQueryClient();
  const { user: authUser } = useAuth();
  
  return useMutation({
    mutationFn: async (role: 'user' | 'assistant' | 'admin') => {
      if (!authUser?.clerkId) {
        throw new Error('Not authenticated');
      }
      return api.updateProfile(authUser.clerkId, { role }); // Changed
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

// User Management hooks (Admin only)
export const useGetUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => api.getUsers(), // Changed
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) => 
      api.updateUser(id, data), // Changed
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteUser(id), // Changed
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

