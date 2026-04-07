'use client';

import React, { useState, useEffect } from 'react';
import { Card, Badge, Button, Input, Spinner } from '@/components/ui';
import { formatDateTime, getRiskLevelColor, getCategoryColor } from '@/lib/utils';

interface VideoData {
  id: string;
  title: string;
  channel_name: string;
  url: string;
  created_at: string;
  analysis: {
    category: string;
    risk_score: number;
    risk_level: string;
    action: string;
    reason: string;
    red_zone: boolean;
    confidence: number;
  } | null;
  review: {
    final_action: string;
    reviewer_note: string;
    reviewed_at: string;
  } | null;
}

export default function ReviewPage() {
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed'>('all');

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const response = await fetch('/api/videos');
      const data = await response.json();
      setVideos(data.videos || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewAction = async (action: 'Allow' | 'Remove' | 'Escalate') => {
    if (!selectedVideo) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_id: selectedVideo.id,
          final_action: action,
          reviewer_note: reviewNote,
        }),
      });

      if (response.ok) {
        setSelectedVideo(null);
        setReviewNote('');
        fetchVideos();
      }
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredVideos = videos.filter((video) => {
    if (filter === 'pending') return !video.review;
    if (filter === 'reviewed') return !!video.review;
    return true;
  });

  const pendingCount = videos.filter((v) => !v.review).length;
  const redZoneCount = videos.filter((v) => v.analysis?.red_zone).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="text-slate-400 mt-4">Loading review queue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Review Queue</h1>
        <p className="text-slate-400">Review and moderate flagged content</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Videos</p>
              <p className="text-3xl font-bold text-white">{videos.length}</p>
            </div>
            <div className="text-3xl">📋</div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Pending Review</p>
              <p className="text-3xl font-bold text-amber-400">{pendingCount}</p>
            </div>
            <div className="text-3xl">⏳</div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">RED ZONE</p>
              <p className="text-3xl font-bold text-red-400">{redZoneCount}</p>
            </div>
            <div className="text-3xl">🚨</div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Videos</h3>
              <select
                className="bg-slate-800 border border-slate-600 rounded px-3 py-1 text-sm text-white"
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="reviewed">Reviewed</option>
              </select>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {filteredVideos.map((video) => (
                <div
                  key={video.id}
                  onClick={() => setSelectedVideo(video)}
                  className={`p-3 rounded-lg cursor-pointer transition-all ${
                    selectedVideo?.id === video.id
                      ? 'bg-blue-600/20 border border-blue-500'
                      : 'bg-slate-900/50 hover:bg-slate-800 border border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{video.title}</p>
                      <p className="text-slate-400 text-xs">{video.channel_name}</p>
                    </div>
                    {video.analysis?.red_zone && (
                      <span className="text-lg">🚨</span>
                    )}
                  </div>
                  <div className="flex gap-2 mt-2">
                    {video.review ? (
                      <Badge variant="success" className="text-xs">Reviewed</Badge>
                    ) : (
                      <Badge variant="warning" className="text-xs">Pending</Badge>
                    )}
                    <Badge 
                      variant={video.analysis?.risk_level === 'CRITICAL' ? 'critical' : 'default'}
                      className="text-xs"
                    >
                      {video.analysis?.risk_score}
                    </Badge>
                  </div>
                </div>
              ))}

              {filteredVideos.length === 0 && (
                <p className="text-slate-400 text-center py-8">No videos found</p>
              )}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {selectedVideo ? (
            <Card redZone={selectedVideo.analysis?.red_zone}>
              {selectedVideo.analysis?.red_zone && (
                <div className="bg-red-600/20 border border-red-600 rounded-lg p-3 mb-4 flex items-center gap-3">
                  <span className="text-2xl">🚨</span>
                  <div>
                    <h4 className="text-red-400 font-bold">RED ZONE - Priority Review</h4>
                    <p className="text-red-300 text-sm">This content requires immediate attention</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-slate-400 text-xs mb-1">Channel</p>
                  <p className="text-white font-medium">{selectedVideo.channel_name}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs mb-1">Video Title</p>
                  <p className="text-white font-medium">{selectedVideo.title}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs mb-1">Category</p>
                  <Badge variant={selectedVideo.analysis?.category === 'Safe' ? 'success' : 'danger'}>
                    {selectedVideo.analysis?.category}
                  </Badge>
                </div>
                <div>
                  <p className="text-slate-400 text-xs mb-1">Risk Score</p>
                  <p 
                    className="text-white font-bold text-lg"
                    style={{ color: getRiskLevelColor(selectedVideo.analysis?.risk_level || 'Low') }}
                  >
                    {selectedVideo.analysis?.risk_score}/100
                  </p>
                </div>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4 mb-4">
                <p className="text-slate-400 text-xs mb-2">AI Recommendation</p>
                <p className="text-slate-300">{selectedVideo.analysis?.reason}</p>
              </div>

              {selectedVideo.review && (
                <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-slate-400 text-xs mb-1">Review Decision</p>
                      <p className="text-white font-medium">{selectedVideo.review.final_action}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-400 text-xs">Reviewed</p>
                      <p className="text-slate-300 text-sm">{formatDateTime(selectedVideo.review.reviewed_at)}</p>
                    </div>
                  </div>
                  {selectedVideo.review.reviewer_note && (
                    <div className="mt-3 pt-3 border-t border-slate-700">
                      <p className="text-slate-400 text-xs mb-1">Reviewer Note</p>
                      <p className="text-slate-300">{selectedVideo.review.reviewer_note}</p>
                    </div>
                  )}
                </div>
              )}

              {!selectedVideo.review && (
                <>
                  <div className="mb-4">
                    <label className="block text-slate-400 text-sm mb-2">Review Note (Optional)</label>
                    <textarea
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={3}
                      placeholder="Add a note about your decision..."
                      value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button
                      variant="success"
                      onClick={() => handleReviewAction('Allow')}
                      disabled={submitting}
                      className="flex-1"
                    >
                      Approve
                    </Button>
                    <Button
                      variant="warning"
                      onClick={() => handleReviewAction('Escalate')}
                      disabled={submitting}
                      className="flex-1"
                    >
                      Escalate
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => handleReviewAction('Remove')}
                      disabled={submitting}
                      className="flex-1"
                    >
                      Remove
                    </Button>
                  </div>
                </>
              )}
            </Card>
          ) : (
            <Card>
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-white text-lg font-medium mb-2">Select a Video</h3>
                <p className="text-slate-400">Choose a video from the list to review</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}