import { NextRequest, NextResponse } from 'next/server';
import { getVideos, getRedZoneVideos, getVideoWithAnalysis } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const redZone = searchParams.get('red_zone');
    const action = searchParams.get('action');  // NEW: filter by action (REVIEW, REMOVE, ALLOW)
    const category = searchParams.get('category');
    const risk_level = searchParams.get('risk_level');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    console.log('[API /videos] Fetching videos:', { id, redZone, category, risk_level, limit, offset });

    if (id) {
      const video = await getVideoWithAnalysis(id);
      if (!video) {
        return NextResponse.json(
          { success: false, error: 'Video not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, video });
    }

    if (redZone === 'true') {
      const videos = await getRedZoneVideos();
      console.log('[API /videos] Red zone videos:', videos.length);
      return NextResponse.json({ success: true, videos, total: videos.length });
    }

    const filters: any = {};
    if (category) filters.category = category;
    if (risk_level) filters.risk_level = risk_level;
    if (redZone === 'true') filters.red_zone = true;
    if (action) filters.action = action;
    filters.limit = limit;
    filters.offset = offset;

    const result = await getVideos(filters);
    console.log('[API /videos] Videos fetched:', { count: result.videos.length, total: result.total });
    return NextResponse.json({ 
      success: true, 
      videos: result.videos,
      total: result.total,
      limit,
      offset,
    });
  } catch (error: any) {
    console.error('[API /videos] Error fetching videos:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}