/**
 * Recommendation Engine - Generates personalized video recommendations
 * Uses YouTube Data API for candidates and custom scoring for ranking
 */

import { searchVideos, enrichSearchResults } from '../youtube/search';
import { getVideoDetails } from '../youtube/videos';
import { 
  buildInterestProfile, 
  getTopInterests, 
  getFrequentChannels, 
  getRecentTopics,
  getHighCompletionVideos,
  hasEnoughActivity,
  type InterestProfile 
} from './interestProfile';
import { getWatchHistory, extractKeywords, type WatchActivity } from './activityTracker';
import type { YouTubeVideo, YouTubeSearchResult } from '../../types/youtube';

type EnrichedVideo = YouTubeSearchResult & { _videoDetails?: YouTubeVideo };

// Recommendation scoring weights (configurable)
const SCORING_WEIGHTS = {
  TOPIC_SIMILARITY: 0.35,
  CHANNEL_AFFINITY: 0.15,
  SEARCH_INTEREST: 0.15,
  FRESHNESS: 0.10,
  POPULARITY: 0.05,
  COMPLETION_INTEREST: 0.10,
  EXPLORATION: 0.10,
};

export interface ScoredVideo {
  video: EnrichedVideo;
  score: number;
  reasons: string[]; // Human-readable reasons
}

export interface RecommendationResult {
  videos: ScoredVideo[];
  isPersonalized: boolean;
  generatedAt: string;
}

// Cache for recommendations
let cachedRecommendations: RecommendationResult | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Main recommendation function
 */
export async function getRecommendations(
  limit = 12,
  forceRefresh = false
): Promise<RecommendationResult> {
  // Check cache
  if (!forceRefresh && cachedRecommendations && 
      Date.now() - cacheTimestamp < CACHE_DURATION) {
    return cachedRecommendations;
  }

  const isPersonalized = hasEnoughActivity();
  
  if (!isPersonalized) {
    // Cold start: return popular/trending videos
    const result = await getColdStartRecommendations(limit);
    cachedRecommendations = result;
    cacheTimestamp = Date.now();
    return result;
  }

  // Build interest profile
  const profile = buildInterestProfile();
  const topInterests = getTopInterests(profile, 10);
  const frequentChannels = getFrequentChannels(5);
  const recentTopics = getRecentTopics(5);
  const highCompletionVideos = getHighCompletionVideos(5);
  
  // Generate candidates from multiple sources
  const candidates = await generateCandidates(
    topInterests,
    frequentChannels,
    recentTopics,
    highCompletionVideos
  );
  
  // Score candidates
  const scored = scoreCandidates(candidates, profile, {
    topInterests,
    frequentChannels,
    recentTopics,
    highCompletionVideos,
  });
  
  // Diversify and limit
  const diversified = diversifyRecommendations(scored, limit);
  
  const result: RecommendationResult = {
    videos: diversified,
    isPersonalized: true,
    generatedAt: new Date().toISOString(),
  };
  
  // Cache result
  cachedRecommendations = result;
  cacheTimestamp = Date.now();
  
  // Debug logging (development only)
  if (import.meta.env.DEV) {
    console.log('Recommendation generated:', {
      candidates: candidates.length,
      scored: scored.length,
      returned: diversified.length,
      topInterests: topInterests.slice(0, 5),
    });
  }
  
  return result;
}

/**
 * Cold start recommendations (no user history)
 */
