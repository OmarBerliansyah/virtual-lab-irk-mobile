import type {
  User,
  Event,
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  CreateEventRequest,
  UpdateEventRequest,
  UpdateUserRequest,
  UserProfileResponse,
  HealthResponse,
} from '@/types/api';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// Public endpoints
export const publicApi = {
  async getEvents(course?: string): Promise<Event[]> {
    const url = course
      ? `${API_BASE_URL}/api/events?course=${encodeURIComponent(course)}`
      : `${API_BASE_URL}/api/events`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch events');
    return response.json();
  },

  async getHealth(): Promise<HealthResponse> {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) throw new Error('Health check failed');
    return response.json();
  },
};

export const createAuthenticatedApi = (getAuthHeaders: () => Promise<Record<string, string>>) => ({
  async getProfile(): Promise<UserProfileResponse> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/users/profile`, { headers });
    if (!response.ok) throw new Error('Failed to fetch user profile');
    return response.json();
  },

  async updateProfile(userData: UpdateUserRequest): Promise<UserProfileResponse> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(userData),
    });
    if (!response.ok) throw new Error('Failed to update user profile');
    return response.json();
  },

  async getTasks(): Promise<Task[]> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/tasks`, { headers });
    if (!response.ok) throw new Error('Failed to fetch tasks');
    return response.json();
  },

  async createTask(task: CreateTaskRequest): Promise<Task> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/tasks`, {
      method: 'POST',
      headers,
      body: JSON.stringify(task),
    });
    if (!response.ok) throw new Error('Failed to create task');
    return response.json();
  },

  async updateTask(id: string, task: UpdateTaskRequest): Promise<Task> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/tasks/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(task),
    });
    if (!response.ok) throw new Error('Failed to update task');
    return response.json();
  },

  async deleteTask(id: string): Promise<void> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/tasks/${id}`, {
      method: 'DELETE',
      headers,
    });
    if (!response.ok) throw new Error('Failed to delete task');
  },

  async createEvent(event: CreateEventRequest): Promise<Event> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/events`, {
      method: 'POST',
      headers,
      body: JSON.stringify(event),
    });
    if (!response.ok) throw new Error('Failed to create event');
    return response.json();
  },

  async updateEvent(id: string, event: UpdateEventRequest): Promise<Event> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/events/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(event),
    });
    if (!response.ok) throw new Error('Failed to update event');
    return response.json();
  },

  async deleteEvent(id: string): Promise<void> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/events/${id}`, {
      method: 'DELETE',
      headers,
    });
    if (!response.ok) throw new Error('Failed to delete event');
  },

  async getAllUsers(): Promise<User[]> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/admin/users`, { headers });
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  },

  async getUserById(id: string): Promise<User> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/admin/users/${id}`, { headers });
    if (!response.ok) throw new Error('Failed to fetch user');
    return response.json();
  },

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/admin/users/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(userData),
    });
    if (!response.ok) throw new Error('Failed to update user');
    return response.json();
  },

  async deleteUser(id: string): Promise<void> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/api/admin/users/${id}`, {
      method: 'DELETE',
      headers,
    });
    if (!response.ok) throw new Error('Failed to delete user');
  },
});
