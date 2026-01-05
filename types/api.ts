export interface User {
  _id: string;
  clerkId: string;
  email: string;
  role: 'USER' | 'ASSISTANT' | 'ADMIN';
  version: number; // Required for Optimistic Concurrency Control
  createdAt: string;
  updatedAt: string;
}

export interface ProfileUser {
  profilePicture: string;
  id: string;
  clerkId: string;
  email: string;
  role: 'USER' | 'ASSISTANT' | 'ADMIN';
  version: number; // Required for Optimistic Concurrency Control
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
  assignee?: string; // Assistant name (from backend)
  assistantId?: string; // Required by backend - Assistant UUID
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
  assistantId: string; // Required by backend - must be valid Assistant UUID
  tags?: string[];
}

export type UpdateTaskRequest = Partial<CreateTaskRequest> & { version: number }; // version is REQUIRED for OCC

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

export type UpdateEventRequest = Partial<CreateEventRequest> & { version: number }; // version is REQUIRED for OCC

export interface UpdateUserRequest {
  email?: string;
  role?: 'USER' | 'ASSISTANT' | 'ADMIN'; // Backend expects UPPERCASE
  version: number; // Required for Optimistic Concurrency Control
}

export interface UserProfileResponse {
  success: boolean;
  user: ProfileUser;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
}
