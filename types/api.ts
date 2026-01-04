export interface User {
  _id: string;
  clerkId: string;
  email: string;
  role: 'USER' | 'ASSISTANT' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
}

export interface ProfileUser {
  profilePicture: string;
  id: string;
  clerkId: string;
  email: string;
  role: 'USER' | 'ASSISTANT' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  _id: string;
  title: string;
  start: string;
  end?: string;
  course: string;
  type: 'deadline' | 'release' | 'assessment' | 'highlight';
  description?: string;
  photoUrl?: string;
  linkAttachments?: { title: string; url: string }[];
  version: number; // Required for OCC
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'To Do' | 'In Progress' | 'Done';
  dueDate?: string;
  assignee?: string; // For student tasks, this is the student email. For assistant tasks, this is null/empty
  tags: string[];
  version: number; // Required for OCC
  createdAt: string;
  updatedAt: string;
  // For student tasks: track which students completed this task
  completedBy?: string[]; // Array of student emails who completed this task
  assignedTo?: string[]; // Array of student emails this task is assigned to (for auto-assigned tasks)
  isAssistantTask?: boolean; // true if this is an assistant's personal task
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  status?: 'To Do' | 'In Progress' | 'Done';
  dueDate?: string;
  assignee?: string;
  tags?: string[];
}

export type UpdateTaskRequest = Partial<CreateTaskRequest> & { version?: number };

export interface CreateEventRequest {
  title: string;
  start: string;
  end?: string;
  course: string;
  type: 'deadline' | 'release' | 'assessment' | 'highlight';
  description?: string;
  photoUrl?: string;
  linkAttachments?: { title: string; url: string }[];
}

export type UpdateEventRequest = Partial<CreateEventRequest> & { version?: number };

export interface UpdateUserRequest {
  email?: string;
}

export interface UserProfileResponse {
  success: boolean;
  user: ProfileUser;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
}
