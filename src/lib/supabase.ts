
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// Re-export the client with our extended Database type and proper configuration
export const supabase = createClient<Database>(
  "https://bwrjdzldsehxkwdjfqhs.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3cmpkemxkc2VoeGt3ZGpmcWhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2MjE1MzQsImV4cCI6MjA2MTE5NzUzNH0.YLw0znm1puhX967Fl8PxjUc1lFXumWdHjfXuyB829jc",
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true, // Enable auto-detection of auth parameters in URL
      flowType: 'implicit' // Use implicit flow for OAuth redirects
    }
  }
);

// Helper function to get question count
export const getQuestionCount = (questions: any): number => {
  if (!questions) return 0;
  
  if (Array.isArray(questions)) {
    return questions.length;
  }
  
  if (typeof questions === 'string') {
    try {
      const parsed = JSON.parse(questions);
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch (e) {
      console.error('Error parsing questions:', e);
      return 0;
    }
  }
  
  // If questions is an object with length property
  if (typeof questions === 'object' && 'length' in questions) {
    return questions.length;
  }
  
  return 0;
};
