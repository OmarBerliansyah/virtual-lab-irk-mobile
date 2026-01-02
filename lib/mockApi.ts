import type { CreateEventRequest, CreateTaskRequest, Event, Task, UpdateEventRequest, UpdateTaskRequest, User } from '@/types/api';
import { mockEvents, mockTasks, mockUser } from './mockData';

// Simulate network latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock API Service
export const mockApi = {
  // Events
  getEvents: async (course?: string): Promise<Event[]> => {
    await delay(300);
    if (course && course !== 'all') {
      return mockEvents.filter(event => event.course === course);
    }
    return [...mockEvents];
  },

  createEvent: async (event: CreateEventRequest): Promise<Event> => {
    await delay(500);
    const newEvent: Event = {
      _id: `event_${Date.now()}`,
      ...event,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockEvents.push(newEvent);
    return newEvent;
  },

  updateEvent: async (id: string, event: UpdateEventRequest): Promise<Event> => {
    await delay(500);
    const index = mockEvents.findIndex(e => e._id === id);
    if (index === -1) throw new Error('Event not found');
    const updated = {
      ...mockEvents[index],
      ...event,
      updatedAt: new Date().toISOString(),
    };
    mockEvents[index] = updated;
    return updated;
  },

  deleteEvent: async (id: string): Promise<void> => {
    await delay(300);
    const index = mockEvents.findIndex(e => e._id === id);
    if (index === -1) throw new Error('Event not found');
    mockEvents.splice(index, 1);
  },

  // User Profile
  getProfile: async (): Promise<{ success: boolean; user: User }> => {
    await delay(200);
    return {
      success: true,
      user: mockUser,
    };
  },

  updateProfile: async (data: Partial<User>): Promise<{ success: boolean; user: User }> => {
    await delay(400);
    const updated = { ...mockUser, ...data, updatedAt: new Date().toISOString() };
    Object.assign(mockUser, updated);
    return {
      success: true,
      user: updated,
    };
  },

  // Tasks
  getTasks: async (): Promise<Task[]> => {
    await delay(300);
    return [...mockTasks];
  },

  createTask: async (task: CreateTaskRequest): Promise<Task> => {
    await delay(500);
    const newTask: Task = {
      _id: `task_${Date.now()}`,
      description: task.description || '',
      priority: task.priority || 'medium',
      status: task.status || 'To Do',
      tags: task.tags || [],
      ...task,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockTasks.push(newTask);
    return newTask;
  },

  updateTask: async (id: string, task: UpdateTaskRequest): Promise<Task> => {
    await delay(500);
    const index = mockTasks.findIndex(t => t._id === id);
    if (index === -1) throw new Error('Task not found');
    const updated = {
      ...mockTasks[index],
      ...task,
      updatedAt: new Date().toISOString(),
    };
    mockTasks[index] = updated;
    return updated;
  },

  deleteTask: async (id: string): Promise<void> => {
    await delay(300);
    const index = mockTasks.findIndex(t => t._id === id);
    if (index === -1) throw new Error('Task not found');
    mockTasks.splice(index, 1);
  },
};

