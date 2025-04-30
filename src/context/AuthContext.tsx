import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useMemo,
} from 'react';
import {
  Session,
  SupabaseClient,
} from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { Database, User } from '@/types/supabase';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password?: string) => Promise<{error?: Error}>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, password?: string, fullName?: string) => Promise<{error?: Error}>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const login = async (email: string, password?: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password || 'default_password',
      });
      if (error) {
        throw error;
      }
      setUser(data.user);
      setSession(data.session);
      navigate('/home');
      return { error: undefined };
    } catch (error: any) {
      console.error('Login failed:', error.message);
      return { error };
    } finally {
      setLoading(false);
    }
  };
  
  // Updated Google login method with better error handling
  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });
      
      if (error) {
        console.error("Google login error:", error);
        toast({
          title: "Login failed",
          description: error.message || "Failed to login with Google",
          variant: "destructive"
        });
        throw error;
      }
      
      // No need to set anything here since the page will redirect
      // The auth state listener will handle the session update when it returns
    } catch (error: any) {
      console.error('Error logging in with Google:', error);
      toast({
        title: "Login failed",
        description: error?.message || "An unexpected error occurred during Google login",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      setUser(null);
      setSession(null);
      navigate('/');
    } catch (error: any) {
      console.error('Logout failed:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password?: string, fullName?: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password || 'default_password',
        options: {
          data: {
            name: fullName || email.split('@')[0],
          }
        }
      });
      
      if (error) {
        throw error;
      }
      
      setUser(data.user);
      setSession(data.session);
      navigate('/home');
      return { error: undefined };
    } catch (error: any) {
      console.error('Signup failed:', error.message);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  // Auth state listener - updated for better error handling
  useEffect(() => {
    console.log("Setting up auth state listener");
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event, session ? "Session exists" : "No session");
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );
    
    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Got existing session:", session ? "Session exists" : "No session");
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch(error => {
      console.error("Error getting session:", error);
      setLoading(false);
    });
    
    return () => subscription.unsubscribe();
  }, []);
  
  // Create a user profile if it doesn't exist after login
  useEffect(() => {
    const createProfileIfNeeded = async () => {
      if (user) {
        // Use setTimeout to avoid calling Supabase inside the auth state change callback
        setTimeout(async () => {
          try {
            // Check if profile exists
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .maybeSingle();
              
            if (profileError) {
              console.error('Error checking for profile:', profileError);
              return;
            }
            
            // If no profile exists, create one
            if (!profile) {
              const { error: insertError } = await supabase
                .from('profiles')
                .insert({
                  id: user.id,
                  name: user.user_metadata.name || user.user_metadata.full_name || user.email?.split('@')[0] || 'User',
                  avatar: user.user_metadata.avatar_url || user.user_metadata.picture || null
                });
                
              if (insertError) {
                console.error('Error creating profile:', insertError);
              } else {
                console.log('Created new user profile');
              }
            }
          } catch (error) {
            console.error('Error in profile creation:', error);
          }
        }, 0);
      }
    };
    
    createProfileIfNeeded();
  }, [user]);

  // Return the auth context value
  const value = useMemo(
    () => ({
      user,
      session,
      isAuthenticated: !!user,
      loading,
      login,
      loginWithGoogle,
      logout,
      signup,
    }),
    [user, session, loading]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export { useAuth, AuthProvider };
