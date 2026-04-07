import { NextRequest, NextResponse } from 'next/server';
import { extractVideoId, sanitizeText, isValidYouTubeUrl } from '@/lib/utils';
import { getCachedResult, saveResult, CachedAnalysis } from '@/lib/sheetdbService';
import { 
  decideAnalysisMethod, 
  keywordFallbackAnalysis, 
  callGeminiWithTimeout, 
  buildGeminiPrompt,
  getGeminiUsage 
} from '@/lib/aiDecisionEngine';
import { checkRateLimit } from '@/lib/rateLimiter';
import { generateVideoHash, generateHash } from '@/lib/hashUtil';
import { log, LogType, LogLevel } from '@/lib/logger';
import { insertVideo, insertAnalysis } from '@/lib/db';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';
const YOUTUBE_TIMEOUT_MS = 8000;

const MAX_INPUT_LENGTH = 2000;

async function saveToSupabase(
  url: string,
  videoId: string,
  title: string,
  channelName: string,
  description: string,
  comments: string[],
  analysis: {
    category: string;
    riskScore: number;
    riskLevel: string;
    decision: string;
    explanation: string;
  }
) {
  console.log('[DB] Saving to Supabase:', { videoId, title, category: analysis.category, riskScore: analysis.riskScore });
  
  const video = await insertVideo({
    url,
    video_id: videoId,
    title,
    description: description || null,
    channel_name: channelName,
    comments,
  });
  
  console.log('[DB] Video inserted:', video.id);
  
  await insertAnalysis({
    video_id: video.id,
    category: analysis.category as any,
    confidence: analysis.riskScore / 100,
    risk_score: analysis.riskScore,
    risk_level: analysis.riskLevel as any,
    action: analysis.decision as any,
    reason: analysis.explanation,
    red_zone: analysis.riskScore >= 80,
  });
  
  console.log('[DB] Analysis inserted for video:', video.id);
  
  return video;
}

interface YouTubeVideoData {
  videoId: string;
  title: string;
  description: string;
  channelName: string;
  comments: string[];
}

async function fetchYouTubeVideoData(url: string): Promise<YouTubeVideoData> {
  const videoId = extractVideoId(url);
  if (!videoId) {
    throw new Error('Invalid YouTube URL');
  }

  if (!YOUTUBE_API_KEY) {
    throw new Error('YouTube API key not configured');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), YOUTUBE_TIMEOUT_MS);

  try {
    const videoResponse = await fetch(
      `${YOUTUBE_API_BASE}/videos?part=snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`,
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    if (!videoResponse.ok) {
      throw new Error(`YouTube API error: ${videoResponse.status}`);
    }

    const videoData = await videoResponse.json();
    
    if (!videoData.items || videoData.items.length === 0) {
      throw new Error('Video not found');
    }

    const snippet = videoData.items[0].snippet;
    const title = snippet.title;
    const description = snippet.description;
    const channelName = snippet.channelTitle;

    const comments = await fetchVideoComments(videoId);

    return { videoId, title, description, channelName, comments };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('YouTube API timeout');
    }
    throw error;
  }
}

