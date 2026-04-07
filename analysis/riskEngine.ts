import { RiskLevel, Category } from '@/types';

export interface RiskResult {
  risk_score: number;
  risk_level: RiskLevel;
}

const BASE_SCORES: Record<Category, number> = {
  'Hate Speech': 70,
  Violence: 60,
  Spam: 40,
  Safe: 10,
};

const HIGH_RISK_KEYWORDS = [
  'kill', 'murder', 'attack', 'bomb', 'terroris', 'weapon',
  'hate', 'racist', 'violence', 'death', 'threat', 'abuse',
];

const MEDIUM_RISK_KEYWORDS = [
  'spam', 'scam', 'fake', 'clickbait', 'misinformation',
  'offensive', 'inappropriate', 'suspicious',
];

export function calculateRiskScore(
  category: Category,
  confidence: number,
  keywords: string[]
): RiskResult {
  let score = BASE_SCORES[category];

  const keywordMatches = keywords.map(k => k.toLowerCase());
  
  const highRiskCount = HIGH_RISK_KEYWORDS.filter(keyword =>
    keywordMatches.some(match => match.includes(keyword))
  ).length;
  
  const mediumRiskCount = MEDIUM_RISK_KEYWORDS.filter(keyword =>
    keywordMatches.some(match => match.includes(keyword))
  ).length;

  score += highRiskCount * 15;
  score += mediumRiskCount * 8;

  score += confidence * 10;

  if (keywords.length > 5) {
    score += Math.min((keywords.length - 5) * 3, 15);
  }

  score = Math.min(Math.max(score, 0), 100);

  const risk_level = getRiskLevel(score);

  return {
    risk_score: Math.round(score),
    risk_level,
  };
}

function getRiskLevel(score: number): RiskLevel {
  if (score >= 80) return 'CRITICAL';
  if (score >= 51) return 'High';
  if (score >= 26) return 'Medium';
  return 'Low';
}

export function isHighRisk(result: RiskResult): boolean {
  return result.risk_level === 'High' || result.risk_level === 'CRITICAL';
}

export function isCriticalRisk(result: RiskResult): boolean {
  return result.risk_level === 'CRITICAL';
}