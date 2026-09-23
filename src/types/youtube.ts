// YouTube API Types
export interface YouTubeThumbnail {
  url: string;
  width: number;
  height: number;
}

export interface YouTubeThumbnails {
  default?: YouTubeThumbnail;
  medium?: YouTubeThumbnail;
  high?: YouTubeThumbnail;
  standard?: YouTubeThumbnail;
  maxres?: YouTubeThumbnail;
}

export interface YouTubeChannelSnippet {
  title: string;
  description: string;
  customUrl?: string;
  publishedAt: string;
  thumbnails: YouTubeThumbnails;
  country?: string;
}

export interface YouTubeChannel {
  id: string;
  snippet: YouTubeChannelSnippet;
  statistics?: {
    viewCount: string;
    subscriberCount: string;
    videoCount: string;
  };
  brandingSettings?: {
    image?: {
      bannerExternalUrl?: string;
    };
  };
}

export interface YouTubeVideoSnippet {
  title: string;
  description: string;
  channelTitle: string;
  channelId: string;
  publishedAt: string;
  thumbnails: YouTubeThumbnails;
  categoryId?: string;
  tags?: string[];
  liveBroadcastContent?: string;
}

export interface YouTubeVideo {
  id: string;
  snippet: YouTubeVideoSnippet;
  contentDetails?: {
    duration: string;
    dimension: string;
    definition: string;
    caption: string;
  };
  statistics?: {
    viewCount: string;
    likeCount: string;
    commentCount: string;
  };
  status?: {
    uploadStatus: string;
    privacyStatus: string;
  };
}

export interface YouTubeSearchResult {
  id: {
    kind: string;
    videoId?: string;
    channelId?: string;
    playlistId?: string;
  };
  snippet: {
    title: string;
    description: string;
    channelTitle: string;
    channelId: string;
    publishedAt: string;
    thumbnails: YouTubeThumbnails;
    liveBroadcastContent?: string;
  };
}

export interface YouTubeComment {
  id: string;
  snippet: {
    topLevelComment: {
      snippet: {
        authorDisplayName: string;
        authorProfileImageUrl: string;
        textDisplay: string;
        publishedAt: string;
        likeCount: number;
        totalReplyCount: number;
      };
    };
    canReply: boolean;
    totalReplyCount: number;
    isPublic: boolean;
  };
  replies?: {
    comments: YouTubeCommentReply[];
  };
}

export interface YouTubeCommentReply {
  id: string;
  snippet: {
    authorDisplayName: string;
    authorProfileImageUrl: string;
    textDisplay: string;
    publishedAt: string;
    likeCount: number;
    parentId: string;
  };
}

export interface YouTubePlaylist {
  id: string;
  snippet: {
    title: string;
    description: string;
    channelTitle: string;
    channelId: string;
    publishedAt: string;
    thumbnails: YouTubeThumbnails;
  };
  contentDetails?: {
    itemCount: number;
  };
}

export interface YouTubePlaylistItem {
  id: string;
  snippet: {
    title: string;
    description: string;
    position: number;
    resourceId: {
      videoId: string;
    };
    thumbnails: YouTubeThumbnails;
    channelTitle: string;
    channelId: string;
    publishedAt: string;
  };
  contentDetails?: {
    videoId: string;
    videoPublishedAt: string;
  };
}

export interface YouTubeApiResponse<T> {
  kind: string;
  etag: string;
  nextPageToken?: string;
  prevPageToken?: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
  items: T[];
}

// Application types
export interface Bookmark {
  id: string;
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  duration?: string;
  addedAt: string;
  playlist?: string;
}

export interface WatchHistoryItem {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  watchedAt: string;
}

export interface LocalPlaylist {
  id: string;
  name: string;
  description?: string;
  videoIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  autoplay: boolean;
  captions: boolean;
}

export type CategoryFilter = 
  | 'All' | 'Music' | 'Gaming' | 'Education' | 'Programming' 
  | 'Technology' | 'Sports' | 'News' | 'Entertainment' | 'Live';

export interface SearchFilters {
  order?: 'relevance' | 'date' | 'viewCount' | 'rating';
  type?: 'video' | 'channel' | 'playlist';
  publishedAfter?: string;
  videoDuration?: 'short' | 'medium' | 'long' | 'any';
}
