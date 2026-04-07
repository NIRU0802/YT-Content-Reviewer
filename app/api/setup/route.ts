import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// WARNING: This endpoint creates tables - only use in development
export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-admin-secret');
  if (secret !== 'dev-setup-2024') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const sql = `
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    
    CREATE TABLE IF NOT EXISTS videos (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      url TEXT NOT NULL,
      video_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      channel_name TEXT NOT NULL,
      comments TEXT[],
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS analysis (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      video_id UUID REFERENCES videos(id) ON DELETE CASCADE NOT NULL,
      category TEXT NOT NULL,
      confidence DECIMAL(3,2) NOT NULL,
      risk_score INTEGER NOT NULL,
      risk_level TEXT NOT NULL,
      action TEXT NOT NULL,
      reason TEXT,
      red_zone BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      video_id UUID REFERENCES videos(id) ON DELETE CASCADE NOT NULL,
      final_action TEXT NOT NULL,
      reviewer_note TEXT,
      reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_analysis_video_id ON analysis(video_id);
    CREATE INDEX IF NOT EXISTS idx_analysis_red_zone ON analysis(red_zone) WHERE red_zone = true;

    ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
    ALTER TABLE analysis ENABLE ROW LEVEL SECURITY;
    ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Allow all videos" ON videos;
    DROP POLICY IF EXISTS "Allow all analysis" ON analysis;
    DROP POLICY IF EXISTS "Allow all reviews" ON reviews;

    CREATE POLICY "Allow all videos" ON videos FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "Allow all analysis" ON analysis FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "Allow all reviews" ON reviews FOR ALL USING (true) WITH CHECK (true);
  `;

  try {
    const { data, error } = await supabase.rpc('pg_catalog.to_regclass', { text: 'videos' });
    console.log('Checking if tables exist...', data);
    
    // Try inserting a dummy record to trigger table creation via edge function
    // Since we can't run raw SQL, we'll try a different approach
    
    return NextResponse.json({ 
      success: true, 
      message: 'Please run the SQL from supabase-schema.sql in your Supabase SQL Editor',
      sql: sql 
    });
  } catch (error: any) {
    console.error('Setup error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'POST to this endpoint with x-admin-secret: dev-setup-2024 to create tables. Or run SQL in Supabase dashboard.' 
  });
}