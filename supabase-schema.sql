-- Content Guardian Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Videos table
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

-- Analysis table
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

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE NOT NULL,
  final_action TEXT NOT NULL,
  reviewer_note TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analysis_video_id ON analysis(video_id);
CREATE INDEX IF NOT EXISTS idx_analysis_category ON analysis(category);
CREATE INDEX IF NOT EXISTS idx_analysis_risk_level ON analysis(risk_level);
CREATE INDEX IF NOT EXISTS idx_analysis_red_zone ON analysis(red_zone) WHERE red_zone = true;
CREATE INDEX IF NOT EXISTS idx_reviews_video_id ON reviews(video_id);

-- Enable Row Level Security (optional)
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust as needed for your use case)
CREATE POLICY "Allow all operations on videos" ON videos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on analysis" ON analysis FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on reviews" ON reviews FOR ALL USING (true) WITH CHECK (true);