async function fetchVideoComments(videoId: string): Promise<string[]> {
  if (!YOUTUBE_API_KEY) {
    return [];
  }

  try {
    const response = await fetch(
      `${YOUTUBE_API_BASE}/commentThreads?part=snippet&videoId=${videoId}&key=${YOUTUBE_API_KEY}&maxResults=20&order=relevance`
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    
    if (!data.items) {
      return [];
    }

    return data.items
      .map((item: any) => item.snippet.topLevelComment.snippet.textDisplay)
      .filter((text: string) => text && text.trim().length > 0);
  } catch (error) {
    return [];
  }
}

function isSimpleInput(text: string): boolean {
  return text.length < 100;
}

export async function POST(request: NextRequest) {
  const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                   request.headers.get('x-real-ip') || 
                   'unknown';

  log(LogType.REQUEST, 'Analyze request received', LogLevel.INFO, { ip: clientIP });

  if (!checkRateLimit(clientIP)) {
    return NextResponse.json(
      { success: false, error: 'Rate limit exceeded. Please try again later.' },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { success: false, error: 'URL is required' },
        { status: 400 }
      );
    }

    if (url.length > MAX_INPUT_LENGTH) {
      return NextResponse.json(
        { success: false, error: `URL exceeds maximum length of ${MAX_INPUT_LENGTH}` },
        { status: 400 }
      );
    }

    if (!isValidYouTubeUrl(url)) {
      return NextResponse.json(
        { success: false, error: 'Invalid YouTube URL format' },
        { status: 400 }
      );
    }

    const videoId = extractVideoId(url)!;
    const hash = generateHash(videoId);

    log(LogType.CACHE_MISS, 'Checking cache', LogLevel.INFO, { videoId, hash });

    const cached = await getCachedResult(videoId);
    
    if (cached) {
      log(LogType.CACHE_HIT, 'Cache hit - returning cached result', LogLevel.INFO, { videoId });
      
      // Check if exists in Supabase, if not save it
      try {
        await saveToSupabase(url, videoId, cached.title, cached.title.split(' - ')[0] || 'Unknown', '', [], {
          category: cached.analysis,
          riskScore: cached.score,
          riskLevel: cached.score >= 80 ? 'CRITICAL' : cached.score >= 50 ? 'High' : cached.score >= 25 ? 'Medium' : 'Low',
          decision: cached.decision,
          explanation: cached.analysis,
        });
        log(LogType.CACHE_MISS, 'Cached result synced to Supabase', LogLevel.INFO, { videoId });
      } catch (dbError: any) {
        log(LogType.ERROR, 'Failed to sync cached result to Supabase', LogLevel.ERROR, { error: dbError.message });
      }
      
      return NextResponse.json({
        success: true,
        cached: true,
        video: {
          id: cached.videoId,
          title: cached.title,
          channel_name: cached.title.split(' - ')[0] || 'Unknown',
          url: url,
        },
        analysis: {
          category: cached.analysis,
          risk_score: cached.score,
          risk_level: cached.score >= 80 ? 'CRITICAL' : cached.score >= 50 ? 'High' : cached.score >= 25 ? 'Medium' : 'Low',
          action: cached.decision,
          reason: cached.analysis,
          red_zone: cached.score >= 80,
        },
        explanation: `Cached result from ${cached.createdAt}`,
        redZone: {
          red_zone: cached.score >= 80,
          priority_reason: cached.score >= 80 ? 'Critical content detected' : '',
        },
        method: 'cache',
      });
    }

    log(LogType.CACHE_MISS, 'Cache miss - processing video', LogLevel.INFO, { videoId });

    let videoData: YouTubeVideoData;
    try {
      videoData = await fetchYouTubeVideoData(url);
    } catch (error: any) {
      log(LogType.ERROR, 'YouTube API error', LogLevel.ERROR, { error: error.message });
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to fetch video data from YouTube' },
        { status: 502 }
      );
    }

    const combinedText = `${videoData.title} ${videoData.description} ${videoData.comments.join(' ')}`;
    const decision = decideAnalysisMethod(combinedText);

    let result: any;

    if (decision.useAI) {
      log(LogType.GEMINI_USED, 'Using Gemini for analysis', LogLevel.INFO);
      
      const prompt = buildGeminiPrompt(
        videoData.title,
        videoData.description,
        videoData.comments
      );

      try {
        result = await callGeminiWithTimeout(prompt);
      } catch (error: any) {
        log(LogType.ERROR, 'Gemini error, falling back to keyword', LogLevel.ERROR, { error: error.message });
        result = keywordFallbackAnalysis(
          videoData.title,
          videoData.description,
          videoData.comments
        );
      }
    } else {
      log(LogType.GEMINI_SKIPPED, 'Using keyword fallback', LogLevel.INFO, { reason: decision.reason });
      
      result = keywordFallbackAnalysis(
        videoData.title,
        videoData.description,
        videoData.comments
      );
    }

    const videoHash = generateVideoHash(videoId, videoData.title, videoData.description);

    const cacheData: CachedAnalysis = {
      videoId: videoId,
      hash: videoHash,
      title: sanitizeText(videoData.title),
      analysis: result.category,
      score: result.riskScore,
      decision: result.decision,
      createdAt: new Date().toISOString(),
    };

    await saveResult(cacheData);

    log(LogType.CACHE_MISS, 'Result saved to cache', LogLevel.INFO, { videoId });

    // Save to Supabase for dashboard/review
    try {
      await saveToSupabase(
        url,
        videoId,
        videoData.title,
        videoData.channelName,
        videoData.description,
        videoData.comments,
        {
          category: result.category,
          riskScore: result.riskScore,
          riskLevel: result.riskScore >= 80 ? 'CRITICAL' : result.riskScore >= 50 ? 'High' : result.riskScore >= 25 ? 'Medium' : 'Low',
          decision: result.decision,
          explanation: result.explanation,
        }
      );
      log(LogType.CACHE_MISS, 'Result saved to Supabase', LogLevel.INFO, { videoId });
    } catch (dbError: any) {
      log(LogType.ERROR, 'Failed to save to Supabase', LogLevel.ERROR, { error: dbError.message });
    }

    return NextResponse.json({
      success: true,
      cached: false,
      video: {
        id: videoId,
        title: videoData.title,
        channel_name: videoData.channelName,
        url: url,
      },
      analysis: {
        category: result.category,
        risk_score: result.riskScore,
        risk_level: result.riskScore >= 80 ? 'CRITICAL' : result.riskScore >= 50 ? 'High' : result.riskScore >= 25 ? 'Medium' : 'Low',
        action: result.decision,
        reason: result.explanation,
        red_zone: result.riskScore >= 80,
      },
      explanation: result.explanation,
      redZone: {
        red_zone: result.riskScore >= 80,
        priority_reason: result.riskScore >= 80 ? 'Critical content detected' : '',
      },
      method: decision.method,
      geminiUsage: getGeminiUsage(),
    });

  } catch (error: any) {
    log(LogType.ERROR, 'API Error', LogLevel.ERROR, { error: error.message, stack: error.stack });
    
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
