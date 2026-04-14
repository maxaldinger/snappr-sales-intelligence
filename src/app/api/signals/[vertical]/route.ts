import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { VERTICALS } from "@/lib/verticals";
import { fetchNewsSignals } from "@/lib/fetchers/news";
import { fetchGovSignals } from "@/lib/fetchers/usaspending";
import { fetchJobSignals } from "@/lib/fetchers/jobs";
import { scoreSignal } from "@/lib/scoring";

const CACHE_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

export async function GET(
  request: NextRequest,
  { params }: { params: { vertical: string } }
) {
  const verticalId = params.vertical;
  const vertical = VERTICALS[verticalId];

  if (!vertical) {
    return NextResponse.json({ error: "Unknown vertical" }, { status: 400 });
  }

  const forceRefresh = request.nextUrl.searchParams.get("refresh") === "true";

  // Check Supabase cache
  if (!forceRefresh) {
    const cutoff = new Date(Date.now() - CACHE_TTL_MS).toISOString();
    const { data: cached } = await supabaseAdmin
      .from("snappr_signals")
      .select("*")
      .eq("vertical", verticalId)
      .gte("fetched_at", cutoff)
      .order("signal_strength", { ascending: false })
      .limit(50);

    if (cached && cached.length > 0) {
      return NextResponse.json({ signals: cached, cached: true });
    }
  }

  // Fan out to all three data sources in parallel
  const [news, gov, jobs] = await Promise.all([
    fetchNewsSignals(vertical),
    fetchGovSignals(vertical),
    fetchJobSignals(vertical),
  ]);

  const allSignals = [...news, ...gov, ...jobs];

  // Score each signal
  const now = new Date().toISOString();
  const scored = allSignals.map((s) => ({
    vertical: verticalId,
    source: s.source,
    headline: s.headline.slice(0, 500),
    url: s.url.slice(0, 2000),
    account_name: s.account_name.slice(0, 200),
    signal_strength: scoreSignal(s, vertical),
    fetched_at: now,
  }));

  // Deduplicate by URL
  const seen = new Set<string>();
  const deduped = scored.filter((s) => {
    const key = s.url.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Upsert to Supabase
  if (deduped.length > 0) {
    const { error } = await supabaseAdmin
      .from("snappr_signals")
      .upsert(deduped, { onConflict: "vertical,url" });

    if (error) {
      console.error("Supabase upsert error:", error);
    }
  }

  // Re-read from Supabase to get IDs and any existing briefs
  const { data: persisted } = await supabaseAdmin
    .from("snappr_signals")
    .select("*")
    .eq("vertical", verticalId)
    .gte("fetched_at", new Date(Date.now() - CACHE_TTL_MS).toISOString())
    .order("signal_strength", { ascending: false })
    .limit(50);

  return NextResponse.json({
    signals: persisted || deduped,
    cached: false,
  });
}
