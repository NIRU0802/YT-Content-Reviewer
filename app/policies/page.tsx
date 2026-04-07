'use client';

import React from 'react';
import { Card } from '@/components/ui';

export default function PoliciesPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Policies</h1>
        <p className="text-slate-400">Content moderation policies and guidelines</p>
      </div>

      <div className="max-w-4xl space-y-6">
        <Card>
          <h2 className="text-xl font-bold text-white mb-4">Content Policy</h2>
          <div className="space-y-4 text-slate-300">
            <h3 className="text-lg font-semibold text-white">Prohibited Content</h3>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Hate Speech:</strong> Content that promotes violence or discrimination against individuals based on race, ethnicity, religion, gender, sexual orientation, disability, or national origin.</li>
              <li><strong>Violence:</strong> Content depicting or encouraging physical harm, self-harm, or threats of violence against individuals or groups.</li>
              <li><strong>Spam:</strong> Repetitive, misleading, or deceptive content designed to manipulate engagement or distribute malware.</li>
              <li><strong>Harassment:</strong> Content intended to intimidate, shame, or demean individuals.</li>
            </ul>

            <h3 className="text-lg font-semibold text-white mt-6">Risk Classification</h3>
            <div className="bg-slate-900/50 rounded-lg p-4">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-2 text-slate-400">Risk Level</th>
                    <th className="text-left py-2 text-slate-400">Score Range</th>
                    <th className="text-left py-2 text-slate-400">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-700/50">
                    <td className="py-2 text-red-400">CRITICAL</td>
                    <td className="py-2">80-100</td>
                    <td className="py-2">Remove Immediately</td>
                  </tr>
                  <tr className="border-b border-slate-700/50">
                    <td className="py-2 text-orange-400">High</td>
                    <td className="py-2">51-79</td>
                    <td className="py-2">Review Required</td>
                  </tr>
                  <tr className="border-b border-slate-700/50">
                    <td className="py-2 text-amber-400">Medium</td>
                    <td className="py-2">26-50</td>
                    <td className="py-2">Review Recommended</td>
                  </tr>
                  <tr className="border-b border-slate-700/50">
                    <td className="py-2 text-emerald-400">Low</td>
                    <td className="py-2">0-25</td>
                    <td className="py-2">Allow</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-lg font-semibold text-white mt-6">RED ZONE Criteria</h3>
            <p>Content is flagged as RED ZONE (Critical Priority) when:</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>Risk Score ≥ 80</li>
              <li>Hate Speech detected with confidence ≥ 80%</li>
              <li>Violent content at CRITICAL risk level</li>
            </ul>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold text-white mb-4">Privacy Policy</h2>
          <div className="space-y-4 text-slate-300">
            <h3 className="text-lg font-semibold text-white">Data Collection</h3>
            <p>
              Content Guardian processes video metadata and comments solely for content moderation purposes. 
              We do not store personal information beyond what is necessary for analyzing and reviewing content.
            </p>

            <h3 className="text-lg font-semibold text-white mt-6">Data Retention</h3>
            <p>
              Analysis results and review decisions are retained for Trust & Safety operations. 
              Raw video data is processed in real-time and not persistently stored beyond the analysis session.
            </p>

            <h3 className="text-lg font-semibold text-white mt-6">Third-Party Services</h3>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Supabase:</strong> Database for storing analysis results</li>
              <li><strong>Google Sheets:</strong> Optional sync for audit logging</li>
              <li><strong>YouTube Data API:</strong> Video metadata retrieval</li>
              <li><strong>OpenAI:</strong> AI-powered content analysis</li>
            </ul>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold text-white mb-4">Review Guidelines</h2>
          <div className="space-y-4 text-slate-300">
            <h3 className="text-lg font-semibold text-white">Manual Review Process</h3>
            <ol className="list-decimal list-inside space-y-2">
              <li>Review the AI analysis and risk score</li>
              <li>Examine the video content and comments</li>
              <li>Consider context (educational, news, entertainment)</li>
              <li>Make a determination: Allow, Remove, or Escalate</li>
              <li>Document reasoning in review notes</li>
            </ol>

            <h3 className="text-lg font-semibold text-white mt-6">Escalation Criteria</h3>
            <p>Content should be escalated when:</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>Complex legal or policy questions arise</li>
              <li>High-profile or controversial content</li>
              <li>Unclear categorization from AI analysis</li>
              <li>Potential regulatory concerns</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}