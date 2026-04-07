'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Card, Spinner } from '@/components/ui';

interface AnalysisResult {
  video: {
    id: string;
    title: string;
    channel_name: string;
    url: string;
  };
  analysis: {
    category: string;
    risk_score: number;
    risk_level: string;
    action: string;
    reason: string;
    red_zone: boolean;
  };
  explanation: string;
  redZone: {
    red_zone: boolean;
    priority_reason: string;
  };
}

export default function HomePage() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleAnalyze = async () => {
    if (!url.trim()) {
      setError('Please enter a YouTube URL');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to analyze video');
        return;
      }

      setResult(data);
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Content Guardian
          </h1>
          <p className="text-slate-400 text-lg">
            AI-Powered Trust & Safety Content Moderation
          </p>
        </div>

        <Card className="mb-8">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                YouTube Video URL
              </label>
              <Input
                type="text"
                placeholder="https://www.youtube.com/watch?v=..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                disabled={loading}
                className="text-base"
              />
            </div>

            <div className="flex justify-center">
              <Button
                onClick={handleAnalyze}
                loading={loading}
                size="lg"
                disabled={loading}
              >
                {loading ? 'Analyzing...' : 'Analyze Video'}
              </Button>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm">
                {error}
              </div>
            )}
          </div>
        </Card>

        {result && (
          <div className="animate-fade-in">
            {result.analysis.red_zone && (
              <div className="bg-red-600/20 border-2 border-red-600 rounded-lg p-4 mb-6 flex items-center gap-3">
                <span className="text-3xl">🚨</span>
                <div>
                  <h3 className="text-red-400 font-bold text-lg">
                    Critical Content Detected
                  </h3>
                  <p className="text-red-300 text-sm">
                    {result.redZone.priority_reason}
                  </p>
                </div>
              </div>
            )}

            <Card redZone={result.analysis.red_zone}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-slate-400 text-sm mb-1">Channel</h3>
                  <p className="text-white font-medium text-lg">
                    {result.video.channel_name}
                  </p>
                </div>
                <div>
                  <h3 className="text-slate-400 text-sm mb-1">Video Title</h3>
                  <p className="text-white font-medium">
                    {result.video.title}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <p className="text-slate-400 text-xs mb-1">Category</p>
                  <p
                    className={`font-bold ${
                      result.analysis.category === 'Safe'
                        ? 'text-emerald-400'
                        : 'text-red-400'
                    }`}
                  >
                    {result.analysis.category}
                  </p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <p className="text-slate-400 text-xs mb-1">Risk Score</p>
                  <p
                    className={`font-bold ${
                      result.analysis.risk_score >= 80
                        ? 'text-red-500'
                        : result.analysis.risk_score >= 50
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {result.analysis.risk_score}/100
                  </p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <p className="text-slate-400 text-xs mb-1">Risk Level</p>
                  <p
                    className={`font-bold ${
                      result.analysis.risk_level === 'CRITICAL'
                        ? 'text-red-500'
                        : result.analysis.risk_level === 'High'
                        ? 'text-orange-400'
                        : result.analysis.risk_level === 'Medium'
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {result.analysis.risk_level}
                  </p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <p className="text-slate-400 text-xs mb-1">Action</p>
                  <p
                    className={`font-bold ${
                      result.analysis.action === 'Remove'
                        ? 'text-red-400'
                        : result.analysis.action === 'Review'
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {result.analysis.action}
                  </p>
                </div>
              </div>

              <div className="mt-6 bg-slate-900/50 rounded-lg p-4">
                <h3 className="text-slate-400 text-xs mb-2">Explanation</h3>
                <p className="text-slate-300">{result.explanation}</p>
              </div>

              <div className="mt-6 bg-slate-900/50 rounded-lg p-4">
                <h3 className="text-slate-400 text-xs mb-2">AI Reason</h3>
                <p className="text-slate-300">{result.analysis.reason}</p>
              </div>

              <div className="mt-6 flex gap-4">
                <Button onClick={() => router.push('/dashboard')} variant="secondary">
                  View Dashboard
                </Button>
                <Button onClick={() => router.push('/review')} variant="secondary">
                  Review Queue
                </Button>
              </div>
            </Card>
          </div>
        )}

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <div className="text-center">
              <div className="text-4xl mb-3">🔍</div>
              <h3 className="text-white font-semibold mb-2">Smart Analysis</h3>
              <p className="text-slate-400 text-sm">
                AI-powered content classification using advanced NLP
              </p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-4xl mb-3">⚡</div>
              <h3 className="text-white font-semibold mb-2">RED ZONE</h3>
              <p className="text-slate-400 text-sm">
                Automatic priority detection for critical content
              </p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-4xl mb-3">📊</div>
              <h3 className="text-white font-semibold mb-2">Analytics</h3>
              <p className="text-slate-400 text-sm">
                Comprehensive dashboard with real-time insights
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}