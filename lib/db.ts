import { supabase } from '@/lib/supabase';
import { Video, Analysis, Review, VideoWithAnalysis } from '@/types';

export async function insertVideo(video: Omit<Video, 'id' | 'created_at'>): Promise<Video> {
  const { data, error } = await supabase
    .from('videos')
    .insert(video)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function insertAnalysis(analysis: Omit<Analysis, 'id' | 'created_at'>): Promise<Analysis> {
  const { data, error } = await supabase
    .from('analysis')
    .insert(analysis)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function insertReview(review: Omit<Review, 'id' | 'reviewed_at'>): Promise<Review> {
  const { data, error } = await supabase
    .from('reviews')
    .insert(review)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getVideoWithAnalysis(videoId: string): Promise<VideoWithAnalysis | null> {
  const { data: video, error: videoError } = await supabase
    .from('videos')
    .select('*')
    .eq('id', videoId)
    .single();

  if (videoError || !video) return null;

  const { data: analysis } = await supabase
    .from('analysis')
    .select('*')
    .eq('video_id', videoId)
    .single();

  const { data: review } = await supabase
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
    limit?: number;
    offset?: number;
  }
): Promise<{ videos: VideoWithAnalysis[]; total: number }> {
  let query = supabase
    .from('videos')
    .select(`
      *,
      analysis (*),
      reviews (*)
    `, { count: 'exact' });

  if (filters?.red_zone) {
    query = query.eq('analysis.red_zone', true);
  }

  const { data: videos, error, count } = await query
    .order('created_at', { ascending: false })
    .range(filters?.offset || 0, (filters?.limit || 20) + (filters?.offset || 0) - 1);

  if (error) throw new Error(error.message);

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
  const { data, error } = await supabase
    .from('videos')
    .select(`
      *,
      analysis (*),
      reviews (*)
    `)
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
  const existingReview = await supabase
    .from('reviews')
    .select('id')
    .eq('video_id', videoId)
    .single();

  if (existingReview.data) {
    const { data, error } = await supabase
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
  const { count: total } = await supabase
    .from('analysis')
    .select('*', { count: 'exact', head: true });

  const { data: categoryData } = await supabase
    .from('analysis')
    .select('category');

  const categoryBreakdown: Record<string, number> = {};
  categoryData?.forEach((a: any) => {
    categoryBreakdown[a.category] = (categoryBreakdown[a.category] || 0) + 1;
  });

  const { data: riskData } = await supabase
    .from('analysis')
    .select('risk_level');

  const riskLevelBreakdown: Record<string, number> = {};
  riskData?.forEach((a: any) => {
    riskLevelBreakdown[a.risk_level] = (riskLevelBreakdown[a.risk_level] || 0) + 1;
  });

  const { count: redZoneCount } = await supabase
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
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data } = await supabase
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