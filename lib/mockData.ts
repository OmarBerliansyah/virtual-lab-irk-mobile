import type { Event, Task, User } from '@/types/api';

// Mock Events Data
export const mockEvents: Event[] = [
  {
    _id: '1',
    title: 'Final Project Submission',
    start: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    course: 'IF2211',
    type: 'deadline',
    description: 'Submit your final project for Strategi Algoritma',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: '2',
    title: 'Midterm Exam Release',
    start: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    course: 'IF2120',
    type: 'release',
    description: 'Midterm exam results will be released',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: '3',
    title: 'Lab Assignment 5',
    start: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    course: 'IF2123',
    type: 'assessment',
    description: 'Complete Lab Assignment 5 on Linear Algebra',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: '4',
    title: 'Research Paper Published',
    start: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    course: 'IF2224',
    type: 'highlight',
    description: 'Congratulations! Our research paper on Automata Theory has been published in a top-tier journal.',
    photoUrl: 'https://images.unsplash.com/photo-1532619675605-1ede6c002ed6?w=800&q=80',
    linkAttachments: [
      {
        title: 'View Paper',
        url: 'https://example.com/paper',
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: '5',
    title: 'Workshop: Advanced Algorithms',
    start: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    course: 'IF2211',
    type: 'highlight',
    description: 'Join us for an advanced algorithms workshop covering dynamic programming and graph algorithms.',
    photoUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85b504d1?w=800&q=80',
    linkAttachments: [
      {
        title: 'Register Here',
        url: 'https://example.com/workshop',
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Mock User Data
export const mockUser: User = {
  _id: 'user1',
  clerkId: 'clerk_user_123',
  email: 'student@example.com',
  role: 'user',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Mock Tasks Data
export const mockTasks: Task[] = [
  {
    _id: 'task1',
    title: 'Review Pathfinding Algorithms',
    description: 'Study BFS, DFS, and A* algorithms for upcoming exam',
    priority: 'high',
    status: 'In Progress',
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    assignee: 'student@example.com',
    tags: ['algorithms', 'study'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'task2',
    title: 'Complete Regex Assignment',
    description: 'Finish the regex pattern matching exercises',
    priority: 'medium',
    status: 'To Do',
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    assignee: 'student@example.com',
    tags: ['regex', 'homework'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Mock Courses
export const mockCourses = [
  { code: 'IF1220', name: 'Matematika Diskrit' },
  { code: 'IF2120', name: 'Probabilitas dan Statistik' },
  { code: 'IF2123', name: 'Aljabar Linear dan Geometri' },
  { code: 'IF2211', name: 'Strategi Algoritma' },
  { code: 'IF2224', name: 'Teori Bahasa Formal dan Otomata' },
];

