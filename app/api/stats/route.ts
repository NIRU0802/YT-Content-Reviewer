import { NextRequest, NextResponse } from 'next/server';
import { getDashboardStats, getTrendData, getVideos } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '7');

    const [stats, trendData, recentVideos] = await Promise.all([
      getDashboardStats(),
      getTrendData(days),
      getVideos({ limit: 10, offset: 0 }),
    ]);

    return NextResponse.json({
      success: true,
      stats,
      trendData,
      recentActivity: recentVideos.videos,
    });
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}