import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'your-supabase-url';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-supabase-anon-key';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth helper functions
export const auth = {
  // Sign up
  signUp: async (email, password, userData) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    });
    return { data, error };
  },

  // Sign in
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  },

  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Get current user
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  // Get session
  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  },

  // Reset password
  resetPassword: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    return { error };
  },

  // Update password
  updatePassword: async (password) => {
    const { error } = await supabase.auth.updateUser({
      password: password
    });
    return { error };
  }
};

// Database helper functions
export const db = {
  // Get user profile
  getUserProfile: async (userId) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    return { data, error };
  },

  // Update user profile
  updateUserProfile: async (userId, updates) => {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    return { data, error };
  },

  // Get quizzes
  getQuizzes: async (filters = {}) => {
    let query = supabase
      .from('quizzes')
      .select('*')
      .eq('is_active', true);

    if (filters.category) {
      query = query.eq('category_id', filters.category);
    }
    if (filters.difficulty) {
      query = query.eq('difficulty', filters.difficulty);
    }
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query.order('created_at', { ascending: true });
    return { data, error };
  },

  // Get quiz categories
  getQuizCategories: async () => {
    const { data, error } = await supabase
      .from('quiz_categories')
      .select('*')
      .order('name');
    return { data, error };
  },

  // Submit quiz score
  submitQuizScore: async (scoreData) => {
    const { data, error } = await supabase
      .from('quiz_scores')
      .insert(scoreData)
      .select()
      .single();
    return { data, error };
  },

  // Get user quiz scores
  getUserQuizScores: async (userId) => {
    const { data, error } = await supabase
      .from('quiz_scores')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  // Get leaderboard
  getLeaderboard: async (limit = 10) => {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, points, level, streak, avatar')
      .order('points', { ascending: false })
      .limit(limit);
    return { data, error };
  },

  // Get user badges
  getUserBadges: async (userId) => {
    return { data: [], error: null };
  }
};

export default supabase;
