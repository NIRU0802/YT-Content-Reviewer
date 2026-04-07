import { NextResponse } from 'next/server';

const SQL = `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL, video_id TEXT NOT NULL,
  title TEXT NOT NULL, description TEXT,
  channel_name TEXT NOT NULL, comments TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL, confidence DECIMAL(3,2) NOT NULL,
  risk_score INTEGER NOT NULL, risk_level TEXT NOT NULL,
  action TEXT NOT NULL, reason TEXT, red_zone BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE NOT NULL,
  final_action TEXT NOT NULL, reviewer_note TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analysis_video_id ON analysis(video_id);
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all videos" ON videos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all analysis" ON analysis FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all reviews" ON reviews FOR ALL USING (true) WITH CHECK (true);`;

export async function GET() {
  return NextResponse.json({
    message: 'Go to Supabase SQL Editor and run the SQL to create tables',
    sql: SQL
  });
}