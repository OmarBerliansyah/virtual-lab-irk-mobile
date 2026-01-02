import type { User } from '@/types/api';

// Mock Users for Testing
export const mockUsers: User[] = [
  {
    _id: 'user1',
    clerkId: 'clerk_user_123',
    email: 'student@example.com',
    role: 'user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'assistant1',
    clerkId: 'clerk_assistant_456',
    email: 'assistant@example.com',
    role: 'assistant',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'admin1',
    clerkId: 'clerk_admin_789',
    email: 'admin@example.com',
    role: 'admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Simple password for all mock accounts (for testing only)
export const MOCK_PASSWORD = 'password123';

// Mock Auth State
let currentUser: User | null = null;

export const mockAuth = {
  getCurrentUser: (): User | null => {
    return currentUser;
  },

  login: async (email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    if (password !== MOCK_PASSWORD) {
      return { success: false, error: 'Invalid password' };
    }

    const user = mockUsers.find(u => u.email === email);
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    currentUser = user;
    return { success: true, user };
  },

  logout: async (): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    currentUser = null;
  },

  isAuthenticated: (): boolean => {
    return currentUser !== null;
  },
};

