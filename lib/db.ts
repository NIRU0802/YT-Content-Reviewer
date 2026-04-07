import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Video, Analysis, Review, VideoWithAnalysis } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

const supabase: SupabaseClient | null = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

if (!supabase) {
  console.warn('⚠️ Supabase client not initialized');
}

async function getClient(): Promise<SupabaseClient> {
  if (!supabase) {
    throw new Error('Supabase not configured. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  // Test connection
  const { error } = await supabase.from('videos').select('count').limit(1);
  if (error && error.message.includes('relation "videos" does not exist')) {
    throw new Error('Database tables not created. Run supabase-schema.sql in Supabase SQL Editor.');
  }
  if (error && error.message.includes('relation "supabase_migrations.schema_migrations" does not exist')) {
    console.warn('[DB] Migration table missing but tables may exist, continuing...');
  }
  return supabase;
}

export async function insertVideo(video: Omit<Video, 'id' | 'created_at'>): Promise<Video> {
  console.log('[DB] Inserting video:', { videoId: video.video_id, title: video.title, channel: video.channel_name });
  
  const client = await getClient();
  
  const { data, error } = await client
    .from('videos')
    .insert(video)
    .select()
    .single();

  if (error) {
    console.error('[DB] Error inserting video:', error);
    throw new Error(error.message);
  }
  
  console.log('[DB] Video inserted successfully:', data.id);
  return data;
}

export async function insertAnalysis(analysis: Omit<Analysis, 'id' | 'created_at'>): Promise<Analysis> {
  console.log('[DB] Inserting analysis:', { videoId: analysis.video_id, category: analysis.category, riskScore: analysis.risk_score });
  
  const client = await getClient();
  
  const { data, error } = await client
    .from('analysis')
    .insert(analysis)
    .select()
    .single();

  if (error) {
    console.error('[DB] Error inserting analysis:', error);
    throw new Error(error.message);
  }
  
  console.log('[DB] Analysis inserted successfully:', data.id);
  return data;
}

export async function insertReview(review: Omit<Review, 'id' | 'reviewed_at'>): Promise<Review> {
  const client = await getClient();
  
  const { data, error } = await client
    .from('reviews')
    .insert(review)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getVideoWithAnalysis(videoId: string): Promise<VideoWithAnalysis | null> {
  const client = await getClient();
  
  const { data: video, error: videoError } = await client
    .from('videos')
    .select('*')
    .eq('id', videoId)
    .single();

  if (videoError || !video) return null;

  const { data: analysis } = await client
    .from('analysis')
    .select('*')
    .eq('video_id', videoId)
    .single();

  const { data: review } = await client
    .from('reviews')
    .select('*')
    .eq('video_id', videoId)
    .single();

  return {
    ...video,
    analysis: analysis || null,
    review: review || null,
  };
}

export async function getVideos(
  filters?: {
    category?: string;
    risk_level?: string;
    red_zone?: boolean;
    action?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{ videos: VideoWithAnalysis[]; total: number }> {
  const client = await getClient();
  
  console.log('[DB] getVideos called with filters:', filters);
  
  // First, just try to get count of videos
  const { count, error: countError } = await client
    .from('videos')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('[DB] Error getting videos count:', countError);
    throw new Error(`Failed to fetch videos: ${countError.message}`);
  }

  console.log('[DB] Total videos in DB:', count);

  // Now get the actual data with joined tables
  let query = client
    .from('videos')
    .select('*, analysis(*), reviews(*)')
    .order('created_at', { ascending: false })
    .range(filters?.offset || 0, (filters?.limit || 20) + (filters?.offset || 0) - 1);

  if (filters?.action) {
    query = query.eq('analysis.action', filters.action);
  }

  const { data: videos, error } = await query;

  if (error) {
    console.error('[DB] Error fetching videos:', error);
    throw new Error(error.message);
  }

  const transformedVideos = (videos || []).map((v: any) => ({
    ...v,
    analysis: v.analysis?.[0] || null,
    review: v.reviews?.[0] || null,
  }));

  return {
    videos: transformedVideos,
    total: count || 0,
  };
}

export async function getRedZoneVideos(): Promise<VideoWithAnalysis[]> {
  const client = await getClient();
  
  const { data, error } = await client
    .from('videos')
    .select('*, analysis(*), reviews(*)')
    .eq('analysis.red_zone', true)
    .order('analysis.risk_score', { ascending: false });

  if (error) throw new Error(error.message);

  return (data || []).map((v: any) => ({
    ...v,
    analysis: v.analysis?.[0] || null,
    review: v.reviews?.[0] || null,
  }));
}

export async function updateReview(
  videoId: string,
  finalAction: string,
  reviewerNote?: string
): Promise<Review> {
  const client = await getClient();
  
  const existingReview = await client
    .from('reviews')
    .select('id')
    .eq('video_id', videoId)
    .single();

  if (existingReview.data) {
    const { data, error } = await client
      .from('reviews')
      .update({
        final_action: finalAction,
        reviewer_note: reviewerNote,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', existingReview.data.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  return insertReview({
    video_id: videoId,
    final_action: finalAction as any,
    reviewer_note: reviewerNote || null,
  });
}

export async function getDashboardStats(): Promise<{
  totalAnalyzed: number;
  categoryBreakdown: Record<string, number>;
  riskLevelBreakdown: Record<string, number>;
  redZoneCount: number;
}> {
  const client = await getClient();
  
  console.log('[DB] getDashboardStats called');
  
  const { count: total, error: totalError } = await client
    .from('analysis')
    .select('*', { count: 'exact', head: true });

  if (totalError) {
    console.error('[DB] Error getting analysis count:', totalError);
    throw new Error(`Failed to get stats: ${totalError.message}`);
  }

  console.log('[DB] Total analyzed:', total);

  const { data: categoryData } = await client
    .from('analysis')
    .select('category');

  const categoryBreakdown: Record<string, number> = {};
  categoryData?.forEach((a: any) => {
    categoryBreakdown[a.category] = (categoryBreakdown[a.category] || 0) + 1;
  });

  const { data: riskData } = await client
    .from('analysis')
    .select('risk_level');

  const riskLevelBreakdown: Record<string, number> = {};
  riskData?.forEach((a: any) => {
    riskLevelBreakdown[a.risk_level] = (riskLevelBreakdown[a.risk_level] || 0) + 1;
  });

  const { count: redZoneCount } = await client
    .from('analysis')
    .select('*', { count: 'exact', head: true })
    .eq('red_zone', true);

  return {
    totalAnalyzed: total || 0,
    categoryBreakdown,
    riskLevelBreakdown,
    redZoneCount: redZoneCount || 0,
  };
}

export async function getTrendData(days: number = 7): Promise<{ date: string; count: number }[]> {
  const client = await getClient();
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data } = await client
    .from('videos')
    .select('created_at')
    .gte('created_at', startDate.toISOString())
    .order('created_at');

  const trendMap: Record<string, number> = {};
  
  data?.forEach((v: any) => {
    const date = new Date(v.created_at).toISOString().split('T')[0];
    trendMap[date] = (trendMap[date] || 0) + 1;
  });

  const result: { date: string; count: number }[] = [];
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    result.push({ date: dateStr, count: trendMap[dateStr] || 0 });
  }

  return result;
}