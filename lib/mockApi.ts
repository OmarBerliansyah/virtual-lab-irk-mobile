import type { CreateEventRequest, CreateTaskRequest, Event, Task, UpdateEventRequest, UpdateTaskRequest, User } from '@/types/api';
import { mockAuth, mockUsers } from './mockAuth';
import { mockEvents, mockTasks } from './mockData';

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
  getProfile: async (clerkId?: string): Promise<{ success: boolean; user: User }> => {
    await delay(200);
    const currentUser = mockAuth.getCurrentUser();
    if (!currentUser) {
      throw new Error('Not authenticated');
    }
    return {
      success: true,
      user: currentUser,
    };
  },

  updateProfile: async (clerkId: string | undefined, data: Partial<User>): Promise<{ success: boolean; user: User }> => {
    await delay(400);
    const currentUser = mockAuth.getCurrentUser();
    if (!currentUser) {
      throw new Error('Not authenticated');
    }
    const updated = { ...currentUser, ...data, updatedAt: new Date().toISOString() };
    // Update the current user in mockAuth
    Object.assign(currentUser, updated);
    return {
      success: true,
      user: updated,
    };
  },

  updateRole: async (clerkId: string | undefined, role: 'user' | 'assistant' | 'admin'): Promise<{ success: boolean; user: User }> => {
    await delay(200);
    const currentUser = mockAuth.getCurrentUser();
    if (!currentUser) {
      throw new Error('Not authenticated');
    }
    currentUser.role = role;
    currentUser.updatedAt = new Date().toISOString();
    return {
      success: true,
      user: { ...currentUser },
    };
  },

  createUser: async (user: { clerkId: string; email: string; role: 'user' | 'assistant' | 'admin' }): Promise<User> => {
    await delay(300);
    const newUser: User = {
      _id: user.clerkId,
      clerkId: user.clerkId,
      email: user.email,
      role: user.role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    // In mock, we just return the user (no actual storage)
    return newUser;
  },

  // Tasks
  getTasks: async (assignee?: string, isAssistantTask?: boolean): Promise<Task[]> => {
    await delay(300);
    let filtered = [...mockTasks];
    
    if (isAssistantTask !== undefined) {
      filtered = filtered.filter(t => t.isAssistantTask === isAssistantTask);
    }
    
    if (assignee) {
      // For student tasks, check if assigned to this student
      filtered = filtered.filter(t => 
        !t.isAssistantTask && (
          t.assignee === assignee || 
          (t.assignedTo && t.assignedTo.includes(assignee))
        )
      );
    }
    
    return filtered;
  },
  
  // Mark task as completed by a student
  markTaskCompleted: async (taskId: string, studentEmail: string): Promise<Task> => {
    await delay(300);
    const task = mockTasks.find(t => t._id === taskId);
    if (!task) throw new Error('Task not found');
    
    if (!task.completedBy) {
      task.completedBy = [];
    }
    if (!task.completedBy.includes(studentEmail)) {
      task.completedBy.push(studentEmail);
    }
    task.updatedAt = new Date().toISOString();
    return task;
  },

  createTask: async (task: CreateTaskRequest): Promise<Task> => {
    await delay(500);
    const isAssistantTask = (task as any).isAssistantTask === true;
    
    if (isAssistantTask) {
      // Create assistant's personal task (not assigned to students)
      const newTask: Task = {
        _id: `task_${Date.now()}`,
        description: task.description || '',
        priority: task.priority || 'medium',
        status: task.status || 'To Do',
        tags: task.tags || [],
        ...task,
        isAssistantTask: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockTasks.push(newTask);
      return newTask;
    }
    
    // If assignee is not specified, auto-assign to all students
    if (!task.assignee) {
      const students = mockUsers.filter(u => u.role === 'user');
      const studentEmails = students.map(s => s.email);
      // Create a single task assigned to all students
      const newTask: Task = {
        _id: `task_${Date.now()}`,
        description: task.description || '',
        priority: task.priority || 'medium',
        status: task.status || 'To Do',
        tags: task.tags || [],
        ...task,
        assignedTo: studentEmails,
        completedBy: [],
        isAssistantTask: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockTasks.push(newTask);
      return newTask;
    }
    
    // If assignee is specified, create a single task for that student
    const newTask: Task = {
      _id: `task_${Date.now()}`,
      description: task.description || '',
      priority: task.priority || 'medium',
      status: task.status || 'To Do',
      tags: task.tags || [],
      ...task,
      assignedTo: [task.assignee],
      completedBy: [],
      isAssistantTask: false,
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

  // User Management (Admin and Assistant can view users)
  getUsers: async (): Promise<User[]> => {
    await delay(300);
    const currentUser = mockAuth.getCurrentUser();
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'assistant')) {
      throw new Error('Unauthorized: Admin or Assistant access required');
    }
    return [...mockUsers];
  },

  updateUser: async (id: string, data: Partial<User>): Promise<User> => {
    await delay(400);
    const currentUser = mockAuth.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Unauthorized: Admin access required');
    }
    const user = mockUsers.find(u => u._id === id);
    if (!user) throw new Error('User not found');
    const updated = { ...user, ...data, updatedAt: new Date().toISOString() };
    Object.assign(user, updated);
    return updated;
  },

  deleteUser: async (id: string): Promise<void> => {
    await delay(300);
    const currentUser = mockAuth.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      throw new Error('Unauthorized: Admin access required');
    }
    const index = mockUsers.findIndex(u => u._id === id);
    if (index === -1) throw new Error('User not found');
    // Don't allow deleting yourself
    if (mockUsers[index]._id === currentUser._id) {
      throw new Error('Cannot delete your own account');
    }
    mockUsers.splice(index, 1);
  },
};

