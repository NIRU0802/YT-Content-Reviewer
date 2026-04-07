# Content Guardian – AI-Powered Trust & Safety Moderation System

## 1. Project Overview

**Project Name:** Content Guardian  
**Type:** Full-stack Web Application  
**Core Functionality:** AI-powered content moderation system that analyzes YouTube videos for trust & safety concerns, classifies risk levels, and prioritizes critical content through a RED ZONE system.  
**Target Users:** Trust & Safety teams, content moderators, platform administrators

---

## 2. UI/UX Specification

### Layout Structure

**Global Layout:**
- Fixed sidebar navigation (280px width on desktop)
- Main content area with max-width 1400px
- Responsive: sidebar collapses to hamburger menu on mobile (<768px)

**Page Sections:**
- Sidebar: Logo, navigation links, user profile
- Header: Page title, breadcrumbs, action buttons
- Content: Dynamic based on page
- Footer: Minimal, copyright only

### Visual Design

**Color Palette:**
```
Primary:        #1E3A5F (Deep Navy)
Secondary:      #3B82F6 (Electric Blue)
Accent:         #10B981 (Emerald Green)
Danger:         #EF4444 (Red)
Warning:        #F59E0B (Amber)
Background:     #0F172A (Dark Slate)
Surface:        #1E293B (Slate)
Surface Light:  #334155 (Slate 700)
Text Primary:   #F8FAFC (White)
Text Secondary: #94A3B8 (Slate 400)
Border:         #475569 (Slate 600)
```

**RED ZONE Specific:**
- Red Zone Border: #DC2626 (Red 600)
- Red Zone Background: rgba(220, 38, 38, 0.1)
- Critical Badge: #B91C1C (Red 700)

**Typography:**
- Font Family: "Inter", "SF Pro Display", system-ui
- Headings: 
  - H1: 32px, font-weight 700
  - H2: 24px, font-weight 600
  - H3: 18px, font-weight 600
- Body: 14px, font-weight 400
- Small: 12px, font-weight 400

**Spacing System:**
- Base unit: 4px
- Common: 8px, 12px, 16px, 24px, 32px, 48px

**Visual Effects:**
- Card shadows: 0 4px 6px -1px rgba(0, 0, 0, 0.3)
- Hover transitions: 150ms ease-in-out
- Border radius: 8px (cards), 6px (buttons), 4px (inputs)
- Gradient accents on key elements

### Components

**Navigation Sidebar:**
- Logo at top
- Nav items: Home, Dashboard, Reviews, Policies
- Active state: left border accent, background highlight
- Hover: subtle background change

**URL Input Component:**
- Large input field with placeholder
- "Analyze Video" button (primary)
- Loading state with spinner
- Error state with red border and message

**Result Card:**
- Video thumbnail (if available)
- Channel name, title display
- Category badge (color-coded)
- Risk score meter (0-100)
- Risk level badge (Low/Medium/High/CRITICAL)
- Action badge (Allow/Review/Remove)
- Explanation text
- RED ZONE banner when applicable

**Dashboard Cards:**
- Stats cards with icon, value, label
- Charts container with title
- Data table with sorting/filtering

**Review Panel:**
- List view of flagged content
- Quick action buttons (Remove/Approve/Escalate)
- Notes input field
- Filter dropdowns

**Filter Bar:**
- Category dropdown
- Risk level dropdown
- RED ZONE toggle
- Date range picker
- Search input

---

## 3. Functionality Specification

### Core Features

**1. YouTube Video Analysis**
- Input: YouTube URL (various formats supported)
- Extract: videoId, title, description, channelName, top 20 comments
- Validate URL format before processing
- Handle API errors gracefully

**2. AI Analysis Engine**
- Combine title + description + comments for analysis
- Use OpenAI GPT-4 or Gemini for classification
- Categories: Hate Speech, Spam, Violence, Safe
- Return confidence score (0-1)
- Provide human-readable explanation

**3. Risk Engine**
- Base scores by category:
  - Hate Speech: 70
  - Violence: 60
  - Spam: 40
  - Safe: 10
- Adjustments:
  - Strong keywords: +10 to +20
  - Repeated patterns: +10
  - High confidence: +5
