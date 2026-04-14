export type SignalSource = "News" | "Job Posting" | "Gov Contract";

export interface Signal {
  id: string;
  vertical: string;
  source: SignalSource;
  headline: string;
  url: string;
  account_name: string;
  signal_strength: number;
  brief: string | null;
  fetched_at: string;
}

export interface RawSignal {
  source: SignalSource;
  headline: string;
  url: string;
  account_name: string;
  published_at: Date;
}

export interface VerticalConfig {
  id: string;
  name: string;
  shortName: string;
  newsKeywords: string[];
  jobTitles: string[];
  govKeywords: string[];
  scoringKeywords: string[];
}
