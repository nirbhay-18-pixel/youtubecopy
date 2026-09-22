/**
 * Format ISO-8601 duration to human-readable format
 * Examples:
 * PT4M32S → 4:32
 * PT18M7S → 18:07
 * PT1H2M35S → 1:02:35
 * PT45S → 0:45
 */
export function formatDuration(isoDuration: string): string {
  if (!isoDuration) return '';
  
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '0:00';
  
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');
  
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Format view count to human-readable format
 * Examples:
 * 1200 → 1.2K views
 * 12500 → 12.5K views
 * 1200000 → 1.2M views
 * 1200000000 → 1.2B views
 */
export function formatViewCount(count: string | number): string {
  const num = typeof count === 'string' ? parseInt(count) : count;
  if (isNaN(num)) return '0 views';
  
  if (num >= 1000000000) {
    return `${(num / 1000000000).toFixed(1)}B views`;
  }
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M views`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K views`;
  }
  return `${num} views`;
}

/**
 * Format published date to relative time
 * Examples:
 * today
 * 2 days ago
 * 3 weeks ago
 * 5 months ago
 * 2 years ago
 */
export function formatPublishedDate(dateString: string): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffYears > 0) return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`;
  if (diffMonths > 0) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
  if (diffWeeks > 0) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
  if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffMinutes > 0) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  return 'Just now';
}

/**
 * Calculate ISO 8601 date for upload date filters
 */
export function getPublishedAfterDate(filter: string): string | undefined {
  if (!filter || filter === 'any') return undefined;
  
  const now = new Date();
  let targetDate: Date;
  
  switch (filter) {
    case 'today':
      targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      targetDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      targetDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      targetDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      return undefined;
  }
  
  return targetDate.toISOString();
}
