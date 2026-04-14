import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getDb, INTEL_TTL_HOURS } from '@/lib/db'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function scrapeWebsite(company: string): Promise<string> {
  const slug = company.toLowerCase().replace(/[^a-z0-9]/g, '')
  for (const ext of ['.com', '.io', '.co']) {
    try {
      const res = await fetch(`https://www.${slug}${ext}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SnapprIntel/1.0)' },
        signal: AbortSignal.timeout(6000),
      })
      if (!res.ok) continue
      const html = await res.text()
      return html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 4000)
    } catch { continue }
  }
  return ''
}

async function fetchNews(company: string): Promise<string[]> {
  try {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(company + ' photography content visual')}&hl=en-US&gl=US&ceid=US:en`
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
      const t = match[1].trim()
      if (t && t !== 'Google News') titles.push(t)
    }
    return titles.slice(0, 5)
  } catch { return [] }
}

async function fetchContracts(company: string): Promise<string[]> {
  try {
    const res = await fetch('https://api.usaspending.gov/api/v2/search/spending_by_award/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(10000),
      body: JSON.stringify({
        filters: { keywords: [company], award_type_codes: ['A', 'B', 'C', 'D'] },
        fields: ['Award ID', 'Recipient Name', 'Description', 'Award Amount'],
        page: 1, limit: 3, sort: 'Award Amount', order: 'desc',
      }),
    })
    if (!res.ok) return []
    const data = await res.json()
    return (data.results || []).map((a: any) =>
      `${a['Recipient Name']}: ${a['Description']} ($${a['Award Amount']})`
    )
  } catch { return [] }
}

export async function POST(request: Request) {
  const { company } = await request.json()
  if (!company) return NextResponse.json({ error: 'Company required' }, { status: 400 })

  const db = getDb()

  let cached: any = null
  try {
    const { data } = await db
      .from('sn_company_intel')
      .select('intel, last_analyzed_at')
      .eq('company', company)
      .single()
    cached = data

    if (cached?.intel) {
      const age = (Date.now() - new Date(cached.last_analyzed_at).getTime()) / 3600000
      if (age < INTEL_TTL_HOURS) return NextResponse.json({ intel: cached.intel, cached: true })
    }
  } catch { /* table may not exist */ }

  try {
    const [website, news, contracts] = await Promise.all([
      scrapeWebsite(company), fetchNews(company), fetchContracts(company),
    ])

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: `You are a sales intelligence analyst for Snappr, a professional photography services company. Snappr offers:
- Starter: ~$150-400/shoot (real estate, headshots, product, events)
- Business: Monthly retainer packages for recurring photography needs
- Enterprise: Custom annual contracts with global coverage, SLAs, API integration

Analyze this company and produce a sales intelligence brief focused on their visual content and photography needs.

Return ONLY valid JSON with no markdown fences:
{
  "company_name": "string",
  "ticker": "string or empty",
  "hq": "City, State",
  "primary_vertical": "E-Commerce|Real Estate|Food & Hospitality|Fintech|Travel & Lifestyle|DTC Brands",
  "relevance_score": number (0-100, how much they need Snappr),
  "relevance_label": "Hot Lead|Strong Fit|Moderate Fit|Low Fit",
  "relevance_color": "green|yellow|orange|red",
  "snapshot": "2-3 sentence company overview focused on their content needs",
  "snappr_fit": "Why Snappr is a good fit for this company",
  "visual_content_need": "What visual content/photography this company needs",
  "signals": [{"type": "news|job|contract|funding|expansion", "text": "signal text", "urgency": "high|medium|low"}],
  "target_contacts": [{"title": "Job Title", "department": "Dept", "why_target": "reason", "linkedin_search": "search query"}],
  "outreach_angle": "2-3 sentences: the pitch angle for this prospect",
  "email_subject": "Cold email subject line",
  "talking_points": ["point 1", "point 2", "point 3"],
  "competitor_risk": "competing vendors they might use",
  "risk_flags": ["risk 1", "risk 2"]
}`,
      messages: [{
        role: 'user',
        content: `Company: ${company}\n\nWebsite content:\n${website || '(not available)'}\n\nRecent news:\n${news.join('\n') || '(none)'}\n\nGov contracts:\n${contracts.join('\n') || '(none)'}`,
      }],
    })

    const textBlock = response.content.find(b => b.type === 'text')
    let raw = textBlock?.text || '{}'
    raw = raw.replace(/```json|```/g, '').trim()
    if (!raw.startsWith('{')) { const idx = raw.indexOf('{'); if (idx >= 0) raw = raw.slice(idx) }
    if (!raw.endsWith('}')) { const idx = raw.lastIndexOf('}'); if (idx > 0) raw = raw.slice(0, idx + 1) }

    let intel
    try { intel = JSON.parse(raw) } catch { intel = null }

    if (intel) {
      try {
        if (intel.signals) {
          for (const s of intel.signals) {
            await db.from('sn_signal_timeline').upsert(
              { company, signal_text: s.text?.slice(0, 500), signal_type: s.type || 'news', source_url: '' },
              { onConflict: 'company,signal_text' }
            )
          }
        }
        await db.from('sn_company_intel').upsert(
          { company, intel, last_analyzed_at: new Date().toISOString() },
          { onConflict: 'company' }
        )
      } catch { /* table may not exist */ }
    }

    return NextResponse.json({ intel: intel || cached?.intel })
  } catch (err) {
    console.error('Analyze error:', err)
    if (cached?.intel) return NextResponse.json({ intel: cached.intel, stale: true })
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}
