import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "@/lib/supabase";
import { VERTICALS } from "@/lib/verticals";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  const { signalId, accountName, headline, source, vertical } =
    await request.json();

  // Check if brief already cached
  if (signalId) {
    const { data: existing } = await supabaseAdmin
      .from("snappr_signals")
      .select("brief")
      .eq("id", signalId)
      .single();

    if (existing?.brief) {
      return NextResponse.json({ brief: existing.brief });
    }
  }

  const verticalName = VERTICALS[vertical]?.name || vertical;

  const prompt = `You are a sales intelligence analyst for Snappr, an on-demand enterprise visual content platform that connects brands to vetted photographers, videographers, and creative talent globally. Enterprise clients use Snappr for product photography, real estate listings, food & beverage shoots, events, and brand campaigns at scale.

Given this buying signal, generate a structured account intelligence brief for a senior enterprise Account Executive.

Account: ${accountName}
Signal: ${headline}
Source Type: ${source}
Vertical: ${verticalName}

Generate the brief with these exact sections. Be concise, specific, and actionable.

## Why They Need Snappr Now
2-3 sentences tying the specific signal to Snappr's value prop.

## Primary Use Case
One of: Product Photography / Real Estate Photography / Food & Beverage Photography / Event Photography / Brand Campaign Photography. 1 sentence of reasoning.

## Estimated Volume Tier
SMB (<50 shoots/year), Mid-Market (50-500 shoots/year), or Enterprise (500+ shoots/year). Brief reasoning.

## Lead Differentiator
Which Snappr strength to lead with: On-demand speed, Global photographer network, Fully managed service, or API integration for at-scale ordering. 1 sentence of context.

## Outreach Angle
1-2 sentences with a specific, actionable outreach approach tied to this signal.

## Discovery Questions
1. Question specific to the account and signal
2. Question about their current visual content workflow
3. Question about scale and growth plans

## Competitive Displacement
Who they're likely using now (Getty Images, Shutterstock, internal creative team, local freelancers, agency) and how Snappr wins. If net-new need, say so.

Write for a senior AE who opens this before their first call. No fluff.`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const brief =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Cache the brief on the signal record
    if (signalId) {
      await supabaseAdmin
        .from("snappr_signals")
        .update({ brief })
        .eq("id", signalId);
    }

    return NextResponse.json({ brief });
  } catch (err) {
    console.error("Brief generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate brief" },
      { status: 500 }
    );
  }
}
