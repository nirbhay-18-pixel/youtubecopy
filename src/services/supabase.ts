import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Only create client if credentials are available
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export function isSupabaseConfigured(): boolean {
  return supabase !== null;
}

// Bookmark operations
export async function getUserBookmarks(userId: string) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('bookmarks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function addBookmark(userId: string, bookmark: {
  video_id: string;
  title: string;
  channel_title?: string;
  thumbnail_url?: string;
  playlist?: string;
}) {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('bookmarks')
    .insert({ user_id: userId, ...bookmark })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function removeBookmark(userId: string, videoId: string) {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase
    .from('bookmarks')
    .delete()
    .eq('user_id', userId)
    .eq('video_id', videoId);
  
  if (error) throw error;
}

// Playlist operations
export async function getUserPlaylists(userId: string) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('local_playlists')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function createPlaylist(userId: string, name: string, description?: string) {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('local_playlists')
    .insert({ user_id: userId, name, description })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deletePlaylist(userId: string, playlistId: string) {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase
    .from('local_playlists')
    .delete()
    .eq('user_id', userId)
    .eq('id', playlistId);
  
  if (error) throw error;
}

// Preferences operations
export async function getUserPreferences(userId: string) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateUserPreferences(userId: string, preferences: Record<string, unknown>) {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('user_preferences')
    .update({ ...preferences, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}
