import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: Request) {
  try {
    const { notes, products, dealName } = await request.json()
    if (!notes) return NextResponse.json({ error: 'notes is required' }, { status: 400 })

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: `You are an expert proposal writer for Snappr, the world's largest on-demand photography platform. Create compelling proposals that showcase Snappr's photography services (Starter $150-400/shoot, Business $2,500-6,500/month retainer, Enterprise custom annual contracts).

Return ONLY valid JSON with no markdown fences:
{
  "proposal": {
    "title": "Proposal title",
    "date": "${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}",
    "executive_summary": "2-3 paragraphs",
    "business_challenges": [{"challenge": "title", "detail": "explanation"}],
    "recommended_solution": "solution description mentioning specific Snappr tiers",
    "why_snappr": "why Snappr is the best choice",
    "next_steps": [{"step": "title", "description": "detail"}],
    "closing_statement": "closing"
  }
}`,
      messages: [{ role: 'user', content: `${dealName ? `Deal: ${dealName}\n\n` : ''}Notes:\n${notes}${products ? `\n\nSuggested Products:\n${products}` : ''}` }],
    })

    const textBlock = response.content.find(b => b.type === 'text')
    let raw = textBlock?.text || '{}'
    raw = raw.replace(/```json|```/g, '').trim()
    if (!raw.startsWith('{')) { const i = raw.indexOf('{'); if (i >= 0) raw = raw.slice(i) }
    if (!raw.endsWith('}')) { const i = raw.lastIndexOf('}'); if (i > 0) raw = raw.slice(0, i + 1) }

    const parsed = JSON.parse(raw)
    return NextResponse.json(parsed)
  } catch (error: unknown) {
    console.error('sa-proposal error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 })
  }
}
