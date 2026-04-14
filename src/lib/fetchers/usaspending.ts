import { RawSignal, VerticalConfig } from "../types";

function getDateMonthsAgo(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.toISOString().split("T")[0];
}

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

export async function fetchGovSignals(vertical: VerticalConfig): Promise<RawSignal[]> {
  const signals: RawSignal[] = [];

  // Also search broad terms that apply to all verticals
  const allKeywords = [...vertical.govKeywords, "creative services", "media production"];
  const unique = Array.from(new Set(allKeywords));

  const fetches = unique.map(async (keyword) => {
    try {
      const res = await fetch(
        "https://api.usaspending.gov/api/v2/search/spending_by_award/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.timeout(10000),
          body: JSON.stringify({
            filters: {
              keywords: [keyword],
              time_period: [
                { start_date: getDateMonthsAgo(12), end_date: getToday() },
              ],
              award_type_codes: ["A", "B", "C", "D"],
            },
            fields: [
              "Award ID",
              "Recipient Name",
              "Description",
              "Award Amount",
              "Start Date",
              "generated_internal_id",
            ],
            page: 1,
            limit: 8,
            sort: "Start Date",
            order: "desc",
          }),
        }
      );

      if (!res.ok) return;
      const data = await res.json();

      for (const award of data.results || []) {
        const recipientName = award["Recipient Name"] || "Unknown Agency";
        const description = award["Description"] || keyword;
        const awardId =
          award["generated_internal_id"] || award["Award ID"] || "";
        const startDate = award["Start Date"];

        signals.push({
          source: "Gov Contract",
          headline: `${recipientName} — ${description}`.slice(0, 200),
          url: awardId
            ? `https://www.usaspending.gov/award/${awardId}`
            : `https://www.usaspending.gov/search/?q=${encodeURIComponent(keyword)}`,
          account_name: recipientName,
          published_at: startDate ? new Date(startDate) : new Date(),
        });
      }
    } catch {
      // Silently skip failed gov fetches
    }
  });

  await Promise.all(fetches);
  return signals;
}
