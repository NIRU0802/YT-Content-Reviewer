import { RiskLevel, Category } from '@/types';

export interface RedZoneResult {
  red_zone: boolean;
  priority_reason: string;
  requires_immediate_action: boolean;
}

export function checkRedZone(
  risk_score: number,
  risk_level: RiskLevel,
  category: Category,
  confidence: number
): RedZoneResult {
  const isCriticalScore = risk_score >= 80;
  const isHighConfidenceHateSpeech = 
    category === 'Hate Speech' && confidence >= 0.8;
  const isViolenceWithHighRisk = 
    category === 'Violence' && risk_level === 'CRITICAL';

  const red_zone = isCriticalScore || isHighConfidenceHateSpeech || isViolenceWithHighRisk;

  let priority_reason = '';
  let requires_immediate_action = false;

  if (isCriticalScore) {
    priority_reason = `Critical risk score (${risk_score}) exceeds threshold`;
    requires_immediate_action = true;
  } else if (isHighConfidenceHateSpeech) {
    priority_reason = 'Hate speech detected with high confidence';
    requires_immediate_action = true;
  } else if (isViolenceWithHighRisk) {
    priority_reason = 'Violent content at critical risk level';
    requires_immediate_action = true;
  }

  return {
    red_zone,
    priority_reason,
    requires_immediate_action,
  };
}

export function getRedZonePriority(video: {
  risk_score: number;
  risk_level: RiskLevel;
  category: Category;
  created_at: string;
}): number {
  if (video.risk_level === 'CRITICAL') return 1;
  if (video.category === 'Hate Speech') return 2;
  if (video.category === 'Violence') return 3;
  if (video.risk_score >= 70) return 4;
  
  const ageHours = (Date.now() - new Date(video.created_at).getTime()) / (1000 * 60 * 60);
  if (ageHours < 1) return 5;
  
  return 6;
}

export function sortByRedZonePriority<T extends { 
  risk_score: number; 
  risk_level: RiskLevel;
  category: Category;
  created_at: string;
}>(videos: T[]): T[] {
  return [...videos].sort((a, b) => {
    return getRedZonePriority(a) - getRedZonePriority(b);
  });
}