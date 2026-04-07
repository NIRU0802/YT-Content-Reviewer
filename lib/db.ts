import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Video, Analysis, Review, VideoWithAnalysis } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase not configured');
}

const supabase: SupabaseClient | null = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

let tablesChecked = false;

async function ensureTables(): Promise<SupabaseClient> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }
  
  if (tablesChecked) return supabase;
  tablesChecked = true;
  
  // Try a simple query - if it fails, tables don't exist
  const { error } = await supabase.from('videos').select('id').limit(1);
  
  if (error) {
    console.warn('[DB] Tables may not exist. Error:', error.message);
    // Check if it's a "relation does not exist" error
    if (error.message.includes('does not exist')) {
      console.error('[DB] Tables missing! Please run supabase-schema.sql in Supabase SQL Editor');
      throw new Error('Database tables not created. Go to Supabase SQL Editor and run the SQL.');
    }
  }
  
  return supabase;
}

export async function insertVideo(video: Omit<Video, 'id' | 'created_at'>): Promise<Video> {
  const client = await ensureTables();
  console.log('[DB] insertVideo called with:', JSON.stringify(video, null, 2));
  
  const { data, error } = await client.from('videos').insert(video).select().single();
  if (error) {
    console.error('[DB] insertVideo error:', JSON.stringify(error, null, 2));
    throw new Error(error.message);
  }
  console.log('[DB] insertVideo success:', data);
  return data;
}

export async function insertAnalysis(analysis: Omit<Analysis, 'id' | 'created_at'>): Promise<Analysis> {
  const client = await ensureTables();
  console.log('[DB] insertAnalysis called with:', JSON.stringify(analysis, null, 2));
  
  const { data, error } = await client.from('analysis').insert(analysis).select().single();
  if (error) {
    console.error('[DB] insertAnalysis error:', JSON.stringify(error, null, 2));
    throw new Error(error.message);
  }
  console.log('[DB] insertAnalysis success:', data);
  return data;
}

export async function insertReview(review: Omit<Review, 'id' | 'reviewed_at'>): Promise<Review> {
  const client = await ensureTables();
  const { data, error } = await client.from('reviews').insert(review).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function getVideoWithAnalysis(videoId: string): Promise<VideoWithAnalysis | null> {
  const client = await ensureTables();
  const { data: video } = await client.from('videos').select('*').eq('id', videoId).single();
  if (!video) return null;
  const { data: analysis } = await client.from('analysis').select('*').eq('video_id', videoId).single();
  const { data: review } = await client.from('reviews').select('*').eq('video_id', videoId).single();
  return { ...video, analysis: analysis || null, review: review || null };
}

export async function getVideos(filters?: {
  category?: string;
  risk_level?: string;
  red_zone?: boolean;
  action?: string;
  limit?: number;
  offset?: number;
}): Promise<{ videos: VideoWithAnalysis[]; total: number }> {
  const client = await ensureTables();
  console.log('[DB] getVideos called with filters:', filters);
  
  let query = client.from('videos').select('*, analysis(*), reviews(*)');
  
  if (filters?.action) {
    query = query.eq('analysis.action', filters.action);
  }
  
  const { data: videos, count, error } = await query
    .order('created_at', { ascending: false })
    .range(filters?.offset || 0, (filters?.limit || 20) + (filters?.offset || 0) - 1);
    
  if (error) {
    console.error('[DB] getVideos error:', JSON.stringify(error, null, 2));
  }
  
  console.log('[DB] getVideos result:', { count, videos: videos?.length });
    
  return {
    videos: (videos || []).map((v: any) => ({
      ...v,
      analysis: v.analysis?.[0] || null,
      review: v.reviews?.[0] || null,
    })),
    total: count || 0,
  };
}

export async function getRedZoneVideos(): Promise<VideoWithAnalysis[]> {
  const client = await ensureTables();
  const { data } = await client.from('videos').select('*, analysis(*), reviews(*)').eq('analysis.red_zone', true).order('analysis.risk_score', { ascending: false });
  return (data || []).map((v: any) => ({ ...v, analysis: v.analysis?.[0] || null, review: v.reviews?.[0] || null }));
}

export async function updateReview(videoId: string, finalAction: string, reviewerNote?: string): Promise<Review> {
  const client = await ensureTables();
  const { data: existing } = await client.from('reviews').select('id').eq('video_id', videoId).single();
  
  if (existing) {
    const { data, error } = await client.from('reviews').update({ final_action: finalAction, reviewer_note: reviewerNote, reviewed_at: new Date().toISOString() }).eq('id', existing.id).select().single();
    if (error) throw new Error(error.message);
    return data;
  }
  
  return insertReview({ video_id: videoId, final_action: finalAction as any, reviewer_note: reviewerNote || null });
}

export async function getDashboardStats() {
  const client = await ensureTables();
  console.log('[DB] getDashboardStats called');
  
  const { count: total, error: totalError } = await client.from('analysis').select('*', { count: 'exact', head: true });
  if (totalError) console.error('[DB] getDashboardStats - total error:', totalError);
  console.log('[DB] total analyzed:', total);
  
  const { data: categoryData } = await client.from('analysis').select('category');
  const { data: riskData } = await client.from('analysis').select('risk_level');
  const { count: redZoneCount } = await client.from('analysis').select('*', { count: 'exact', head: true }).eq('red_zone', true);

  const categoryBreakdown: Record<string, number> = {};
  categoryData?.forEach((a: any) => { categoryBreakdown[a.category] = (categoryBreakdown[a.category] || 0) + 1; });

  const riskLevelBreakdown: Record<string, number> = {};
  riskData?.forEach((a: any) => { riskLevelBreakdown[a.risk_level] = (riskLevelBreakdown[a.risk_level] || 0) + 1; });

  return { totalAnalyzed: total || 0, categoryBreakdown, riskLevelBreakdown, redZoneCount: redZoneCount || 0 };
}

export async function getTrendData(days: number = 7): Promise<{ date: string; count: number }[]> {
  const client = await ensureTables();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const { data } = await client.from('videos').select('created_at').gte('created_at', startDate.toISOString()).order('created_at');
  
  const trendMap: Record<string, number> = {};
  data?.forEach((v: any) => { const date = new Date(v.created_at).toISOString().split('T')[0]; trendMap[date] = (trendMap[date] || 0) + 1; });
  
  const result: { date: string; count: number }[] = [];
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    result.push({ date: date.toISOString().split('T')[0], count: trendMap[date.toISOString().split('T')[0]] || 0 });
  }
  return result;
}