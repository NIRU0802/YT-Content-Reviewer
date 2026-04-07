'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { Card, Badge, Button, Select, Input } from '@/components/ui';
import { formatDateTime, getRiskLevelColor, getCategoryColor } from '@/lib/utils';

interface DashboardData {
  stats: {
    totalAnalyzed: number;
    categoryBreakdown: Record<string, number>;
    riskLevelBreakdown: Record<string, number>;
    redZoneCount: number;
  };
  trendData: { date: string; count: number }[];
  redZoneVideos: any[];
  recentActivity: any[];
  videos: any[];
  total: number;
}

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6'];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    risk_level: '',
    search: '',
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, redZoneRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/videos?red_zone=true'),
      ]);

      const statsData = await statsRes.json();
      const redZoneData = await redZoneRes.json();

      setData({
        stats: statsData.stats,
        trendData: statsData.trendData || [],
        redZoneVideos: redZoneData.videos || [],
        recentActivity: statsData.recentActivity || [],
        videos: statsData.recentActivity || [],
        total: statsData.stats.totalAnalyzed,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const categoryData = data?.stats.categoryBreakdown 
    ? Object.entries(data.stats.categoryBreakdown).map(([name, value]) => ({ name, value }))
    : [];

  const riskData = data?.stats.riskLevelBreakdown
    ? Object.entries(data.stats.riskLevelBreakdown).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-slate-400">Content moderation analytics and insights</p>
      </div>

      {data?.redZoneVideos && data.redZoneVideos.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">🚨</span>
            <h2 className="text-xl font-bold text-red-400">Critical Content</h2>
            <Badge variant="critical">{data.redZoneVideos.length}</Badge>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {data.redZoneVideos.slice(0, 4).map((video: any) => (
              <Card key={video.id} redZone>
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{video.title}</p>
                    <p className="text-slate-400 text-sm">{video.channel_name}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="danger">{video.analysis?.category}</Badge>
                      <Badge variant="critical">Score: {video.analysis?.risk_score}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button size="sm" variant="danger">Remove</Button>
                    <Button size="sm" variant="success">Approve</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Analyzed</p>
              <p className="text-3xl font-bold text-white">{data?.stats.totalAnalyzed || 0}</p>
            </div>
            <div className="text-4xl">📊</div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">RED ZONE</p>
              <p className="text-3xl font-bold text-red-400">{data?.stats.redZoneCount || 0}</p>
            </div>
            <div className="text-4xl">🚨</div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">High Risk</p>
              <p className="text-3xl font-bold text-orange-400">
                {(data?.stats.riskLevelBreakdown?.High || 0) + (data?.stats.riskLevelBreakdown?.CRITICAL || 0)}
              </p>
            </div>
            <div className="text-4xl">⚠️</div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Safe Content</p>
              <p className="text-3xl font-bold text-emerald-400">
                {data?.stats.riskLevelBreakdown?.Low || 0}
              </p>
            </div>
            <div className="text-4xl">✅</div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">Analysis Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.trendData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="date" 
                  stroke="#94A3B8" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis stroke="#94A3B8" tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '8px' }}
                  labelStyle={{ color: '#F8FAFC' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">Category Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {categoryData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                <span className="text-sm text-slate-400">{entry.name}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">Risk Level Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94A3B8" tick={{ fontSize: 12 }} />
                <YAxis stroke="#94A3B8" tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #475569', borderRadius: '8px' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {riskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getRiskLevelColor(entry.name)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">Category Breakdown</h3>
          <div className="space-y-4">
            {Object.entries(data?.stats.categoryBreakdown || {}).map(([category, count]) => (
              <div key={category} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getCategoryColor(category) }}></div>
                  <span className="text-slate-300">{category}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full"
                      style={{ 
                        width: `${data ? (count as number / data.stats.totalAnalyzed * 100) : 0}%`,
                        backgroundColor: getCategoryColor(category)
                      }}
                    />
                  </div>
                  <span className="text-white font-medium w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
          <div className="flex gap-4">
            <Select
              options={[
                { value: '', label: 'All Categories' },
                { value: 'Safe', label: 'Safe' },
                { value: 'Hate Speech', label: 'Hate Speech' },
                { value: 'Spam', label: 'Spam' },
                { value: 'Violence', label: 'Violence' },
              ]}
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="w-40"
            />
            <Select
              options={[
                { value: '', label: 'All Risk Levels' },
                { value: 'Low', label: 'Low' },
                { value: 'Medium', label: 'Medium' },
                { value: 'High', label: 'High' },
                { value: 'CRITICAL', label: 'CRITICAL' },
              ]}
              value={filters.risk_level}
              onChange={(e) => setFilters({ ...filters, risk_level: e.target.value })}
              className="w-40"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Video</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Channel</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Category</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Risk Score</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Level</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Action</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {data?.recentActivity?.map((video: any) => (
                <tr key={video.id} className="border-b border-slate-700/50 hover:bg-slate-800/50">
                  <td className="py-3 px-4">
                    <div className="max-w-xs truncate text-white">{video.title}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-300">{video.channel_name}</td>
                  <td className="py-3 px-4">
                    <Badge 
                      variant={video.analysis?.category === 'Safe' ? 'success' : 'danger'}
                    >
                      {video.analysis?.category}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <span 
                      className="font-medium"
                      style={{ color: getRiskLevelColor(video.analysis?.risk_level) }}
                    >
                      {video.analysis?.risk_score}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <Badge 
                      variant={
                        video.analysis?.risk_level === 'CRITICAL' ? 'critical' :
                        video.analysis?.risk_level === 'High' ? 'danger' :
                        video.analysis?.risk_level === 'Medium' ? 'warning' : 'success'
                      }
                    >
                      {video.analysis?.risk_level}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <Badge 
                      variant={
                        video.analysis?.action === 'Remove' ? 'danger' :
                        video.analysis?.action === 'Review' ? 'warning' : 'success'
                      }
                    >
                      {video.analysis?.action}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-sm">
                    {formatDateTime(video.created_at)}
                  </td>
                </tr>
              ))}
              {(!data?.recentActivity || data.recentActivity.length === 0) && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No videos analyzed yet. Go to Home to analyze a video.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}