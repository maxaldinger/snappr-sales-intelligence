import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: Request) {
  try {
    const { notes, dealName } = await request.json()
    if (!notes) return NextResponse.json({ error: 'notes is required' }, { status: 400 })

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: `You are a product-fit analysis expert for Snappr photography sales. Evaluate prospects against Snappr's service tiers:

- Starter ($150-400/shoot): One-off on-demand photography (real estate, headshots, product, events)
- Business ($2,500-6,500/month): Monthly retainer for recurring needs, dedicated account manager
- Enterprise (Custom): Annual contracts, global coverage, SLA guarantees, API integration

Evaluate fit across these Snappr-specific categories:
1. Visual Content Volume - How many photos/shoots do they need monthly?
2. Geographic Coverage - Do they need photographers in multiple markets?
3. Content Consistency - Do they need brand-consistent photography at scale?
4. Speed/Turnaround - Is fast delivery critical for their business?
5. Budget Alignment - Does their likely spend match a Snappr tier?
6. Competitive Displacement - Are they using competitors we can displace?

Also evaluate fit for each Snappr product tier (Starter, Business, Enterprise, Add-ons).

Return ONLY valid JSON:
{
  "results": {
    "overall_score": number (0-100),
    "overall_label": "Strong Fit|Moderate Fit|Weak Fit|Not a Fit",
    "overall_summary": "2-3 sentence summary",
    "products": [{"product": "name", "score": number, "fit_label": "Strong|Moderate|Weak", "reasoning": "why", "evidence": ["point"]}],
    "discovery_gaps": [{"area": "category", "question": "what to ask", "why_important": "why"}],
    "red_flags": [{"flag": "name", "severity": "high|medium|low", "detail": "explanation"}]
  }
}`,
      messages: [{ role: 'user', content: `Analyze product fit${dealName ? ` for "${dealName}"` : ''} based on:\n\n${notes}` }],
    })

    const textBlock = response.content.find(b => b.type === 'text')
    let raw = textBlock?.text || '{}'
    raw = raw.replace(/```json|```/g, '').trim()
    if (!raw.startsWith('{')) { const i = raw.indexOf('{'); if (i >= 0) raw = raw.slice(i) }
    if (!raw.endsWith('}')) { const i = raw.lastIndexOf('}'); if (i > 0) raw = raw.slice(0, i + 1) }

    let parsed
    try { parsed = JSON.parse(raw) } catch { return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 502 }) }
    return NextResponse.json(parsed)
  } catch (error: unknown) {
    console.error('sa-product-fit error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 })
  }
}
