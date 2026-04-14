-- Snappr Sales Intelligence: sn_ prefixed tables
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)

-- Feed cache: stores the latest feed fetch results
CREATE TABLE IF NOT EXISTS sn_feed_cache (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  companies jsonb NOT NULL DEFAULT '[]'::jsonb,
  fetched_at timestamptz NOT NULL DEFAULT now()
);

-- Company intel: caches AI-analyzed company intelligence
CREATE TABLE IF NOT EXISTS sn_company_intel (
  company text PRIMARY KEY,
  intel jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_analyzed_at timestamptz NOT NULL DEFAULT now()
);

-- Signal timeline: individual signals per company
CREATE TABLE IF NOT EXISTS sn_signal_timeline (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company text NOT NULL,
  signal_text text NOT NULL,
  signal_type text,
  source_url text,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company, signal_text)
);

-- Index for fast timeline lookups
CREATE INDEX IF NOT EXISTS idx_sn_signal_timeline_company ON sn_signal_timeline(company);

-- RLS policies (enable RLS but allow full access via service role)
ALTER TABLE sn_feed_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE sn_company_intel ENABLE ROW LEVEL SECURITY;
ALTER TABLE sn_signal_timeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access on sn_feed_cache" ON sn_feed_cache FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access on sn_company_intel" ON sn_company_intel FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access on sn_signal_timeline" ON sn_signal_timeline FOR ALL USING (true) WITH CHECK (true);
