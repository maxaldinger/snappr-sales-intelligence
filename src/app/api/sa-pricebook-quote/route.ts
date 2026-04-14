import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: Request) {
  try {
    const { lineItems, dealName, discountPct } = await request.json()
    if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
      return NextResponse.json({ error: 'lineItems array is required' }, { status: 400 })
    }

    const lineItemsList = lineItems.map((item: any) =>
      `- ${item.product || 'Unknown'}${item.quantity ? ` x${item.quantity}` : ''}${item.unitPrice ? ` @ $${item.unitPrice.toLocaleString()}` : ''}${item.total ? ` = $${item.total.toLocaleString()}` : ''}`
    ).join('\n')

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      system: `You are an expert at generating professional quote summaries for Snappr photography deals. Analyze line items and create clear, compelling quote summaries.

Snappr tiers: Starter ($150-400/shoot), Business ($2,500-6,500/month retainer), Enterprise (custom annual).

Return ONLY valid JSON:
{
  "summary": "2-3 paragraph professional summary of the quote",
  "notes": ["important note 1", "note 2", "note 3"]
}`,
      messages: [{ role: 'user', content: `Generate a quote summary${dealName ? ` for "${dealName}"` : ''} with:\n\n${lineItemsList}${discountPct ? `\n\nDiscount: ${discountPct}%` : ''}` }],
    })

    const textBlock = response.content.find(b => b.type === 'text')
    let raw = textBlock?.text || '{}'
    raw = raw.replace(/```json|```/g, '').trim()

    let parsed
    try { parsed = JSON.parse(raw) } catch { return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 502 }) }
    return NextResponse.json(parsed)
  } catch (error: unknown) {
    console.error('sa-pricebook-quote error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 })
  }
}
