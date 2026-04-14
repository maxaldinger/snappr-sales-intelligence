import { XMLParser } from "fast-xml-parser";
import { RawSignal, VerticalConfig } from "../types";

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });

function extractAccountName(title: string): string {
  // Google News titles end with " - Publisher Name"
  const dashIdx = title.lastIndexOf(" - ");
  const cleaned = dashIdx > 0 ? title.substring(0, dashIdx) : title;

  // Try to grab leading proper-noun phrase (rough heuristic)
  const common = new Set([
    "the", "a", "an", "in", "on", "at", "for", "to", "and", "or",
    "of", "with", "new", "how", "why", "what", "is", "are", "has",
    "from", "by", "its", "their", "this", "that", "after", "as",
  ]);
  const words = cleaned.split(/\s+/);
  const lead: string[] = [];
  for (const w of words) {
    if (lead.length >= 4) break;
    if (lead.length > 0 && common.has(w.toLowerCase())) break;
    lead.push(w);
  }
  return lead.join(" ") || cleaned.slice(0, 60);
}

export async function fetchNewsSignals(vertical: VerticalConfig): Promise<RawSignal[]> {
  const signals: RawSignal[] = [];

  const fetches = vertical.newsKeywords.map(async (keyword) => {
    const query = encodeURIComponent(keyword);
    const url = `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;

    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; SnapprIntel/1.0)" },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) return;

      const xml = await res.text();
      const result = parser.parse(xml);
      const items = result?.rss?.channel?.item;
      if (!items) return;

      const list = Array.isArray(items) ? items.slice(0, 5) : [items];
      for (const item of list) {
        const title = typeof item.title === "string" ? item.title : String(item.title ?? "");
        const link = typeof item.link === "string" ? item.link : String(item.link ?? "");
        if (!title || !link) continue;

        signals.push({
          source: "News",
          headline: title,
          url: link,
          account_name: extractAccountName(title),
          published_at: item.pubDate ? new Date(item.pubDate) : new Date(),
        });
      }
    } catch {
      // Silently skip failed keyword fetches
    }
  });

  await Promise.all(fetches);
  return signals;
}
