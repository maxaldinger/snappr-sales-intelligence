# Snappr Account Intelligence

Real-time enterprise buying signal dashboard built for Snappr's Senior Enterprise AE role. Surfaces actionable signals from Google News, USASpending.gov, and job posting data across six enterprise verticals, scored by signal strength and enriched with AI-generated account briefs via Claude.

## Architecture

```
Client (Next.js App Router)
  |
  ├── /api/signals/[vertical]   ← data pipeline: cache check → fan-out fetch → score → upsert
  └── /api/generate-brief       ← Claude Haiku on-demand brief generation + cache
  |
  ├── Google News RSS            (news signals)
  ├── USASpending.gov API        (government contracts)
  └── Google News RSS + job terms (hiring signals)
  |
  └── Supabase (cache layer, 4-hour TTL)
```

## Setup

### 1. Environment

Create `.env.local` in the project root:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### 2. Database

Run the migration against your Supabase project (SQL Editor in dashboard):

```sql
-- paste contents of snappr_migration.sql
```

This creates the `snappr_signals` table with indexes and RLS policies. Safe to run alongside existing tables.

### 3. Install & Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Verticals

| Tab | Target ICP | Key Signals |
|-----|-----------|-------------|
| E-commerce & Retail | DTC brands, catalog-scale retailers | Product line launches, rebrands, Creative Director hires |
| Real Estate & PropTech | Brokerages, iBuyers, listing platforms | Market expansion, listing volume spikes, platform fundraises |
| Hospitality & Travel | Hotel chains, OTAs, property managers | Hotel openings, brand refreshes, OTA content partnerships |
| Food & Beverage | CPG brands, restaurant chains, DTC food | Product launches, chain expansion, menu rebrands |
| Marketplace & Platform | Creator economy, gig platforms | UGC-to-pro shifts, visual standards, marketplace launches |
| Financial Services | Fintechs, wealth platforms | Rebrands, IPO prep, Series B+ brand refreshes |

## Signal Scoring

- Base score from recency (today = 10, this week = 7, this month = 4)
- Keyword density bonus (+1 per match, max +3)
- Source credibility multiplier (news = 1.2x, gov = 1.1x, jobs = 1.0x)
- Final score 1-10, drives sort order and color coding

## Deploy to Vercel

```bash
npm i -g vercel
vercel --prod
```

Set the four environment variables in Vercel project settings. Zero backend servers needed.

## Tech Stack

- Next.js 14 (App Router)
- Supabase (Postgres cache)
- Claude Haiku (AI briefs)
- Tailwind CSS
- TypeScript
