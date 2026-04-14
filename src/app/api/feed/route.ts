import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getDb, FEED_TTL_HOURS } from '@/lib/db'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const VERTICALS = [
  {
    id: 'ecommerce',
    label: 'E-Commerce',
    queries: ['ecommerce product photography hiring', 'online retail visual content', 'ecommerce brand photography'],
    govKeywords: ['photography services', 'visual content production'],
  },
  {
    id: 'realestate',
    label: 'Real Estate',
    queries: ['real estate photography hiring', 'property listing photography', 'real estate visual marketing'],
    govKeywords: ['property photography', 'real estate media'],
  },
  {
    id: 'food',
    label: 'Food & Hospitality',
    queries: ['food photography hiring', 'restaurant photography content', 'hospitality brand photography'],
    govKeywords: ['food photography services', 'restaurant media production'],
  },
  {
    id: 'fintech',
    label: 'Fintech',
    queries: ['fintech brand photography', 'financial services creative content', 'fintech marketing photography'],
    govKeywords: ['creative services', 'brand photography'],
  },
  {
    id: 'travel',
    label: 'Travel & Lifestyle',
    queries: ['travel photography hiring', 'hotel photography content', 'lifestyle brand photography'],
    govKeywords: ['travel photography services', 'tourism media'],
  },
  {
    id: 'dtc',
    label: 'DTC Brands',
    queries: ['DTC brand photography', 'direct to consumer product photos', 'DTC visual content strategy'],
    govKeywords: ['product photography', 'media production'],
  },
]

function getDateMonthsAgo(months: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() - months)
  return d.toISOString().split('T')[0]
}

async function fetchRSS(query: string): Promise<string[]> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SnapprIntel/1.0)' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return []
    const xml = await res.text()
    const titles: string[] = []
    const regex = /<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/g
    let match
    while ((match = regex.exec(xml)) !== null) {
      const title = match[1].trim()
      if (title && title !== 'Google News' && !title.startsWith('Search')) titles.push(title)
    }
    return titles.slice(0, 8)
  } catch { return [] }
}

async function fetchGovContracts(): Promise<string[]> {
  try {
    const res = await fetch('https://api.usaspending.gov/api/v2/search/spending_by_award/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(10000),
      body: JSON.stringify({
        filters: {
          keywords: ['photography services', 'visual content', 'media production', 'creative services'],
          time_period: [{ start_date: getDateMonthsAgo(12), end_date: new Date().toISOString().split('T')[0] }],
          award_type_codes: ['A', 'B', 'C', 'D'],
        },
        fields: ['Award ID', 'Recipient Name', 'Description', 'Award Amount', 'Start Date'],
        page: 1,
        limit: 10,
        sort: 'Start Date',
        order: 'desc',
      }),
    })
    if (!res.ok) return []
    const data = await res.json()
    return (data.results || []).map((a: any) =>
      `Gov Contract: ${a['Recipient Name'] || 'Unknown'} — ${a['Description'] || 'Photography services'} ($${a['Award Amount'] || '?'})`
    )
  } catch { return [] }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const force = searchParams.get('force') === '1'
  const db = getDb()

  // Check cache
  if (!force) {
    try {
      const { data: cached } = await db
        .from('sn_feed_cache')
        .select('companies, fetched_at')
        .order('fetched_at', { ascending: false })
        .limit(1)
        .single()

      if (cached?.companies) {
        const age = (Date.now() - new Date(cached.fetched_at).getTime()) / 3600000
        if (age < FEED_TTL_HOURS) {
          return NextResponse.json({ companies: cached.companies, cached: true })
        }
      }
    } catch { /* table may not exist yet */ }
  }

  try {
    // Fetch all RSS feeds + gov contracts in parallel
    const allFetches = VERTICALS.flatMap(v =>
      v.queries.map(q => fetchRSS(q).then(titles => titles.map(t => `[${v.label}] ${t}`)))
    )
    const govFetch = fetchGovContracts()

    const results = await Promise.all([...allFetches, govFetch])
    const allHeadlines = results.flat()

    if (allHeadlines.length === 0) {
      try {
        const { data: stale } = await db.from('sn_feed_cache').select('companies').order('fetched_at', { ascending: false }).limit(1).single()
        return NextResponse.json({ companies: stale?.companies || [], stale: true })
      } catch { return NextResponse.json({ companies: [], stale: true }) }
    }

    // Ask Claude to extract companies
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: `You are a sales intelligence analyst for Snappr, a professional photography services company. Snappr offers on-demand photographers for product, real estate, food, lifestyle, headshot, and event photography.

Extract 15-25 unique companies from these headlines that would be good prospects for Snappr's photography services. Companies that need visual content (e-commerce, real estate, food/hospitality, travel, DTC brands, etc.) are ideal.

Return ONLY a valid JSON array. Each object must have:
- company: string (company name)
- vertical_id: string (one of: ecommerce, realestate, food, fintech, travel, dtc)
- vertical_label: string (human label for the vertical)
- signal_count: number (how many signals found, 1-5)
- top_signal: string (most relevant headline, max 120 chars)
- signal_type: string (news|job|contract|funding|expansion|partnership|leadership)
- urgency: string (high|medium|low — high = active photography/content need)
- amount: string (dollar amount if found, else empty)
- date: string (ISO date if found, else empty)
- why_snappr: string (1-2 sentences: why this company needs Snappr)

No markdown fences. No explanation. Just the JSON array.`,
      messages: [{ role: 'user', content: `Headlines:\n${allHeadlines.join('\n')}` }],
    })

    const textBlock = response.content.find(b => b.type === 'text')
    let raw = textBlock?.text || '[]'

    // Repair JSON
    raw = raw.replace(/```json|```/g, '').trim()
    if (!raw.startsWith('[')) {
      const idx = raw.indexOf('[')
      if (idx >= 0) raw = raw.slice(idx)
    }
    if (!raw.endsWith(']')) {
      const idx = raw.lastIndexOf(']')
      if (idx > 0) raw = raw.slice(0, idx + 1)
    }

    let companies
    try { companies = JSON.parse(raw) } catch { companies = [] }

    // Write signals to timeline (best-effort)
    try {
      for (const c of companies) {
        if (c.company && c.top_signal) {
          await db.from('sn_signal_timeline').upsert(
            { company: c.company, signal_text: c.top_signal.slice(0, 500), signal_type: c.signal_type || 'news', source_url: '' },
            { onConflict: 'company,signal_text' }
          )
        }
      }
    } catch { /* table may not exist */ }

    // Cache (best-effort)
    try {
      await db.from('sn_feed_cache').insert({ companies, fetched_at: new Date().toISOString() })
    } catch { /* table may not exist */ }

    return NextResponse.json({ companies })
  } catch (err) {
    console.error('Feed error:', err)
    try {
      const { data: stale } = await db.from('sn_feed_cache').select('companies').order('fetched_at', { ascending: false }).limit(1).single()
      return NextResponse.json({ companies: stale?.companies || [], error: true })
    } catch { return NextResponse.json({ companies: [], error: true }) }
  }
}
