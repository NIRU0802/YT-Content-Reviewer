-- Migration: 003_create_reviews_table
-- Description: Creates the reviews table for storing human review decisions
-- Created: 2026-04-07

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  analysis_id UUID REFERENCES analysis(id) ON DELETE SET NULL,
  final_action TEXT NOT NULL CHECK (final_action IN ('Allow', 'Remove', 'Escalate', 'Override_Allow', 'Override_Remove')),
  previous_action TEXT CHECK (previous_action IN ('Allow', 'Review', 'Remove', 'Escalate')),
  reviewer_note TEXT,
  reviewed_by TEXT,
  ip_address TEXT,
  user_agent TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reviews_video_id ON reviews(video_id);
CREATE INDEX IF NOT EXISTS idx_reviews_final_action ON reviews(final_action);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewed_by ON reviews(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewed_at ON reviews(reviewed_at DESC);

-- Row Level Security
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to reviews" ON reviews 
  FOR ALL USING (true) WITH CHECK (true);

-- Add foreign key constraint
ALTER TABLE reviews 
  ADD CONSTRAINT fk_reviews_video 
  FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE;

ALTER TABLE reviews 
  ADD CONSTRAINT fk_reviews_analysis 
  FOREIGN KEY (analysis_id) REFERENCES analysis(id) ON DELETE SET NULL;