/**
 * API Switch Helper
 * 
 * This file automatically uses Supabase API if configured,
 * otherwise falls back to mock API for development.
 */

import { mockApi } from './mockApi';
import { supabase } from './supabase';
import { supabaseApi } from './supabaseApi';

// Use real API if Supabase is configured, otherwise use mock
export const api = supabase ? supabaseApi : mockApi;

// Export both for gradual migration
export { mockApi, supabaseApi };
