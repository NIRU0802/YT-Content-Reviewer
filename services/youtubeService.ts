import axios from 'axios';
import { extractVideoId } from '@/lib/utils';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

export interface YouTubeVideoData {
  videoId: string;
  title: string;
  description: string;
  channelName: string;
  comments: string[];
}

export async function fetchYouTubeVideoData(url: string): Promise<YouTubeVideoData> {
  const videoId = extractVideoId(url);
  if (!videoId) {
    throw new Error('Invalid YouTube URL');
  }

  if (!YOUTUBE_API_KEY) {
    throw new Error('YouTube API key not configured');
  }

  const videoResponse = await axios.get(`${YOUTUBE_API_BASE}/videos`, {
    params: {
      part: 'snippet',
      id: videoId,
      key: YOUTUBE_API_KEY,
    },
  });

  if (!videoResponse.data.items || videoResponse.data.items.length === 0) {
    throw new Error('Video not found');
  }

  const snippet = videoResponse.data.items[0].snippet;
  const title = snippet.title;
  const description = snippet.description;
  const channelName = snippet.channelTitle;

  const comments = await fetchVideoComments(videoId);

  return {
    videoId,
    title,
    description,
    channelName,
    comments,
  };
}

async function fetchVideoComments(videoId: string): Promise<string[]> {
  if (!YOUTUBE_API_KEY) {
    return [];
  }

  try {
    const response = await axios.get(`${YOUTUBE_API_BASE}/commentThreads`, {
      params: {
        part: 'snippet',
        videoId: videoId,
        key: YOUTUBE_API_KEY,
        maxResults: 20,
        order: 'relevance',
      },
    });

    if (!response.data.items) {
      return [];
    }

    return response.data.items
      .map((item: any) => item.snippet.topLevelComment.snippet.textDisplay)
      .filter((text: string) => text && text.trim().length > 0);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
}

export function isYouTubeConfigured(): boolean {
  return !!YOUTUBE_API_KEY;
}