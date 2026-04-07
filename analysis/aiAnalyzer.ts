import { Category } from '@/types';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4';

export interface AIAnalysisResult {
  category: Category;
  confidence: number;
  explanation: string;
  keywords: string[];
}

const CATEGORIES: Category[] = ['Hate Speech', 'Spam', 'Violence', 'Safe'];

const KEYWORDS: Record<Category, string[]> = {
  'Hate Speech': [
    'hate', 'racist', 'discriminat', 'slur', 'nazi', 'supremac',
    'dehumaniz', 'violence toward', 'kill all', 'exterminate',
  ],
  Spam: [
    'click here', 'buy now', 'free money', 'winner', 'congratulations',
    'limited time', 'act now', 'subscribe', 'follow me', 'sub4sub',
    'earn money', 'make money', 'investment opportunity',
  ],
  Violence: [
    'kill', 'murder', 'attack', 'bomb', 'weapon', 'shoot', 'stab',
    'threat', 'assault', 'violent', 'harm', 'injure', 'death',
  ],
  Safe: [],
};

export async function analyzeContent(
  title: string,
  description: string,
  comments: string[]
): Promise<AIAnalysisResult> {
  const combinedText = [
    `Title: ${title}`,
    `Description: ${description}`,
    `Comments: ${comments.slice(0, 20).join(' | ')}`,
  ].join('\n\n');

  if (!OPENAI_API_KEY) {
    return fallbackAnalysis(combinedText);
  }

  try {
    const prompt = `You are a content moderation AI. Analyze the following YouTube video content and classify it into ONE of these categories: Hate Speech, Spam, Violence, or Safe.

Content to analyze:
${combinedText}

Respond with a JSON object in this exact format:
{
  "category": "category_name",
  "confidence": 0.0-1.0,
  "explanation": "Brief explanation of why this content was classified this way",
  "keywords": ["list", "of", "relevant", "keywords"]
}

Only respond with the JSON object, nothing else.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a content moderation AI assistant.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    const parsed = JSON.parse(content);
    
    const category = CATEGORIES.includes(parsed.category as Category)
      ? parsed.category
      : 'Safe';

    return {
      category,
      confidence: Math.min(Math.max(parsed.confidence, 0), 1),
      explanation: parsed.explanation || 'Analysis completed.',
      keywords: parsed.keywords || [],
    };
  } catch (error) {
    console.error('AI analysis error:', error);
    return fallbackAnalysis(combinedText);
  }
}

function fallbackAnalysis(text: string): AIAnalysisResult {
  const lowerText = text.toLowerCase();
  
  for (const category of ['Hate Speech', 'Violence', 'Spam'] as Category[]) {
    const categoryKeywords = KEYWORDS[category];
    const matches = categoryKeywords.filter(keyword => 
      lowerText.includes(keyword.toLowerCase())
    );
    
    if (matches.length >= 2) {
      return {
        category,
        confidence: Math.min(0.5 + matches.length * 0.1, 0.9),
        explanation: `Fallback analysis detected ${matches.length} keywords matching ${category}.`,
        keywords: matches,
      };
    }
  }

  return {
    category: 'Safe',
    confidence: 0.7,
    explanation: 'Content appears to be safe based on keyword analysis.',
    keywords: [],
  };
}

export function isAIConfigured(): boolean {
  return !!OPENAI_API_KEY;
}