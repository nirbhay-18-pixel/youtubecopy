/**
 * Interest Profile Builder - Calculates user interests from activity
 * Uses simple explainable scoring (no ML)
 */

import { 
  getWatchHistory, 
  getSearchHistory, 
  getInteractions, 
  extractKeywords,
  type WatchActivity 
} from './activityTracker';

export interface InterestProfile {
  [topic: string]: number; // topic -> score (0-1 normalized)
}

// Scoring weights (configurable)
const WEIGHTS = {
  COMPLETION_HIGH: 10,    // >= 80%
  COMPLETION_MEDIUM: 6,   // 50-79%
  COMPLETION_LOW: 2,      // 20-49%
  COMPLETION_SKIP: -2,    // < 20%
  SEARCH: 5,
  SAVED: 8,
  LIKED: 8,
  QUICK_SKIP: -3,
};

// Build interest profile from all activity
export function buildInterestProfile(): InterestProfile {
  const scores: { [topic: string]: number } = {};
  
  // 1. Process watch history
  const watchHistory = getWatchHistory();
  watchHistory.forEach(activity => {
    const keywords = activity.tags.length > 0 
      ? activity.tags 
      : extractKeywords(activity.title);
    
    // Determine score based on completion
    let watchScore = 0;
    if (activity.completionPercentage >= 80) {
      watchScore = WEIGHTS.COMPLETION_HIGH;
    } else if (activity.completionPercentage >= 50) {
      watchScore = WEIGHTS.COMPLETION_MEDIUM;
    } else if (activity.completionPercentage >= 20) {
      watchScore = WEIGHTS.COMPLETION_LOW;
    } else {
      watchScore = WEIGHTS.COMPLETION_SKIP;
    }
    
    // Apply score to all keywords
    keywords.forEach(keyword => {
      scores[keyword] = (scores[keyword] || 0) + watchScore;
    });
  });
  
  // 2. Process search history
  const searchHistory = getSearchHistory();
  searchHistory.forEach(search => {
    const keywords = extractKeywords(search.query);
    keywords.forEach(keyword => {
      scores[keyword] = (scores[keyword] || 0) + WEIGHTS.SEARCH;
    });
  });
  
  // 3. Process interactions
  const interactions = getInteractions();
  interactions.forEach(interaction => {
    // Find the watch activity for this video
    const activity = watchHistory.find(w => w.videoId === interaction.videoId);
    if (activity) {
      const keywords = activity.tags.length > 0 
        ? activity.tags 
        : extractKeywords(activity.title);
      
      let interactionScore = 0;
      if (interaction.type === 'like') {
        interactionScore = WEIGHTS.LIKED;
      } else if (interaction.type === 'save') {
        interactionScore = WEIGHTS.SAVED;
      } else if (interaction.type === 'skip') {
        interactionScore = WEIGHTS.QUICK_SKIP;
      }
      
      keywords.forEach(keyword => {
        scores[keyword] = (scores[keyword] || 0) + interactionScore;
      });
    }
  });
  
  // 4. Normalize scores to 0-1 range
  const maxScore = Math.max(...Object.values(scores), 1);
  const normalized: InterestProfile = {};
  
  Object.entries(scores).forEach(([topic, score]) => {
    normalized[topic] = Math.max(0, Math.min(1, score / maxScore));
  });
  
  return normalized;
}

// Get top interests
export function getTopInterests(profile: InterestProfile, limit = 10): string[] {
  return Object.entries(profile)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([topic]) => topic);
}

// Get interest score for a specific topic
export function getInterestScore(profile: InterestProfile, topic: string): number {
  return profile[topic] || 0;
}

// Check if user has enough activity for personalization
export function hasEnoughActivity(): boolean {
  const watchHistory = getWatchHistory();
  const searchHistory = getSearchHistory();
  
  // Need at least 3 watches or 2 searches
  return watchHistory.length >= 3 || searchHistory.length >= 2;
}

// Get frequently watched channels
export function getFrequentChannels(limit = 5): { channelId: string; channelTitle: string; count: number }[] {
  const watchHistory = getWatchHistory();
  const channelCounts: { [channelId: string]: { title: string; count: number } } = {};
  
  watchHistory.forEach(activity => {
    if (activity.channelId) {
      if (!channelCounts[activity.channelId]) {
        channelCounts[activity.channelId] = {
          title: activity.channelTitle,
          count: 0
        };
      }
      channelCounts[activity.channelId].count++;
    }
  });
  
  return Object.entries(channelCounts)
    .map(([channelId, data]) => ({
      channelId,
      channelTitle: data.title,
      count: data.count
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

// Get recently watched topics
export function getRecentTopics(limit = 5): string[] {
  const watchHistory = getWatchHistory();
  const recentTopics: string[] = [];
  
  // Get topics from last 10 watches
  watchHistory.slice(0, 10).forEach(activity => {
    const keywords = activity.tags.length > 0 
      ? activity.tags 
      : extractKeywords(activity.title);
    
    keywords.slice(0, 2).forEach(keyword => {
      if (!recentTopics.includes(keyword)) {
        recentTopics.push(keyword);
      }
    });
  });
  
  return recentTopics.slice(0, limit);
}

// Get videos with high completion (for recommendations)
export function getHighCompletionVideos(limit = 10): WatchActivity[] {
  const watchHistory = getWatchHistory();
  return watchHistory
    .filter(activity => activity.completionPercentage >= 70)
    .slice(0, limit);
}
