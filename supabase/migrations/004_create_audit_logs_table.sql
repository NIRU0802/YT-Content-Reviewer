-- Migration: 004_create_audit_logs_table
-- Description: Creates the audit_logs table for tracking all system actions
-- Created: 2026-04-07

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  video_id UUID REFERENCES videos(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'video_created', 'video_analyzed', 'video_cached',
    'review_submitted', 'review_updated', 'review_deleted',
    'analysis_updated', 'bulk_action', 'system_error', 'api_call'
  )),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('video', 'analysis', 'review', 'user', 'system')),
  entity_id TEXT,
  previous_state JSONB,
  new_state JSONB,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_video_id ON audit_logs(video_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action ON audit_logs(user_id, action_type);

-- Partitioning by created_at for better performance (PostgreSQL 11+)
-- Note: Requires specific PostgreSQL configuration, optional for now

-- Row Level Security (read-only for most, write for system)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read audit logs" ON audit_logs 
  FOR SELECT USING (true);

CREATE POLICY "Allow insert audit logs" ON audit_logs 
  FOR INSERT WITH CHECK (true);

-- Function to easily create audit entries
CREATE OR REPLACE FUNCTION create_audit_log(
  p_user_id UUID,
  p_video_id UUID,
  p_action_type TEXT,
  p_entity_type TEXT,
  p_entity_id TEXT,
  p_previous_state JSONB DEFAULT NULL,
  p_new_state JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_audit_id UUID;
BEGIN
  INSERT INTO audit_logs (user_id, video_id, action_type, entity_type, entity_id, previous_state, new_state, metadata)
  VALUES (p_user_id, p_video_id, p_action_type, p_entity_type, p_entity_id, p_previous_state, p_new_state, p_metadata)
  RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;