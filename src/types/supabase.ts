
import { Database as GeneratedDatabase } from "@/integrations/supabase/types";
import { User as SupabaseUser } from '@supabase/supabase-js';

// Extend the generated Database type with our actual tables
export interface Database extends GeneratedDatabase {}

// Extend the Supabase User type to include additional properties
export interface User extends SupabaseUser {
  name?: string;
  role?: string;
  avatar?: string;
}

// Export types from our extended Database
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
