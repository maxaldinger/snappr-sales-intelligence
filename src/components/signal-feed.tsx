'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, RefreshCw, ChevronDown, ChevronUp, Copy, Check, TrendingUp, AlertTriangle, BarChart3, Building2, Loader2 } from 'lucide-react'
import { Company, Intel, VERTICALS, VERTICAL_COLORS, URGENCY_COLORS, SIGNAL_ICONS, SCORE_COLORS } from '@/lib/types'
import IntelCard from './intel-card'

const SEARCH_STEPS = [
  'Scraping website...',
  'Scanning news coverage...',
  'Checking government contracts...',
  'Analyzing with AI...',
  'Building intelligence brief...',
]

interface TimelineEntry {
  id: string
  company: string
  signal_text: string
  signal_type: string
  source_url: string
  first_seen_at: string
}

export default function SignalFeed() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(false)
  const [expandedCompany, setExpandedCompany] = useState<string | null>(null)
  const [intel, setIntel] = useState<Record<string, Intel>>({})
  const [intelLoading, setIntelLoading] = useState<Record<string, boolean>>({})
  const [timelines, setTimelines] = useState<Record<string, TimelineEntry[]>>({})
  const [expandedTab, setExpandedTab] = useState<Record<string, 'intel' | 'timeline'>>({})
  const [verticalFilter, setVerticalFilter] = useState<string>('all')
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all')
  const [copied, setCopied] = useState<string | null>(null)

  // Search
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchStep, setSearchStep] = useState(0)
  const [searchResult, setSearchResult] = useState<Intel | null>(null)

  const fetchFeed = async (force = false) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/feed${force ? '?force=1' : ''}`)
      const data = await res.json()
      if (data.companies) setCompanies(data.companies)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchFeed() }, [])

  const analyzeCompany = async (company: string) => {
    if (intel[company]) return
    setIntelLoading((p) => ({ ...p, [company]: true }))
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company }),
      })
      const data = await res.json()
      if (data.intel) setIntel((p) => ({ ...p, [company]: data.intel }))
    } catch {}
    setIntelLoading((p) => ({ ...p, [company]: false }))
  }

  const fetchTimeline = async (company: string) => {
    if (timelines[company]) return
    try {
      const res = await fetch(`/api/timeline?company=${encodeURIComponent(company)}`)
      const data = await res.json()
      if (data.timeline) setTimelines((p) => ({ ...p, [company]: data.timeline }))
    } catch {}
  }

  const toggleExpand = (company: string) => {
    if (expandedCompany === company) {
      setExpandedCompany(null)
    } else {
      setExpandedCompany(company)
      setExpandedTab((p) => ({ ...p, [company]: 'intel' }))
      analyzeCompany(company)
      fetchTimeline(company)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim() || searching) return
    setSearching(true)
    setSearchResult(null)
    setSearchStep(0)

    const interval = setInterval(() => {
      setSearchStep((p) => (p < SEARCH_STEPS.length - 1 ? p + 1 : p))
    }, 2500)

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company: searchQuery.trim() }),
      })
      const data = await res.json()
      if (data.intel) setSearchResult(data.intel)
    } catch {}

    clearInterval(interval)
    setSearching(false)
  }

  const handleCopyBrief = (company: string, intelData: Intel) => {
    const text = `${intelData.company_name} — Snappr Fit: ${intelData.relevance_score}/100\n\n${intelData.snapshot}\n\nSnappr Fit: ${intelData.snappr_fit}\nVisual Content Need: ${intelData.visual_content_need}\n\nOutreach:\nSubject: ${intelData.email_subject}\n${intelData.outreach_angle}`
    navigator.clipboard.writeText(text)
    setCopied(company)
    setTimeout(() => setCopied(null), 2000)
  }

  const filtered = companies.filter((c) => {
    if (verticalFilter !== 'all' && c.vertical_id !== verticalFilter) return false
    if (urgencyFilter !== 'all' && c.urgency !== urgencyFilter) return false
    return true
  })

  const stats = {
    companies: companies.length,
    highUrgency: companies.filter((c) => c.urgency === 'high').length,
    totalSignals: companies.reduce((s, c) => s + c.signal_count, 0),
    verticals: new Set(companies.map((c) => c.vertical_id)).size,
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search & analyze any company..."
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-[#FF5C00]/50 transition-colors"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={searching || !searchQuery.trim()}
          className="px-5 py-3 rounded-xl bg-[#FF5C00] text-white text-sm font-medium hover:bg-[#e04f00] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {searching ? 'Analyzing...' : 'Analyze'}
        </button>
        <button
          onClick={() => fetchFeed(true)}
          disabled={loading}
          className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
          title="Refresh feed"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Search loading animation */}
      {searching && (
        <div className="p-6 rounded-xl bg-white/[0.03] border border-white/10">
          <div className="space-y-3">
            {SEARCH_STEPS.map((step, i) => (
              <div key={step} className="flex items-center gap-3">
                {i < searchStep ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : i === searchStep ? (
                  <Loader2 className="w-4 h-4 text-[#FF5C00] animate-spin" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-600" />
                )}
                <span className={`text-sm ${i <= searchStep ? 'text-slate-300' : 'text-slate-600'}`}>
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search result */}
      {searchResult && (
        <div className="p-5 rounded-xl bg-white/[0.03] border border-[#FF5C00]/20">
          <IntelCard intel={searchResult} />
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-4 h-4 text-[#FF5C00]" />
            <span className="text-xs text-slate-400">Companies Tracked</span>
          </div>
          <div className="text-2xl font-bold text-white">{stats.companies}</div>
        </div>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-xs text-slate-400">High Urgency</span>
          </div>
          <div className="text-2xl font-bold text-white">{stats.highUrgency}</div>
        </div>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-slate-400">Total Signals</span>
          </div>
          <div className="text-2xl font-bold text-white">{stats.totalSignals}</div>
        </div>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-violet-400" />
            <span className="text-xs text-slate-400">Verticals Active</span>
          </div>
          <div className="text-2xl font-bold text-white">{stats.verticals}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => setVerticalFilter('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
            verticalFilter === 'all'
              ? 'border-[#FF5C00] text-[#FF5C00] bg-[#FF5C00]/10'
              : 'border-white/10 text-slate-400 hover:border-white/20'
          }`}
        >
          All Verticals
        </button>
        {VERTICALS.map((v) => (
          <button
            key={v.id}
            onClick={() => setVerticalFilter(verticalFilter === v.id ? 'all' : v.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              verticalFilter === v.id
                ? `${VERTICAL_COLORS[v.id]}`
                : 'border-white/10 text-slate-400 hover:border-white/20'
            }`}
          >
            {v.label}
          </button>
        ))}

        <div className="ml-auto flex gap-2">
          {['all', 'high', 'medium', 'low'].map((u) => (
            <button
              key={u}
              onClick={() => setUrgencyFilter(u)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                urgencyFilter === u
                  ? 'border-white/30 text-white bg-white/10'
                  : 'border-white/10 text-slate-500 hover:border-white/20'
              }`}
            >
              {u === 'all' ? 'All' : u.charAt(0).toUpperCase() + u.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Company list */}
      {loading && companies.length === 0 ? (
        <div className="text-center py-12">
          <RefreshCw className="w-6 h-6 text-[#FF5C00] animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading signal feed...</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => {
            const isOpen = expandedCompany === c.company
            return (
              <div
                key={c.company}
                className="rounded-xl bg-white/[0.03] border border-white/10 overflow-hidden hover:border-white/20 transition-all"
              >
                <button
                  onClick={() => toggleExpand(c.company)}
                  className="w-full p-4 flex items-center gap-4 text-left"
                >
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${URGENCY_COLORS[c.urgency]}`} />
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-white">{c.company}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      {c.amount && <span className="text-xs text-emerald-400 font-mono">{c.amount}</span>}
                      <span className="text-xs text-slate-500 truncate">{c.top_signal}</span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${VERTICAL_COLORS[c.vertical_id] || 'bg-white/5 text-slate-400'}`}>
                    {c.vertical_label}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] ${
                    c.urgency === 'high' ? 'bg-red-500/20 text-red-300'
                      : c.urgency === 'medium' ? 'bg-yellow-500/20 text-yellow-300'
                      : 'bg-slate-500/20 text-slate-400'
                  }`}>{c.urgency}</span>
                  <span className="text-xs text-slate-500 w-8 text-right">{c.signal_count}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>

                {isOpen && (
                  <div className="border-t border-white/10 p-4 space-y-4">
                    {/* Why Snappr */}
                    {c.why_snappr && (
                      <div className="p-3 rounded-lg bg-[#FF5C00]/5 border border-[#FF5C00]/10">
                        <div className="text-[10px] uppercase tracking-wider text-[#FF5C00] mb-1">Why Snappr</div>
                        <p className="text-xs text-slate-300">{c.why_snappr}</p>
                      </div>
                    )}

                    {/* Tabs */}
                    <div className="flex gap-4 border-b border-white/10">
                      <button
                        onClick={() => setExpandedTab((p) => ({ ...p, [c.company]: 'intel' }))}
                        className={`pb-2 text-xs font-medium border-b-2 transition-all ${
                          expandedTab[c.company] === 'intel'
                            ? 'border-[#FF5C00] text-[#FF5C00]'
                            : 'border-transparent text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        Intel
                      </button>
                      <button
                        onClick={() => setExpandedTab((p) => ({ ...p, [c.company]: 'timeline' }))}
                        className={`pb-2 text-xs font-medium border-b-2 transition-all ${
                          expandedTab[c.company] === 'timeline'
                            ? 'border-[#FF5C00] text-[#FF5C00]'
                            : 'border-transparent text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        Timeline ({timelines[c.company]?.length || 0})
                      </button>
                    </div>

                    {/* Intel tab */}
                    {expandedTab[c.company] === 'intel' && (
                      <>
                        {intelLoading[c.company] ? (
                          <div className="py-6 text-center">
                            <Loader2 className="w-5 h-5 text-[#FF5C00] animate-spin mx-auto mb-2" />
                            <p className="text-xs text-slate-500">Analyzing {c.company}...</p>
                          </div>
                        ) : intel[c.company] ? (
                          <>
                            <IntelCard intel={intel[c.company]} />
                            <button
                              onClick={() => handleCopyBrief(c.company, intel[c.company])}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/5 text-xs text-slate-300 hover:bg-white/10 transition-all"
                            >
                              {copied === c.company ? <><Check className="w-3 h-3 text-emerald-400" /> Copied Brief</> : <><Copy className="w-3 h-3" /> Copy Brief</>}
                            </button>
                          </>
                        ) : (
                          <p className="text-xs text-slate-500 py-4 text-center">No intel available yet.</p>
                        )}
                      </>
                    )}

                    {/* Timeline tab */}
                    {expandedTab[c.company] === 'timeline' && (
                      <div className="space-y-2">
                        {(timelines[c.company] || []).length === 0 ? (
                          <p className="text-xs text-slate-500 py-4 text-center">No timeline entries yet.</p>
                        ) : (
                          timelines[c.company].map((t) => (
                            <div key={t.id} className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5">
                              <span className="mt-0.5 text-sm">{SIGNAL_ICONS[t.signal_type] || '\u{1F4CC}'}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-slate-300">{t.signal_text}</p>
                                <p className="text-[10px] text-slate-500 mt-1">
                                  {new Date(t.first_seen_at).toLocaleDateString()}
                                </p>
                              </div>
                              {t.source_url && (
                                <a href={t.source_url} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-[#FF5C00] transition-colors">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                </a>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {filtered.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-slate-500 text-sm">No companies match your filters.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
