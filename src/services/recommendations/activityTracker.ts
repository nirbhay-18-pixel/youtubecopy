/**
 * Activity Tracker - Tracks user watch history, searches, and interactions
 * Uses localStorage for persistence
 */

export interface WatchActivity {
  videoId: string;
  title: string;
  channelId: string;
  channelTitle: string;
  thumbnailUrl: string;
  duration: number; // in seconds
  watchTime: number; // in seconds
  completionPercentage: number; // 0-100
  tags: string[]; // extracted keywords
  timestamp: string;
}

export interface SearchActivity {
  query: string;
  timestamp: string;
}

export interface InteractionActivity {
  videoId: string;
  type: 'like' | 'save' | 'skip';
  timestamp: string;
}

const STORAGE_KEYS = {
  WATCH_HISTORY: 'streamnest-watch-activity',
  SEARCH_HISTORY: 'streamnest-search-activity',
  INTERACTIONS: 'streamnest-interactions',
};

// Get watch history
export function getWatchHistory(): WatchActivity[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.WATCH_HISTORY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// Save watch activity
export function saveWatchActivity(activity: WatchActivity): void {
  try {
    const history = getWatchHistory();
    
    // Remove existing entry for this video
    const filtered = history.filter(item => item.videoId !== activity.videoId);
    
    // Add new entry at the beginning
    const updated = [activity, ...filtered].slice(0, 100); // Keep last 100
    
    localStorage.setItem(STORAGE_KEYS.WATCH_HISTORY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save watch activity:', error);
  }
}

// Update watch progress (debounced)
export function updateWatchProgress(
  videoId: string,
  watchTime: number,
  duration: number
): void {
  try {
    const history = getWatchHistory();
    const existing = history.find(item => item.videoId === videoId);
    
    if (existing) {
      // Update watch time and completion
      existing.watchTime = Math.max(existing.watchTime, watchTime);
      existing.completionPercentage = duration > 0 
        ? Math.min(100, Math.round((watchTime / duration) * 100))
        : 0;
      existing.timestamp = new Date().toISOString();
      
      localStorage.setItem(STORAGE_KEYS.WATCH_HISTORY, JSON.stringify(history));
    }
  } catch (error) {
    console.error('Failed to update watch progress:', error);
  }
}

// Get search history
export function getSearchHistory(): SearchActivity[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// Save search query
export function saveSearchQuery(query: string): void {
  if (!query.trim()) return;
  
  try {
    const history = getSearchHistory();
    
    // Add new search at the beginning
    const updated = [
      { query: query.trim(), timestamp: new Date().toISOString() },
      ...history
    ].slice(0, 50); // Keep last 50 searches
    
    localStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save search query:', error);
  }
}

// Get interactions
export function getInteractions(): InteractionActivity[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.INTERACTIONS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// Save interaction
export function saveInteraction(videoId: string, type: 'like' | 'save' | 'skip'): void {
  try {
    const interactions = getInteractions();
    
    // Remove existing interaction for this video
    const filtered = interactions.filter(item => item.videoId !== videoId);
    
    // Add new interaction
    const updated = [
      { videoId, type, timestamp: new Date().toISOString() },
      ...filtered
    ].slice(0, 200); // Keep last 200 interactions
    
    localStorage.setItem(STORAGE_KEYS.INTERACTIONS, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save interaction:', error);
  }
}

// Clear all activity (for testing/privacy)
export function clearAllActivity(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.WATCH_HISTORY);
    localStorage.removeItem(STORAGE_KEYS.SEARCH_HISTORY);
    localStorage.removeItem(STORAGE_KEYS.INTERACTIONS);
  } catch (error) {
    console.error('Failed to clear activity:', error);
  }
}

// Extract keywords from title/description
export function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
    'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that',
    'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
    'what', 'which', 'who', 'when', 'where', 'why', 'how', 'all', 'each',
    'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no',
    'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just',
    'because', 'as', 'until', 'while', 'about', 'between', 'through',
    'during', 'before', 'after', 'above', 'below', 'up', 'down', 'out',
    'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here',
    'there', 'any', 'all', 'each', 'few', 'more', 'most', 'other', 'some',
    'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too',
    'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 'now'
  ]);
  
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Remove punctuation
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word))
    .slice(0, 10); // Keep top 10 keywords
}
