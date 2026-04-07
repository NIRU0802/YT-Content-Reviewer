export interface Video {
  id: string;
  url: string;
  video_id: string;
  title: string;
  description: string | null;
  channel_name: string;
  comments: string[];
  created_at: string;
}

export interface Analysis {
  id: string;
  video_id: string;
  category: 'Hate Speech' | 'Spam' | 'Violence' | 'Safe';
  confidence: number;
  risk_score: number;
  risk_level: 'Low' | 'Medium' | 'High' | 'CRITICAL';
  action: 'Allow' | 'Review' | 'Remove';
  reason: string;
  red_zone: boolean;
  created_at: string;
}

export interface Review {
  id: string;
  video_id: string;
  final_action: 'Allow' | 'Remove' | 'Escalate';
  reviewer_note: string | null;
  reviewed_at: string;
}

export interface VideoWithAnalysis extends Video {
  analysis: Analysis | null;
  review: Review | null;
}

export interface DashboardStats {
  totalAnalyzed: number;
  categoryBreakdown: Record<string, number>;
  riskLevelBreakdown: Record<string, number>;
  redZoneCount: number;
  recentActivity: VideoWithAnalysis[];
  trendData: { date: string; count: number }[];
}

export interface AnalyzeRequest {
  url: string;
}

export interface AnalyzeResponse {
  video: Video;
  analysis: Analysis;
  success: boolean;
  error?: string;
}

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'CRITICAL';
export type Category = 'Hate Speech' | 'Spam' | 'Violence' | 'Safe';
export type Action = 'Allow' | 'Review' | 'Remove' | 'Escalate';