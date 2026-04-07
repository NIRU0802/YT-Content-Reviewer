import { NextRequest, NextResponse } from 'next/server';
import { insertReview, updateReview, getVideoWithAnalysis } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { video_id, final_action, reviewer_note } = body;

    if (!video_id || !final_action) {
      return NextResponse.json(
        { success: false, error: 'video_id and final_action are required' },
        { status: 400 }
      );
    }

    const validActions = ['Allow', 'Remove', 'Escalate'];
    if (!validActions.includes(final_action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }

    const review = await updateReview(video_id, final_action, reviewer_note);

    return NextResponse.json({ success: true, review });
  } catch (error: any) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const video_id = searchParams.get('video_id');

    if (!video_id) {
      return NextResponse.json(
        { success: false, error: 'video_id is required' },
        { status: 400 }
      );
    }

    const video = await getVideoWithAnalysis(video_id);
    if (!video || !video.review) {
      return NextResponse.json(
        { success: true, review: null }
      );
    }

    return NextResponse.json({ success: true, review: video.review });
  } catch (error: any) {
    console.error('Error fetching review:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}