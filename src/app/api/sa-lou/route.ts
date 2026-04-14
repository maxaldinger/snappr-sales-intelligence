import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: Request) {
  try {
    const { transcript, dealName } = await request.json()
    if (!transcript) return NextResponse.json({ error: 'transcript is required' }, { status: 400 })

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: `You are an expert at creating Letters of Understanding (LOU) for Snappr photography sales.

Snappr offers: Starter ($150-400/shoot), Business (monthly retainer $2,500-6,500), Enterprise (custom annual contracts).

Analyze the meeting notes and extract critical business issues related to visual content and photography needs. For each issue, write a clear response explaining how Snappr addresses it.

Return ONLY valid JSON with no markdown fences:
{ "rows": [{ "id": "row-1", "issue": "string", "response": "string (how Snappr helps)", "category": "Visual Content|Brand Photography|Product Photography|Real Estate|Events|Marketing", "priority": "High|Medium|Low", "timeframe": "Q1|Q2|Q3|Q4" }] }`,
      messages: [{ role: 'user', content: `${dealName ? `Deal: ${dealName}\n\n` : ''}Meeting Notes:\n${transcript}` }],
    })

    const textBlock = response.content.find(b => b.type === 'text')
    let raw = textBlock?.text || '{}'
    raw = raw.replace(/```json|```/g, '').trim()
    if (!raw.startsWith('{')) { const i = raw.indexOf('{'); if (i >= 0) raw = raw.slice(i) }
    if (!raw.endsWith('}')) { const i = raw.lastIndexOf('}'); if (i > 0) raw = raw.slice(0, i + 1) }

    const parsed = JSON.parse(raw)
    return NextResponse.json(parsed)
  } catch (error: unknown) {
    console.error('sa-lou error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 })
  }
}