- Final risk_score: 0-100
- Risk levels:
  - 0-25: Low
  - 26-50: Medium
  - 51-79: High
  - 80-100: CRITICAL

**4. Policy Engine**
- Mapping:
  - CRITICAL risk → REMOVE
  - High risk → REVIEW
  - Medium risk → REVIEW
  - Low risk → ALLOW
- Additional rules:
  - Hate Speech (any confidence > 0.7) → REVIEW
- Return action and reason

**5. RED ZONE Engine**
- Triggers:
  - risk_score >= 80 OR
  - category = "Hate Speech" AND confidence > 0.8
- Actions when triggered:
  - Set red_zone = true
  - Add to priority_review_queue
  - Mark for immediate attention

**6. Database Operations (Supabase)**
- Store videos, analysis results, reviews
- Query with filters and pagination
- Update review status

**7. Google Sheets Sync**
- Append row after each analysis
- Columns: Title, Channel, Category, Risk Score, Action, Date
- Handle sync failures gracefully

**8. Dashboard Analytics**
- Total analyzed count
- Category breakdown
- Risk level distribution
- Trends over time (line chart)
- Recent activity table

### User Interactions

- Enter URL → Click Analyze → View Results
- View Dashboard → Filter data → View details
- Review flagged content → Take action → Add notes
- Search and filter across all data

### Data Handling

- Client-side state: React Query for server state, Zustand for UI state
- Server-side: API routes for all operations
- Database: Supabase PostgreSQL
- External APIs: YouTube Data API v3, OpenAI API

### Edge Cases

- Invalid URL format → Show error message
- YouTube API failure → Show retry option
- AI API failure → Show fallback message
- Empty comments → Analyze title/description only
- Rate limiting → Queue and retry
- Network errors → Show offline message

---

## 4. Technical Architecture

### Directory Structure
```
/app
  /api
    /analyze/route.ts
    /videos/route.ts
    /reviews/route.ts
    /sheets/route.ts
  /dashboard/page.tsx
  /review/page.tsx
  /policies/page.tsx
  /layout.tsx
  /page.tsx
/components
  /ui (Button, Input, Card, Badge, etc.)
  /layout (Sidebar, Header, Footer)
  /dashboard (StatsCard, ChartContainer, DataTable)
  /analysis (VideoCard, RiskMeter, ActionBadge)
/lib
  /supabase.ts
  /utils.ts
/analysis
  /riskEngine.ts
  /policyEngine.ts
  /aiAnalyzer.ts
/services
  /youtubeService.ts
  /sheetService.ts
/types
  /index.ts
```

### API Endpoints

- POST /api/analyze - Analyze YouTube video
- GET /api/videos - List videos (with filters)
- GET /api/videos/[id] - Get single video
- POST /api/reviews - Create review
- PATCH /api/reviews/[id] - Update review
- GET /api/stats - Get dashboard stats

### Database Schema

```sql
-- videos table
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  video_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  channel_name TEXT NOT NULL,
  comments TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- analysis table
CREATE TABLE analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  confidence DECIMAL(3,2) NOT NULL,
  risk_score INTEGER NOT NULL,
  risk_level TEXT NOT NULL,
  action TEXT NOT NULL,
  reason TEXT,
  red_zone BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- reviews table
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  final_action TEXT NOT NULL,
  reviewer_note TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 5. Acceptance Criteria

### Must Have
- [ ] URL input accepts YouTube URLs
- [ ] Video metadata extracted correctly
- [ ] AI analysis returns category + confidence + explanation
- [ ] Risk engine calculates score (0-100)
- [ ] Policy engine suggests action
- [ ] RED ZONE triggers for high-risk content
- [ ] Data stored in Supabase
- [ ] Dashboard shows stats and charts
- [ ] Review panel allows manual override
- [ ] Filters work on dashboard

### Visual Checkpoints
- [ ] Dark theme applied consistently
- [ ] RED ZONE content has red border and warning badge
- [ ] Risk meter shows color gradient
- [ ] Charts render with proper data
- [ ] Responsive layout works on mobile
- [ ] Loading states show spinners
- [ ] Error states show messages

### Performance
- [ ] API response < 2 seconds
- [ ] Dashboard loads < 1 second
- [ ] Pagination works for large datasets
