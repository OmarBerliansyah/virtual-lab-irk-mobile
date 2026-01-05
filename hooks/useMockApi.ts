import { useAuth } from '@/contexts/AuthContext.clerk';
import { api } from '@/lib/api';
import type { CreateEventRequest, CreateTaskRequest, UpdateEventRequest, UpdateTaskRequest, User } from '@/types/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Events hooks
export const useEvents = (course?: string) => {
  return useQuery({
    queryKey: ['events', course],
    queryFn: () => api.getEvents(course),
  });
};

export const useCreateEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (event: CreateEventRequest) => api.createEvent(event),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
};

export const useUpdateEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, event }: { id: string; event: UpdateEventRequest }) =>
      api.updateEvent(id, event),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
};

export const useDeleteEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
};

// Tasks hooks
export const useTasks = (assignee?: string, isAssistantTask?: boolean) => {
  return useQuery({
    queryKey: ['tasks', assignee, isAssistantTask],
    queryFn: () => api.getTasks(assignee, isAssistantTask),
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (task: CreateTaskRequest & { isAssistantTask?: boolean; assignedTo?: string[] }) => 
      api.createTask(task),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, task }: { id: string; task: UpdateTaskRequest }) =>
      api.updateTask(id, task),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

export const useMarkTaskCompleted = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: ({ taskId, studentEmail }: { taskId: string; studentEmail: string }) =>
      api.markTaskCompleted(taskId, studentEmail),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

// User profile hooks
export const useUserProfile = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['profile', user?.clerkId],
    queryFn: () => api.getProfile(user?.clerkId),
    select: (data) => data.user,
    enabled: !!user,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (data: Partial<{ email: string }>) => {
      const clerkId = user?.clerkId;
      // For mock API, clerkId is optional
      return api.updateProfile(clerkId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

export const useUpdateRole = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (role: 'user' | 'assistant' | 'admin') => {
      const clerkId = user?.clerkId;
      return api.updateRole(clerkId, role);
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
    queryFn: () => api.getUsers(),
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) => api.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

