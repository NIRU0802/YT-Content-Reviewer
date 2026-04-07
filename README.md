# 🛡️ Content Guardian

> AI-Powered Trust & Safety Content Moderation System

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.2.2-black?style=for-the-badge&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge">
</p>

---

## ✨ Features

### 🔍 Smart Video Analysis
Automatically analyze YouTube videos for policy compliance and content safety using advanced AI classification.

### ⚡ RED ZONE Detection
Priority detection system that instantly flags critical content requiring immediate attention.

### 📊 Real-time Analytics
Comprehensive dashboard with risk scores, category breakdowns, and trend analysis.

### 📋 Review Queue
Efficient workflow for content reviewers to process and manage flagged videos.

---

## 🏗️ Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Backend   │────▶│   Services  │
│   (Next.js) │     │   (API)     │     │   (AI/DB)   │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
   Dashboard           Routes            YouTube API
   Analysis UI      Review Queue        Supabase DB
```

### Tech Stack
- **Frontend**: Next.js 16, React 19, TypeScript
- **UI**: MUI, Tailwind CSS, Recharts
- **Backend**: Next.js API Routes
- **Database**: Supabase
- **State**: Zustand
- **API**: React Query

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18.x or 20.x (LTS)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/NIRU0802/YT-Content-Reviewer.git

# Navigate to project
cd YT-Content-Reviewer

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📖 How It Works

### 1. Video Analysis
Paste a YouTube URL and click **Analyze Video**. The system will:
- Fetch video metadata (title, channel, description)
- Run AI-powered content classification
- Calculate risk scores (0-100)
- Determine appropriate action (Approve/Review/Remove)

### 2. Risk Assessment
| Risk Level | Score Range | Action |
|------------|-------------|--------|
| 🟢 Safe    | 0-49        | Approve |
| 🟡 Medium  | 50-79       | Review  |
| 🔴 High    | 80-89       | Review  |
| 🔴 CRITICAL| 90-100      | Remove  |

### 3. RED ZONE
Critical content is automatically flagged for priority review based on:
- Policy violations
- Dangerous content indicators
- Hate speech detection
- Explicit material flags

---

## 📁 Project Structure

```
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── dashboard/         # Analytics Dashboard
│   ├── review/            # Review Queue
│   └── page.tsx           # Main Analysis UI
├── components/            # React Components
│   └── ui/                # Reusable UI Components
├── lib/                   # Utilities & Helpers
├── services/              # External API Services
├── analysis/              # AI Analysis Engines
└── types/                 # TypeScript Definitions
```

---

## 🔧 Configuration

Create a `.env.local` file with your credentials:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# YouTube API (optional - uses fallback)
YOUTUBE_API_KEY=your_youtube_api_key
```

---

## 📝 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analyze` | POST | Analyze a YouTube video |
| `/api/videos` | GET | List all analyzed videos |
| `/api/reviews` | GET/POST | Manage review queue |
| `/api/stats` | GET | Get analytics statistics |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request

---

## 📄 License

MIT License - feel free to use this project for any purpose.

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org) - The React Framework
- [Vercel](https://vercel.com) - Deployment Platform
- [Supabase](https://supabase.io) - Open Source Firebase Alternative