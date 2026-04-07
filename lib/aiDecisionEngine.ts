import { log, LogType, LogLevel, getGeminiUsageCount } from './logger';
import { isSimpleInput, shouldUseAI } from './hashUtil';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

const DAILY_GEMINI_LIMIT = parseInt(process.env.DAILY_GEMINI_LIMIT || '100', 10);
const GEMINI_TIMEOUT_MS = 7000;

let dailyGeminiCount = 0;
let lastResetDate = new Date().toDateString();

function resetDailyCount(): void {
  const today = new Date().toDateString();
  if (today !== lastResetDate) {
    dailyGeminiCount = 0;
    lastResetDate = today;
  }
}

export function isGeminiAvailable(): boolean {
  resetDailyCount();
  return dailyGeminiCount < DAILY_GEMINI_LIMIT;
}

export function getGeminiUsage(): { used: number; limit: number; available: boolean } {
  resetDailyCount();
  return {
    used: dailyGeminiCount,
    limit: DAILY_GEMINI_LIMIT,
    available: dailyGeminiCount < DAILY_GEMINI_LIMIT,
  };
}

export interface AnalysisDecision {
  useAI: boolean;
  method: 'gemini' | 'keyword-fallback';
  reason: string;
}

export function decideAnalysisMethod(text: string): AnalysisDecision {
  if (!GEMINI_API_KEY) {
    return {
      useAI: false,
      method: 'keyword-fallback',
      reason: 'No Gemini API key configured',
    };
  }

  if (!isGeminiAvailable()) {
    log(LogType.GEMINI_SKIPPED, 'Daily Gemini limit exceeded', LogLevel.WARN);
    return {
      useAI: false,
      method: 'keyword-fallback',
      reason: 'Daily Gemini limit exceeded',
    };
  }

  if (!shouldUseAI(text)) {
    log(LogType.GEMINI_SKIPPED, 'Simple input - using keyword fallback', LogLevel.INFO);
    return {
      useAI: false,
      method: 'keyword-fallback',
      reason: 'Simple input detected - keyword analysis sufficient',
    };
  }

  return {
    useAI: true,
    method: 'gemini',
    reason: 'Complex input - Gemini required',
  };
}

export interface KeywordAnalysisResult {
  category: string;
  confidence: number;
  explanation: string;
  keywords: string[];
  decision: 'ALLOW' | 'REVIEW' | 'REMOVE';
  riskScore: number;
}

const KEYWORD_PATTERNS = {
  'Hate Speech': [
    'hate', 'racist', 'discriminat', 'slur', 'nazi', 'supremac',
    'dehumaniz', 'violence toward', 'kill all', 'exterminate',
    'white power', 'black lives', 'antisemit', 'islamophob',
  ],
  'Spam': [
    'click here', 'buy now', 'free money', 'winner', 'congratulations',
    'limited time', 'act now', 'subscribe', 'follow me', 'sub4sub',
    'earn money', 'make money', 'investment opportunity', 'dm for',
  ],
  'Violence': [
    'kill', 'murder', 'attack', 'bomb', 'weapon', 'shoot', 'stab',
    'threat', 'assault', 'violent', 'harm', 'injure', 'death',
    'terrorist', 'explos', 'rifle', 'pistol',
  ],
};

export function keywordFallbackAnalysis(
  title: string,
  description: string,
  comments: string[]
): KeywordAnalysisResult {
  const combinedText = `${title} ${description} ${comments.join(' ')}`.toLowerCase();
  
  let matchedCategory = 'Safe';
  let matchedKeywords: string[] = [];
  let maxMatches = 0;

  for (const [category, keywords] of Object.entries(KEYWORD_PATTERNS)) {
    const matches = keywords.filter(kw => combinedText.includes(kw.toLowerCase()));
    if (matches.length > maxMatches) {
      maxMatches = matches.length;
      matchedCategory = category;
      matchedKeywords = matches;
    }
  }

  let decision: 'ALLOW' | 'REVIEW' | 'REMOVE';
  let riskScore: number;
  let confidence: number;
  let explanation: string;

  if (matchedCategory === 'Safe' || maxMatches === 0) {
    decision = 'ALLOW';
    riskScore = 10;
    confidence = 0.8;
    explanation = 'No problematic keywords detected. Content appears safe.';
  } else if (maxMatches >= 2) {
    decision = matchedCategory === 'Violence' ? 'REMOVE' : 'REVIEW';
    riskScore = matchedCategory === 'Violence' ? 85 : matchedCategory === 'Hate Speech' ? 75 : 50;
    confidence = Math.min(0.5 + maxMatches * 0.15, 0.9);
    explanation = `Detected ${maxMatches} ${matchedCategory} keywords: ${matchedKeywords.join(', ')}`;
  } else {
    decision = 'REVIEW';
    riskScore = 40;
    confidence = 0.4;
    explanation = `Low-confidence match for ${matchedCategory}. Manual review recommended.`;
  }

  return {
    category: matchedCategory,
    confidence,
    explanation,
    keywords: matchedKeywords,
    decision,
    riskScore,
  };
}

export interface GeminiAnalysisResult {
  category: string;
  confidence: number;
  explanation: string;
  decision: 'ALLOW' | 'REVIEW' | 'REMOVE';
  riskScore: number;
}

export async function callGeminiWithTimeout(
  prompt: string,
  timeoutMs: number = GEMINI_TIMEOUT_MS
): Promise<GeminiAnalysisResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 500,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      throw new Error('Invalid Gemini response format');
    }

    dailyGeminiCount++;
    log(LogType.GEMINI_USED, 'Gemini API called', LogLevel.INFO, { dailyCount: dailyGeminiCount });

    const parsed = JSON.parse(content);
    
    return {
      category: parsed.category || 'Safe',
      confidence: parsed.confidence || 0.5,
      explanation: parsed.explanation || 'Analysis completed.',
      decision: parsed.decision || 'ALLOW',
      riskScore: parsed.riskScore || parsed.score || 10,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError') {
      log(LogType.ERROR, 'Gemini request timeout', LogLevel.ERROR);
      throw new Error('Gemini request timeout');
    }
    
    throw error;
  }
}

export function buildGeminiPrompt(
  title: string,
  description: string,
  comments: string[]
): string {
  const trimmedTitle = title.slice(0, 200);
  const trimmedDesc = (description || '').slice(0, 500);
  const trimmedComments = comments.slice(0, 10).map(c => c.slice(0, 100)).join(' | ');

  return `Analyze YouTube video content. Classify as: Hate Speech, Spam, Violence, or Safe.

Title: ${trimmedTitle}
Description: ${trimmedDesc}
Comments: ${trimmedComments}

Respond JSON only:
{"category":"X","confidence":0.0-1.0,"explanation":"x","decision":"ALLOW|REVIEW|REMOVE","riskScore":0-100}`;
}
