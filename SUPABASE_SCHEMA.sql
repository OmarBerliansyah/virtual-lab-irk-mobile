-- Virtual Lab IRK Mobile - Supabase Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (synced with Clerk)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'assistant', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  start TIMESTAMP WITH TIME ZONE NOT NULL,
  "end" TIMESTAMP WITH TIME ZONE,
  course TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deadline', 'release', 'assessment', 'highlight')),
  description TEXT,
  photo_url TEXT,
  link_attachments JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'To Do' CHECK (status IN ('To Do', 'In Progress', 'Done')),
  due_date TIMESTAMP WITH TIME ZONE,
  assignee TEXT, -- student email
  tags TEXT[] DEFAULT '{}',
  assigned_to TEXT[] DEFAULT '{}', -- array of student emails for auto-assigned tasks
  completed_by TEXT[] DEFAULT '{}', -- array of student emails who completed
  is_assistant_task BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_course ON events(course);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee);
CREATE INDEX IF NOT EXISTS idx_tasks_is_assistant_task ON tasks(is_assistant_task);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
-- Note: These policies assume you're using Clerk JWT tokens
-- You may need to adjust based on your authentication setup

-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (true); -- Simplified for now - adjust based on your auth setup

-- Admins can view all users
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (true); -- Simplified - check role in application layer

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (true); -- Simplified - check in application layer

-- RLS Policies for events
-- Anyone can view events
CREATE POLICY "Anyone can view events"
  ON events FOR SELECT
  USING (true);

-- Admins can manage events
CREATE POLICY "Admins can manage events"
  ON events FOR ALL
  USING (true); -- Simplified - check role in application layer

-- RLS Policies for tasks
-- Users can view their assigned tasks
CREATE POLICY "Users can view assigned tasks"
  ON tasks FOR SELECT
  USING (true); -- Simplified - filter in application layer

-- Assistants and Admins can view all tasks
CREATE POLICY "Assistants can view all tasks"
  ON tasks FOR SELECT
  USING (true); -- Simplified - check role in application layer

-- Assistants and Admins can manage tasks
CREATE POLICY "Assistants can manage tasks"
  ON tasks FOR ALL
  USING (true); -- Simplified - check role in application layer

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at 
  BEFORE UPDATE ON events
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at 
  BEFORE UPDATE ON tasks
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