async function getColdStartRecommendations(limit: number): Promise<RecommendationResult> {
  try {
    // Get popular videos
    const popular = await searchVideos({
      q: '',
      type: 'video',
      maxResults: limit,
      order: 'viewCount',
      videoEmbeddable: true,
    });
    
    const enriched = await enrichSearchResults(popular);
    
    const videos: ScoredVideo[] = enriched.items.map(item => ({
      video: item as EnrichedVideo,
      score: 0.5, // Neutral score
      reasons: ['Popular video'],
    }));
    
    return {
      videos,
      isPersonalized: false,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Failed to get cold start recommendations:', error);
    return {
      videos: [],
      isPersonalized: false,
      generatedAt: new Date().toISOString(),
    };
  }
}

/**
 * Generate candidate videos from multiple sources
 */
async function generateCandidates(
  topInterests: string[],
  frequentChannels: { channelId: string; channelTitle: string; count: number }[],
  recentTopics: string[],
  highCompletionVideos: WatchActivity[]
): Promise<EnrichedVideo[]> {
  const candidates: EnrichedVideo[] = [];
  const seenVideoIds = new Set<string>();
  
  // Source A: Search for top interests
  for (const interest of topInterests.slice(0, 3)) {
    try {
      const results = await searchVideos({
        q: interest,
        type: 'video',
        maxResults: 5,
        order: 'relevance',
        videoEmbeddable: true,
      });
      
      const enriched = await enrichSearchResults(results);
      enriched.items.forEach(item => {
        const videoId = item.id.videoId;
        if (videoId && !seenVideoIds.has(videoId)) {
          seenVideoIds.add(videoId);
          candidates.push(item as EnrichedVideo);
        }
      });
    } catch (error) {
      console.error(`Failed to search for interest: ${interest}`, error);
    }
  }
  
  // Source B: Videos from high-completion topics
  for (const activity of highCompletionVideos.slice(0, 2)) {
    try {
      const keywords = activity.tags.length > 0 
        ? activity.tags.slice(0, 2) 
        : extractKeywords(activity.title).slice(0, 2);
      
      const query = keywords.join(' ');
      const results = await searchVideos({
        q: query,
        type: 'video',
        maxResults: 3,
        order: 'relevance',
        videoEmbeddable: true,
      });
      
      const enriched = await enrichSearchResults(results);
      enriched.items.forEach(item => {
        const videoId = item.id.videoId;
        if (videoId && !seenVideoIds.has(videoId)) {
          seenVideoIds.add(videoId);
          candidates.push(item as EnrichedVideo);
        }
      });
    } catch (error) {
      console.error('Failed to search for high-completion topic', error);
    }
  }
  
  // Source C: Recent topics
  for (const topic of recentTopics.slice(0, 2)) {
    try {
      const results = await searchVideos({
        q: topic,
        type: 'video',
        maxResults: 3,
        order: 'date', // Fresh content
        videoEmbeddable: true,
      });
      
      const enriched = await enrichSearchResults(results);
      enriched.items.forEach(item => {
        const videoId = item.id.videoId;
        if (videoId && !seenVideoIds.has(videoId)) {
          seenVideoIds.add(videoId);
          candidates.push(item as EnrichedVideo);
        }
      });
    } catch (error) {
      console.error(`Failed to search for recent topic: ${topic}`, error);
    }
  }
  
  // Source D: Exploration (random popular videos)
  try {
    const exploration = await searchVideos({
      q: '',
      type: 'video',
      maxResults: 5,
      order: 'viewCount',
      videoEmbeddable: true,
    });
    
    const enriched = await enrichSearchResults(exploration);
    enriched.items.forEach(item => {
      const videoId = item.id.videoId;
      if (videoId && !seenVideoIds.has(videoId)) {
        seenVideoIds.add(videoId);
        candidates.push(item as EnrichedVideo);
      }
    });
  } catch (error) {
    console.error('Failed to get exploration candidates', error);
  }
  
  return candidates;
}

/**
 * Score candidate videos
 */
function scoreCandidates(
  candidates: EnrichedVideo[],
  profile: InterestProfile,
  context: {
    topInterests: string[];
    frequentChannels: { channelId: string; channelTitle: string; count: number }[];
    recentTopics: string[];
    highCompletionVideos: WatchActivity[];
  }
): ScoredVideo[] {
  const watchedVideoIds = new Set(getWatchHistory().map(w => w.videoId));
  
  return candidates.map(candidate => {
    const videoId = candidate.id.videoId || '';
    const details = candidate._videoDetails;
    
    // Skip already watched videos
    if (watchedVideoIds.has(videoId)) {
      return null;
    }
    
    const reasons: string[] = [];
    let score = 0;
    
    // 1. Topic similarity (35%)
    const title = candidate.snippet.title;
    const description = candidate.snippet.description;
    const keywords = extractKeywords(`${title} ${description}`);
    
    let topicScore = 0;
    keywords.forEach(keyword => {
      const interestScore = profile[keyword] || 0;
      topicScore += interestScore;
    });
    topicScore = Math.min(1, topicScore / 3); // Normalize
    
    if (topicScore > 0.5) {
      reasons.push('Related to your interests');
    }
    
    score += topicScore * SCORING_WEIGHTS.TOPIC_SIMILARITY;
    
    // 2. Channel affinity (15%)
    const channelId = candidate.snippet.channelId;
    const channelMatch = context.frequentChannels.find(c => c.channelId === channelId);
    let channelScore = 0;
    
    if (channelMatch) {
      channelScore = Math.min(1, channelMatch.count / 5);
      reasons.push(`Because you watch ${channelMatch.channelTitle}`);
    }
    
    score += channelScore * SCORING_WEIGHTS.CHANNEL_AFFINITY;
    
    // 3. Search interest (15%)
    const searchHistory = getWatchHistory(); // Using watch history keywords as proxy
    let searchScore = 0;
    
    context.topInterests.forEach(interest => {
      if (title.toLowerCase().includes(interest) || 
          description.toLowerCase().includes(interest)) {
        searchScore += 0.3;
      }
    });
    searchScore = Math.min(1, searchScore);
    
    score += searchScore * SCORING_WEIGHTS.SEARCH_INTEREST;
    
    // 4. Freshness (10%)
    const publishedAt = new Date(candidate.snippet.publishedAt);
    const daysSincePublished = (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60 * 24);
    let freshnessScore = 0;
    
    if (daysSincePublished < 7) {
      freshnessScore = 1;
    } else if (daysSincePublished < 30) {
      freshnessScore = 0.7;
    } else if (daysSincePublished < 90) {
      freshnessScore = 0.4;
    } else {
      freshnessScore = 0.2;
    }
    
    score += freshnessScore * SCORING_WEIGHTS.FRESHNESS;
    
    // 5. Popularity (5%)
    const viewCount = details?.statistics?.viewCount 
      ? parseInt(details.statistics.viewCount) 
      : 0;
    let popularityScore = 0;
    
    if (viewCount > 1000000) {
      popularityScore = 1;
    } else if (viewCount > 100000) {
      popularityScore = 0.7;
    } else if (viewCount > 10000) {
      popularityScore = 0.4;
    } else {
      popularityScore = 0.2;
    }
    
    score += popularityScore * SCORING_WEIGHTS.POPULARITY;
    
    // 6. Completion interest (10%)
    const highCompletionTopics = context.highCompletionVideos.flatMap(v => 
      v.tags.length > 0 ? v.tags : extractKeywords(v.title)
    );
    
    let completionScore = 0;
    keywords.forEach(keyword => {
      if (highCompletionTopics.includes(keyword)) {
        completionScore += 0.3;
      }
    });
    completionScore = Math.min(1, completionScore);
    
    if (completionScore > 0.5) {
      reasons.push('Similar to videos you completed');
    }
    
    score += completionScore * SCORING_WEIGHTS.COMPLETION_INTEREST;
    
    // 7. Exploration (10%) - slight boost for diversity
    const explorationScore = 0.3; // Base exploration score
    score += explorationScore * SCORING_WEIGHTS.EXPLORATION;
    
    // Add generic reason if no specific reasons
    if (reasons.length === 0) {
      reasons.push('Recommended for you');
    }
    
    return {
      video: candidate,
      score,
      reasons,
    };
  }).filter((item): item is ScoredVideo => item !== null)
    .sort((a, b) => b.score - a.score);
}

/**
 * Diversify recommendations to avoid repetition
 */
function diversifyRecommendations(
  scored: ScoredVideo[],
  limit: number
): ScoredVideo[] {
  const result: ScoredVideo[] = [];
  const channelCount: { [channelId: string]: number } = {};
  const maxPerChannel = 2; // Max 2 videos from same channel
  
  for (const item of scored) {
    if (result.length >= limit) break;
    
    const channelId = item.video.snippet.channelId;
    const count = channelCount[channelId] || 0;
    
    if (count < maxPerChannel) {
      result.push(item);
      channelCount[channelId] = count + 1;
    }
  }
  
  return result;
}

/**
 * Get recommendation explanation for a video
 */
export function getRecommendationReason(video: ScoredVideo): string {
  return video.reasons[0] || 'Recommended for you';
}

/**
 * Clear recommendation cache
 */
export function clearRecommendationCache(): void {
  cachedRecommendations = null;
  cacheTimestamp = 0;
}
