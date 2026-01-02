import { mockApi } from '@/lib/mockApi';
import type { CreateEventRequest, CreateTaskRequest, UpdateEventRequest, UpdateTaskRequest } from '@/types/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Events hooks
export const useEvents = (course?: string) => {
  return useQuery({
    queryKey: ['events', course],
    queryFn: () => mockApi.getEvents(course),
  });
};

export const useCreateEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (event: CreateEventRequest) => mockApi.createEvent(event),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
};

export const useUpdateEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, event }: { id: string; event: UpdateEventRequest }) =>
      mockApi.updateEvent(id, event),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
};

export const useDeleteEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mockApi.deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
};

// Tasks hooks
export const useTasks = () => {
  return useQuery({
    queryKey: ['tasks'],
    queryFn: () => mockApi.getTasks(),
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (task: CreateTaskRequest) => mockApi.createTask(task),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, task }: { id: string; task: UpdateTaskRequest }) =>
      mockApi.updateTask(id, task),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mockApi.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

// User profile hooks
export const useUserProfile = () => {
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => mockApi.getProfile(),
    select: (data) => data.user,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<{ email: string }>) => mockApi.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

