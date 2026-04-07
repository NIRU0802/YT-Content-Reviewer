export function generateId(): string {
  return crypto.randomUUID();
}

export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function isValidYouTubeUrl(url: string): boolean {
  return extractVideoId(url) !== null;
}

export function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`;
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function sanitizeText(text: string): string {
  return text
    .replace(/[<>]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

export function getRiskLevelColor(level: string): string {
  const colors: Record<string, string> = {
    Low: '#10B981',
    Medium: '#F59E0B',
    High: '#F97316',
    CRITICAL: '#EF4444',
  };
  return colors[level] || '#94A3B8';
}

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    'Hate Speech': '#EF4444',
    Spam: '#F59E0B',
    Violence: '#DC2626',
    Safe: '#10B981',
  };
  return colors[category] || '#94A3B8';
}

export function getActionColor(action: string): string {
  const colors: Record<string, string> = {
    Allow: '#10B981',
    Review: '#F59E0B',
    Remove: '#EF4444',
    Escalate: '#DC2626',
  };
  return colors[action] || '#94A3B8';
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}