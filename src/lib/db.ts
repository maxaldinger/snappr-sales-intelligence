import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _db: SupabaseClient | null = null
let _lastUrl: string | null = null

export function getDb(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key =
    typeof window === 'undefined'
      ? process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  if (_db && _lastUrl === url) return _db
  _db = createClient(url, key)
  _lastUrl = url
  return _db
}

export const FEED_TTL_HOURS = 12
export const INTEL_TTL_HOURS = 24
