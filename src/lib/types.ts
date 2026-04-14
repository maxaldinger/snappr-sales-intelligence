/* ── Snappr Sales Intelligence — shared types ── */

export interface Company {
  company: string
  vertical_id: string
  vertical_label: string
  signal_count: number
  top_signal: string
  signal_type: string
  urgency: 'high' | 'medium' | 'low'
  amount: string
  date: string
  why_snappr: string
}

export interface Signal {
  type: string
  text: string
  urgency: 'high' | 'medium' | 'low'
}

export interface Contact {
  title: string
  department: string
  why_target: string
  linkedin_search: string
}

export interface Intel {
  company_name: string
  ticker: string
  hq: string
  primary_vertical: string
  relevance_score: number
  relevance_label: string
  relevance_color: string
  snapshot: string
  snappr_fit: string
  visual_content_need: string
  signals: Signal[]
  target_contacts: Contact[]
  outreach_angle: string
  email_subject: string
  talking_points: string[]
  competitor_risk: string
  risk_flags: string[]
}

export const VERTICALS = [
  { id: 'ecommerce', label: 'E-Commerce', color: '#f97316' },
  { id: 'realestate', label: 'Real Estate', color: '#3b82f6' },
  { id: 'food', label: 'Food & Hospitality', color: '#10b981' },
  { id: 'fintech', label: 'Fintech', color: '#8b5cf6' },
  { id: 'travel', label: 'Travel & Lifestyle', color: '#ec4899' },
  { id: 'dtc', label: 'DTC Brands', color: '#eab308' },
]

export const VERTICAL_COLORS: Record<string, string> = {
  ecommerce: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  realestate: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  food: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  fintech: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  travel: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  dtc: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
}

export const URGENCY_COLORS: Record<string, string> = {
  high: 'bg-red-500',
  medium: 'bg-yellow-500',
  low: 'bg-slate-500',
}

export const SIGNAL_ICONS: Record<string, string> = {
  news: '\u{1F4F0}',
  job: '\u{1F4BC}',
  contract: '\u{1F3DB}',
  funding: '\u{1F4B0}',
  expansion: '\u{1F680}',
  partnership: '\u{1F91D}',
  leadership: '\u{1F464}',
}

export const SCORE_COLORS: Record<string, string> = {
  green: 'text-emerald-400',
  yellow: 'text-yellow-400',
  orange: 'text-orange-400',
  red: 'text-red-400',
}
