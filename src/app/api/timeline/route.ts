import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const company = searchParams.get('company')
  if (!company) return NextResponse.json({ error: 'Company required' }, { status: 400 })

  try {
    const db = getDb()
    const { data, error } = await db
      .from('sn_signal_timeline')
      .select('*')
      .eq('company', company)
      .order('first_seen_at', { ascending: false })
      .limit(50)

    if (error) return NextResponse.json({ timeline: [] })
    return NextResponse.json({ timeline: data || [] })
  } catch { return NextResponse.json({ timeline: [] }) }
}
