import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createAuthenticatedApi, publicApi } from '@/lib/api';
import { useApiAuth } from './useApiAuth';
import { useToast } from './use-toast';
import type { Event, Task, User } from '@/types/api';

// Events
export const useEvents = (course?: string) =>
  useQuery({
    queryKey: ['events', course],
    queryFn: () => publicApi.getEvents(course),
  });

export const useCreateEvent = () => {
  const { getAuthHeaders } = useApiAuth();
  const api = createAuthenticatedApi(getAuthHeaders);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (event: Omit<Event, '_id' | 'createdAt' | 'updatedAt'>) => api.createEvent(event),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({ title: 'Success', description: 'Event created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, type: 'error' });
    },
  });
};

export const useUpdateEvent = () => {
  const { getAuthHeaders } = useApiAuth();
  const api = createAuthenticatedApi(getAuthHeaders);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, event }: { id: string; event: Partial<Event> }) => api.updateEvent(id, event),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({ title: 'Success', description: 'Event updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, type: 'error' });
    },
  });
};

export const useDeleteEvent = () => {
  const { getAuthHeaders } = useApiAuth();
  const api = createAuthenticatedApi(getAuthHeaders);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => api.deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({ title: 'Success', description: 'Event deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, type: 'error' });
    },
  });
};

// Tasks
// Note: The backend doesn't filter by assignee/isAssistantTask yet, 
// these params are kept for API compatibility with useMockApi
export const useTasks = (_assignee?: string, _isAssistantTask?: boolean) => {
  const { getAuthHeaders } = useApiAuth();
  const api = createAuthenticatedApi(getAuthHeaders);
  return useQuery({ 
    queryKey: ['tasks', _assignee, _isAssistantTask], 
    queryFn: () => api.getTasks() 
  });
};

export const useCreateTask = () => {
  const { getAuthHeaders } = useApiAuth();
  const api = createAuthenticatedApi(getAuthHeaders);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (task: Omit<Task, '_id' | 'createdAt' | 'updatedAt'>) => api.createTask(task),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({ title: 'Success', description: 'Task created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, type: 'error' });
    },
  });
};

export const useUpdateTask = () => {
  const { getAuthHeaders } = useApiAuth();
  const api = createAuthenticatedApi(getAuthHeaders);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, task }: { id: string; task: Partial<Task> }) => api.updateTask(id, task),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({ title: 'Success', description: 'Task updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, type: 'error' });
    },
  });
};

export const useDeleteTask = () => {
  const { getAuthHeaders } = useApiAuth();
  const api = createAuthenticatedApi(getAuthHeaders);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => api.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({ title: 'Success', description: 'Task deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, type: 'error' });
    },
  });
};

export const useHealth = () =>
  useQuery({ queryKey: ['health'], queryFn: () => publicApi.getHealth(), refetchInterval: 30000 });

// Admin
export const useGetUsers = () => {
  const { getAuthHeaders } = useApiAuth();
  const api = createAuthenticatedApi(getAuthHeaders);
  return useQuery({ queryKey: ['ADMIN', 'users'], queryFn: () => api.getAllUsers() });
};

export const useUpdateUser = () => {
  const { getAuthHeaders } = useApiAuth();
  const api = createAuthenticatedApi(getAuthHeaders);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) => api.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ADMIN'] });
      toast({ title: 'Success', description: 'User updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, type: 'error' });
    },
  });
};

export const useDeleteUser = () => {
  const { getAuthHeaders } = useApiAuth();
  const api = createAuthenticatedApi(getAuthHeaders);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => api.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ADMIN'] });
      toast({ title: 'Success', description: 'User deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, type: 'error' });
    },
  });
};

// ========== USER PROFILE ==========
export const useUserProfile = () => {
  const { getAuthHeaders } = useApiAuth();
  const api = createAuthenticatedApi(getAuthHeaders);

  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await api.getProfile();
      return response.user;
    },
  });
};

export const useUpdateProfile = () => {
  const { getAuthHeaders } = useApiAuth();
  const api = createAuthenticatedApi(getAuthHeaders);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: { email?: string }) => api.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({ title: 'Success', description: 'Profile updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, type: 'error' });
    },
  });
};

// ========== ASSISTANTS ==========
export const useAssistants = (active?: boolean) =>
  useQuery({
    queryKey: ['assistants', active],
    queryFn: () => publicApi.getAssistants(active),
  });

export const useAssistantMe = () => {
  const { getAuthHeaders } = useApiAuth();
  const api = createAuthenticatedApi(getAuthHeaders);

  return useQuery({
    queryKey: ['assistant', 'me'],
    queryFn: () => api.getAssistantMe(),
  });
};

export const useCreateAssistant = () => {
  const { getAuthHeaders } = useApiAuth();
  const api = createAuthenticatedApi(getAuthHeaders);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: any) => api.createAssistant(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assistants'] });
      toast({ title: 'Success', description: 'Assistant created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, type: 'error' });
    },
  });
};

export const useUpdateAssistant = () => {
  const { getAuthHeaders } = useApiAuth();
  const api = createAuthenticatedApi(getAuthHeaders);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateAssistant(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assistants'] });
      queryClient.invalidateQueries({ queryKey: ['assistant'] });
      toast({ title: 'Success', description: 'Assistant updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, type: 'error' });
    },
  });
};

export const useDeleteAssistant = () => {
  const { getAuthHeaders } = useApiAuth();
  const api = createAuthenticatedApi(getAuthHeaders);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => api.deleteAssistant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assistants'] });
      toast({ title: 'Success', description: 'Assistant deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, type: 'error' });
    },
  });
};

export const useUpdateUserRole = () => {
  const { getAuthHeaders } = useApiAuth();
  const api = createAuthenticatedApi(getAuthHeaders);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => api.updateUserRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ADMIN'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({ title: 'Success', description: 'User role updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, type: 'error' });
    },
  });
};
