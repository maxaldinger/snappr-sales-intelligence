import { XMLParser } from "fast-xml-parser";
import { RawSignal, VerticalConfig } from "../types";

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });

function extractCompanyName(title: string): string {
  // Job news titles often: "Company is hiring a Role" or "Role at Company"
  const dashIdx = title.lastIndexOf(" - ");
  const cleaned = dashIdx > 0 ? title.substring(0, dashIdx) : title;

  // Pattern: "X is hiring" / "X hires"
  const hiringMatch = cleaned.match(/^(.+?)\s+(?:is hiring|hires|hiring|announces)/i);
  if (hiringMatch) return hiringMatch[1].trim().slice(0, 60);

  // Pattern: "Role at Company"
  const atMatch = cleaned.match(/at\s+(.+?)(?:\s*[,\-|]|$)/i);
  if (atMatch) return atMatch[1].trim().slice(0, 60);

  // Fallback: first 4 words
  return cleaned.split(/\s+/).slice(0, 4).join(" ");
}

export async function fetchJobSignals(vertical: VerticalConfig): Promise<RawSignal[]> {
  const signals: RawSignal[] = [];

  const fetches = vertical.jobTitles.map(async (title) => {
    // Split multi-word titles: "Creative Director ecommerce" → "Creative Director" ecommerce
    const words = title.split(/\s+/);
    let queryStr: string;
    if (words.length <= 2) {
      queryStr = `"${title}" hiring`;
    } else {
      // Quote the core role (first 2 words), leave vertical qualifier unquoted
      const role = words.slice(0, 2).join(" ");
      const qualifier = words.slice(2).join(" ");
      queryStr = `"${role}" ${qualifier} hiring`;
    }
    const query = encodeURIComponent(queryStr);
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
        const itemTitle = typeof item.title === "string" ? item.title : String(item.title ?? "");
        const link = typeof item.link === "string" ? item.link : String(item.link ?? "");
        if (!itemTitle || !link) continue;

        signals.push({
          source: "Job Posting",
          headline: itemTitle,
          url: link,
          account_name: extractCompanyName(itemTitle),
          published_at: item.pubDate ? new Date(item.pubDate) : new Date(),
        });
      }
    } catch {
      // Silently skip failed job fetches
    }
  });

  await Promise.all(fetches);
  return signals;
}
