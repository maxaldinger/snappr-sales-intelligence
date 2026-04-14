import { RawSignal, VerticalConfig } from "./types";

export function scoreSignal(signal: RawSignal, vertical: VerticalConfig): number {
  const now = Date.now();
  const age = now - signal.published_at.getTime();
  const daysOld = age / (1000 * 60 * 60 * 24);

  let baseScore: number;
  if (daysOld < 1) baseScore = 10;
  else if (daysOld < 3) baseScore = 8;
  else if (daysOld < 7) baseScore = 7;
  else if (daysOld < 14) baseScore = 5;
  else if (daysOld < 30) baseScore = 4;
  else baseScore = 2;

  const headlineLower = signal.headline.toLowerCase();
  let keywordBonus = 0;
  for (const kw of vertical.scoringKeywords) {
    if (headlineLower.includes(kw.toLowerCase())) {
      keywordBonus++;
    }
  }
  keywordBonus = Math.min(keywordBonus, 3);

  let multiplier = 1.0;
  if (signal.source === "News") multiplier = 1.2;
  else if (signal.source === "Gov Contract") multiplier = 1.1;

  const finalScore = Math.round((baseScore + keywordBonus) * multiplier);
  return Math.max(1, Math.min(10, finalScore));
}
