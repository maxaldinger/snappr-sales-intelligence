import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: Request) {
  try {
    const { contacts, dealName } = await request.json()
    if (!contacts || !Array.isArray(contacts)) return NextResponse.json({ error: 'contacts array is required' }, { status: 400 })

    const contactsList = contacts.map((c: any) =>
      `- ${c.name || 'Unknown'}${c.title ? `, ${c.title}` : ''}${c.role ? ` (${c.role})` : ''}${c.engagement ? ` - Engagement: ${c.engagement}` : ''}${c.notes ? ` - Notes: ${c.notes}` : ''}`
    ).join('\n')

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: `You are a multi-threading analysis expert for Snappr photography sales. Analyze the deal's contact map and identify threading gaps. In photography deals, key stakeholders include: Marketing (brand/creative directors), Operations (content production managers), Procurement, and C-suite sponsors.

Return ONLY valid JSON with no markdown fences:
{
  "health_score": number (0-100),
  "health_label": "Well-Threaded|Moderately Threaded|Under-Threaded|Single-Threaded",
  "summary": "2-3 sentence assessment",
  "contacts": [{"name": "string", "role": "string", "status": "active|at-risk|missing", "action": "recommended action"}],
  "gaps": [{"role": "missing role", "area": "department/function", "recommendation": "how to find/engage", "detail": "why this matters"}],
  "recommendations": ["action item 1", "action item 2", "action item 3"]
}`,
      messages: [{ role: 'user', content: `Analyze threading${dealName ? ` for "${dealName}"` : ''} with these contacts:\n\n${contactsList}` }],
    })

    const textBlock = response.content.find(b => b.type === 'text')
    let raw = textBlock?.text || '{}'
    raw = raw.replace(/```json|```/g, '').trim()
    if (!raw.startsWith('{')) { const i = raw.indexOf('{'); if (i >= 0) raw = raw.slice(i) }
    if (!raw.endsWith('}')) { const i = raw.lastIndexOf('}'); if (i > 0) raw = raw.slice(0, i + 1) }

    return NextResponse.json(JSON.parse(raw))
  } catch (error: unknown) {
    console.error('sa-threading error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 })
  }
}
