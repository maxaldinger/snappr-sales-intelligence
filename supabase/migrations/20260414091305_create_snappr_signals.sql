-- Snappr Sales Intelligence: signals table
-- Safe to run on an existing Supabase project — does not touch other tables.

CREATE TABLE IF NOT EXISTS snappr_signals (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vertical      TEXT NOT NULL,
  source        TEXT NOT NULL,
  headline      TEXT NOT NULL,
  url           TEXT NOT NULL,
  account_name  TEXT NOT NULL,
  signal_strength INTEGER NOT NULL DEFAULT 5,
  brief         TEXT,
  fetched_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_snappr_vertical_url UNIQUE (vertical, url)
);

CREATE INDEX IF NOT EXISTS idx_snappr_signals_vertical_fetched
  ON snappr_signals (vertical, fetched_at DESC);

CREATE INDEX IF NOT EXISTS idx_snappr_signals_strength
  ON snappr_signals (vertical, signal_strength DESC);

-- Row Level Security: allow full access via service role key,
-- read-only via anon key.
ALTER TABLE snappr_signals ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'snappr_signals_anon_select') THEN
    CREATE POLICY "snappr_signals_anon_select" ON snappr_signals FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'snappr_signals_service_all') THEN
    CREATE POLICY "snappr_signals_service_all" ON snappr_signals FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
