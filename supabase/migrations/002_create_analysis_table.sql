-- Migration: 002_create_analysis_table
-- Description: Creates the analysis table for storing video risk analysis
-- Created: 2026-04-07

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('Safe', 'Hate Speech', 'Violence', 'Spam', 'Misinformation', 'Adult Content', 'Harassment')),
  confidence DECIMAL(5,4) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('Low', 'Medium', 'High', 'CRITICAL')),
  action TEXT NOT NULL CHECK (action IN ('Allow', 'Review', 'Remove', 'Escalate')),
  reason TEXT,
  red_zone BOOLEAN DEFAULT FALSE,
  analysis_method TEXT DEFAULT 'keyword' CHECK (analysis_method IN ('keyword', 'gemini', 'hybrid')),
  model_version TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_analysis_video_id ON analysis(video_id);
CREATE INDEX IF NOT EXISTS idx_analysis_risk_score ON analysis(risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_analysis_risk_level ON analysis(risk_level);
CREATE INDEX IF NOT EXISTS idx_analysis_category ON analysis(category);
CREATE INDEX IF NOT EXISTS idx_analysis_red_zone ON analysis(red_zone) WHERE red_zone = true;
CREATE INDEX IF NOT EXISTS idx_analysis_action ON analysis(action);
CREATE INDEX IF NOT EXISTS idx_analysis_created_at ON analysis(created_at DESC);

-- Composite index for dashboard queries
CREATE INDEX IF NOT EXISTS idx_analysis_risk_created ON analysis(risk_score DESC, created_at DESC);

-- Row Level Security
ALTER TABLE analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to analysis" ON analysis 
  FOR ALL USING (true) WITH CHECK (true);

-- Add foreign key constraint with proper name
ALTER TABLE analysis 
  ADD CONSTRAINT fk_analysis_video 
  FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE;