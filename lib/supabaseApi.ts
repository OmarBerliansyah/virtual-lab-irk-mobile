import type {
  CreateEventRequest,
  CreateTaskRequest,
  Event,
  Task,
  UpdateEventRequest,
  UpdateTaskRequest,
  User,
} from '@/types/api';
import { supabase } from './supabase';

// Helper to map Supabase data to our types
const mapEvent = (data: any): Event => ({
  _id: data.id,
  title: data.title,
  start: data.start,
  end: data.end,
  course: data.course,
  type: data.type,
  description: data.description,
  photoUrl: data.photo_url,
  linkAttachments: data.link_attachments,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
});

const mapTask = (data: any): Task => ({
  _id: data.id,
  title: data.title,
  description: data.description,
  priority: data.priority,
  status: data.status,
  dueDate: data.due_date,
  assignee: data.assignee,
  tags: data.tags || [],
  completedBy: data.completed_by || [],
  assignedTo: data.assigned_to || [],
  isAssistantTask: data.is_assistant_task || false,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
});

const mapUser = (data: any): User => ({
  _id: data.id,
  clerkId: data.clerk_id,
  email: data.email,
  role: data.role,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
});

export const supabaseApi = {
  // Users
  getProfile: async (clerkId?: string): Promise<{ success: boolean; user: User }> => {
    if (!supabase) throw new Error('Supabase not configured');
    if (!clerkId) throw new Error('Clerk ID required');

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', clerkId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('User not found');
      }
      throw error;
    }
    return { success: true, user: mapUser(data) };
  },

  updateProfile: async (clerkId: string | undefined, data: Partial<User>): Promise<{ success: boolean; user: User }> => {
    if (!supabase) throw new Error('Supabase not configured');
    if (!clerkId) throw new Error('Clerk ID required');

    const updateData: any = {};
    if (data.email) updateData.email = data.email;
    if (data.role) updateData.role = data.role;

    const { data: updated, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('clerk_id', clerkId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, user: mapUser(updated) };
  },
  
  updateRole: async (clerkId: string | undefined, role: 'user' | 'assistant' | 'admin'): Promise<{ success: boolean; user: User }> => {
    return supabaseApi.updateProfile(clerkId, { role });
  },

  createUser: async (user: { clerkId: string; email: string; role: 'user' | 'assistant' | 'admin' }): Promise<User> => {
    if (!supabase) throw new Error('Supabase not configured');

    const { data, error } = await supabase
      .from('users')
      .insert({
        clerk_id: user.clerkId,
        email: user.email,
        role: user.role,
      })
      .select()
      .single();

    if (error) throw error;
    return mapUser(data);
  },

  getUsers: async (): Promise<User[]> => {
    if (!supabase) throw new Error('Supabase not configured');

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapUser);
  },

  updateUser: async (id: string, data: Partial<User>): Promise<User> => {
    if (!supabase) throw new Error('Supabase not configured');

    const updateData: any = {};
    if (data.email) updateData.email = data.email;
    if (data.role) updateData.role = data.role;

    const { data: updated, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return mapUser(updated);
  },

  deleteUser: async (id: string): Promise<void> => {
    if (!supabase) throw new Error('Supabase not configured');

    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw error;
  },

  // Events
  getEvents: async (course?: string): Promise<Event[]> => {
    if (!supabase) throw new Error('Supabase not configured');

    let query = supabase.from('events').select('*');

    if (course && course !== 'all') {
      query = query.eq('course', course);
    }

    const { data, error } = await query.order('start', { ascending: true });
    if (error) throw error;
    return (data || []).map(mapEvent);
  },

  createEvent: async (event: CreateEventRequest): Promise<Event> => {
    if (!supabase) throw new Error('Supabase not configured');

    const { data, error } = await supabase
      .from('events')
      .insert({
        title: event.title,
        start: event.start,
        end: event.end,
        course: event.course,
        type: event.type,
        description: event.description,
        photo_url: event.photoUrl,
        link_attachments: event.linkAttachments,
      })
      .select()
      .single();

    if (error) throw error;
    return mapEvent(data);
  },

  updateEvent: async (id: string, event: UpdateEventRequest): Promise<Event> => {
    if (!supabase) throw new Error('Supabase not configured');

    const updateData: any = {};
    if (event.title) updateData.title = event.title;
    if (event.start) updateData.start = event.start;
    if (event.end !== undefined) updateData.end = event.end;
    if (event.course) updateData.course = event.course;
    if (event.type) updateData.type = event.type;
    if (event.description !== undefined) updateData.description = event.description;
    if (event.photoUrl !== undefined) updateData.photo_url = event.photoUrl;
    if (event.linkAttachments) updateData.link_attachments = event.linkAttachments;

    const { data, error } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return mapEvent(data);
  },

  deleteEvent: async (id: string): Promise<void> => {
    if (!supabase) throw new Error('Supabase not configured');

    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) throw error;
  },

  // Tasks
  getTasks: async (assignee?: string, isAssistantTask?: boolean): Promise<Task[]> => {
    if (!supabase) throw new Error('Supabase not configured');

    let query = supabase.from('tasks').select('*');

    if (isAssistantTask !== undefined) {
      query = query.eq('is_assistant_task', isAssistantTask);
    }

    if (assignee) {
      // Check if assignee is in assignee field or assigned_to array
      query = query.or(`assignee.eq.${assignee},assigned_to.cs.{${assignee}}`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapTask);
  },

  getTaskById: async (id: string): Promise<Task | undefined> => {
    if (!supabase) throw new Error('Supabase not configured');

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return undefined; // Not found
      throw error;
    }
    return mapTask(data);
  },

  createTask: async (task: CreateTaskRequest & { isAssistantTask?: boolean; assignedTo?: string[] }): Promise<Task> => {
    if (!supabase) throw new Error('Supabase not configured');

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        title: task.title,
        description: task.description || '',
        priority: task.priority || 'medium',
        status: task.status || 'To Do',
        due_date: task.dueDate,
        assignee: task.assignee,
        tags: task.tags || [],
        assigned_to: task.assignedTo || [],
        completed_by: [],
        is_assistant_task: task.isAssistantTask || false,
      })
      .select()
      .single();

    if (error) throw error;
    return mapTask(data);
  },

  updateTask: async (id: string, task: UpdateTaskRequest): Promise<Task> => {
    if (!supabase) throw new Error('Supabase not configured');

    const updateData: any = {};
    if (task.title) updateData.title = task.title;
    if (task.description !== undefined) updateData.description = task.description;
    if (task.priority) updateData.priority = task.priority;
    if (task.status) updateData.status = task.status;
    if (task.dueDate !== undefined) updateData.due_date = task.dueDate;
    if (task.assignee !== undefined) updateData.assignee = task.assignee;
    if (task.tags) updateData.tags = task.tags;

    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return mapTask(data);
  },

  deleteTask: async (id: string): Promise<void> => {
    if (!supabase) throw new Error('Supabase not configured');

    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;
  },

  markTaskCompleted: async (taskId: string, studentEmail: string): Promise<Task> => {
    if (!supabase) throw new Error('Supabase not configured');

    // Get current task
    const { data: task, error: fetchError } = await supabase
      .from('tasks')
      .select('completed_by')
      .eq('id', taskId)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') throw new Error('Task not found');
      throw fetchError;
    }

    const completedBy = task.completed_by || [];
    if (!completedBy.includes(studentEmail)) {
      completedBy.push(studentEmail);
    }

    const { data, error } = await supabase
      .from('tasks')
      .update({ completed_by: completedBy })
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;
    return mapTask(data);
  },
};

