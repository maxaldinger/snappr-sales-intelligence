'use client'

import { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { MapPin, DollarSign, Building2, ChevronDown, ChevronUp, RefreshCw, Sparkles, ExternalLink, Copy, Check, List, Map, Upload, X, Loader2 } from 'lucide-react'
import { VERTICAL_COLORS } from '@/lib/types'
import type { Intel, Contact } from '@/lib/types'

const TerritoryMap = dynamic(() => import('./territory-map'), { ssr: false })

interface Account {
  rank: number
  company: string
  vertical: string
  vertical_id: string
  revenue: string
  hq_city: string
  hq_state: string
  lat: number
  lng: number
  visual_content_need: string
  snappr_fit: string
  entry_strategy: string
  key_personas: string[]
  est_acv: string
}

const DEFAULT_ACCOUNTS: Account[] = [
  {
    rank: 1,
    company: 'Wayfair',
    vertical: 'E-Commerce',
    vertical_id: 'ecommerce',
    revenue: '$12B',
    hq_city: 'Boston',
    hq_state: 'MA',
    lat: 42.3601,
    lng: -71.0589,
    visual_content_need: 'Massive product catalog requires thousands of lifestyle and studio product photos monthly. Seasonal refreshes for homepage, email, and paid media campaigns.',
    snappr_fit: 'Snappr on-demand photographers can scale product shoots across categories. Enterprise retainer covers seasonal surges. Studio + lifestyle photography for furniture, decor, and outdoor categories.',
    entry_strategy: 'Target Creative Operations team via seasonal content refresh pain. Position Snappr as elastic photography workforce that scales with catalog launches.',
    key_personas: ['VP Creative Operations', 'Director of E-Commerce Photography', 'Head of Brand Creative', 'Senior Producer, Content Studio'],
    est_acv: '$80K - $200K',
  },
  {
    rank: 2,
    company: 'Airbnb',
    vertical: 'Travel & Lifestyle',
    vertical_id: 'travel',
    revenue: '$10B',
    hq_city: 'San Francisco',
    hq_state: 'CA',
    lat: 37.7749,
    lng: -122.4194,
    visual_content_need: 'Host listing photography at scale globally. Quality listing photos directly correlate with booking rates. Need consistent quality across 100+ markets.',
    snappr_fit: 'Snappr\'s global photographer network can service host photography in every major market. Proven model with real estate photography translates directly. Volume discount on Starter tier.',
    entry_strategy: 'Enter through Host Success team. Position around host onboarding photography as conversion driver. Reference data showing listings with pro photos get 2-3x more bookings.',
    key_personas: ['Head of Host Operations', 'VP Product - Host Experience', 'Director of Content Standards', 'Global Head of Photography'],
    est_acv: '$150K - $500K',
  },
  {
    rank: 3,
    company: 'Redfin',
    vertical: 'Real Estate',
    vertical_id: 'realestate',
    revenue: '$1B',
    hq_city: 'Seattle',
    hq_state: 'WA',
    lat: 47.6062,
    lng: -122.3321,
    visual_content_need: 'Professional listing photography for agent teams across US markets. Consistent quality standards for brand differentiation vs. Zillow/Realtor.com.',
    snappr_fit: 'Snappr real estate photography packages (Starter tier) with 24hr turnaround. Scalable across all Redfin markets. Consistent editing style maintains brand standards.',
    entry_strategy: 'Target VP of Agent Services. Position as nationwide photography partner that ensures consistent listing quality. Emphasize speed and coverage vs. fragmented local vendors.',
    key_personas: ['VP Agent Services', 'Director of Listing Experience', 'Head of Market Operations', 'Chief Marketing Officer'],
    est_acv: '$100K - $300K',
  },
  {
    rank: 4,
    company: 'HelloFresh',
    vertical: 'Food & Hospitality',
    vertical_id: 'food',
    revenue: '$8B',
    hq_city: 'New York',
    hq_state: 'NY',
    lat: 40.7128,
    lng: -74.006,
    visual_content_need: 'Weekly recipe photography for new menu items. Packaging photography, ingredient shots, and lifestyle cooking imagery for app, email, and social channels.',
    snappr_fit: 'Snappr Business retainer for recurring weekly shoots. Food photography specialists in network. Studio and lifestyle capability for recipe cards, app imagery, and marketing materials.',
    entry_strategy: 'Enter through Creative Studio team. Position around weekly content velocity — Snappr can match their menu rotation cadence with dedicated food photographers.',
    key_personas: ['VP Brand Creative', 'Head of Food Photography', 'Director of Content Production', 'Senior Creative Producer'],
    est_acv: '$60K - $150K',
  },
  {
    rank: 5,
    company: 'Warby Parker',
    vertical: 'DTC Brands',
    vertical_id: 'dtc',
    revenue: '$600M',
    hq_city: 'New York',
    hq_state: 'NY',
    lat: 40.7128,
    lng: -74.006,
    visual_content_need: 'Product photography for new frame launches. Model shoots for website and campaigns. Retail store photography for 200+ locations. UGC-style content for social.',
    snappr_fit: 'Snappr covers product, model, and retail photography needs. Starter for individual shoots, Business retainer for ongoing product launches. On-demand store photography across retail footprint.',
    entry_strategy: 'Target Brand Creative team around new collection launches. Position Snappr as single vendor for product, lifestyle, and retail photography needs across channels.',
    key_personas: ['VP Brand & Creative', 'Director of Photography', 'Head of E-Commerce', 'Retail Marketing Director'],
    est_acv: '$40K - $100K',
  },
  {
    rank: 6,
    company: 'Opendoor',
    vertical: 'Real Estate',
    vertical_id: 'realestate',
    revenue: '$7B',
    hq_city: 'San Francisco',
    hq_state: 'CA',
    lat: 37.7749,
    lng: -122.4194,
    visual_content_need: 'High-volume listing photography for iBuyer homes across 50+ markets. Speed critical — photos needed within 48hrs of acquisition for rapid re-listing.',
    snappr_fit: 'Snappr real estate photography with guaranteed turnaround times. Scalable photographer network matches Opendoor\'s market footprint. Standardized quality for consistent listing presentation.',
    entry_strategy: 'Enter through Operations team. Lead with speed and coverage metrics. Position as photography partner that matches their acquisition-to-listing velocity.',
    key_personas: ['VP Operations', 'Head of Listing Services', 'Director of Market Operations', 'Chief Operating Officer'],
    est_acv: '$120K - $400K',
  },
  {
    rank: 7,
    company: 'Chime',
    vertical: 'Fintech',
    vertical_id: 'fintech',
    revenue: '$1.5B',
    hq_city: 'San Francisco',
    hq_state: 'CA',
    lat: 37.7749,
    lng: -122.4194,
    visual_content_need: 'Brand campaign photography, lifestyle imagery featuring diverse users, office/culture photography for recruiting, event photography for conferences.',
    snappr_fit: 'Snappr Business retainer for ongoing brand content needs. Lifestyle and portrait photography for campaigns. Event coverage and corporate headshots for recruiting.',
    entry_strategy: 'Target Brand Marketing team. Position around campaign photography needs and employee headshot programs. Snappr starter tier for event coverage.',
    key_personas: ['VP Brand Marketing', 'Creative Director', 'Head of People & Culture', 'Director of Communications'],
    est_acv: '$30K - $80K',
  },
  {
    rank: 8,
    company: 'DoorDash',
    vertical: 'Food & Hospitality',
    vertical_id: 'food',
    revenue: '$8.6B',
    hq_city: 'San Francisco',
    hq_state: 'CA',
    lat: 37.7749,
    lng: -122.4194,
    visual_content_need: 'Restaurant partner photography for menu listings. Food photography drives order conversion. Need consistent quality across 300K+ restaurant partners nationwide.',
    snappr_fit: 'Snappr on-demand food photography for restaurant partners at scale. Starter tier per-shoot pricing for partner onboarding. Global photographer network covers all DoorDash markets.',
    entry_strategy: 'Enter through Merchant Success team. Position photography as partner onboarding tool that increases order rates. Reference data on photo quality impact on conversion.',
    key_personas: ['VP Merchant Experience', 'Head of Partner Operations', 'Director of Content & Photography', 'General Manager, Restaurant Partners'],
    est_acv: '$200K - $600K',
  },
  {
    rank: 9,
    company: 'Marriott',
    vertical: 'Travel & Lifestyle',
    vertical_id: 'travel',
    revenue: '$23B',
    hq_city: 'Bethesda',
    hq_state: 'MD',
    lat: 38.9848,
    lng: -77.0947,
    visual_content_need: 'Property photography across 8,500+ hotels in 30 brands. Regular refreshes required for renovated properties. Event and F&B photography for individual properties.',
    snappr_fit: 'Snappr Enterprise custom contracts for portfolio-wide photography programs. On-demand photographers in every major market. Consistent brand standards across property types.',
    entry_strategy: 'Target Global Brand Marketing. Position as enterprise photography partner for property refresh programs. Start with select-service brands (Courtyard, Fairfield) for volume.',
    key_personas: ['SVP Global Brand Marketing', 'VP Creative & Content', 'Director of Digital Asset Management', 'VP Luxury Brand Management'],
    est_acv: '$300K - $1M',
  },
  {
    rank: 10,
    company: 'Instacart',
    vertical: 'E-Commerce',
    vertical_id: 'ecommerce',
    revenue: '$3B',
    hq_city: 'San Francisco',
    hq_state: 'CA',
    lat: 37.7749,
    lng: -122.4194,
    visual_content_need: 'Product photography for grocery/CPG brand advertising on Instacart Ads platform. Lifestyle food photography for seasonal campaigns. Partner brand content.',
    snappr_fit: 'Snappr product and food photography for Instacart Ads partners. Business retainer for recurring advertising content needs. Studio capability for packaged goods photography.',
    entry_strategy: 'Enter through Instacart Ads team. Position Snappr as photography partner for brand advertisers on the platform — help brands create better ad content that drives ROAS.',
    key_personas: ['VP Instacart Ads', 'Head of Brand Partnerships', 'Director of Creative Services', 'GM Advertising'],
    est_acv: '$80K - $250K',
  },
]

const CITY_COORDS: Record<string, [number, number]> = {
  'new york': [40.7128, -74.006], 'los angeles': [34.0522, -118.2437],
  'chicago': [41.8781, -87.6298], 'houston': [29.7604, -95.3698],
  'san francisco': [37.7749, -122.4194], 'seattle': [47.6062, -122.3321],
  'boston': [42.3601, -71.0589], 'denver': [39.7392, -104.9903],
  'austin': [30.2672, -97.7431], 'washington': [38.9072, -77.0369],
  'atlanta': [33.749, -84.388], 'miami': [25.7617, -80.1918],
  'portland': [45.5152, -122.6784], 'san diego': [32.7157, -117.1611],
  'dallas': [32.7767, -96.797], 'phoenix': [33.4484, -112.074],
  'philadelphia': [39.9526, -75.1652], 'minneapolis': [44.9778, -93.265],
  'nashville': [36.1627, -86.7816], 'detroit': [42.3314, -83.0458],
  'bethesda': [38.9848, -77.0947], 'salt lake city': [40.7608, -111.891],
  'charlotte': [35.2271, -80.8431], 'raleigh': [35.7796, -78.6382],
  'tampa': [27.9506, -82.4572], 'orlando': [28.5383, -81.3792],
  'las vegas': [36.1699, -115.1398], 'columbus': [39.9612, -82.9988],
  'indianapolis': [39.7684, -86.1581], 'kansas city': [39.0997, -94.5786],
}

function lookupCoords(city: string): { lat: number; lng: number } {
  if (!city) return { lat: 0, lng: 0 }
  const coords = CITY_COORDS[city.toLowerCase().trim()]
  return coords ? { lat: coords[0], lng: coords[1] } : { lat: 0, lng: 0 }
}

function mapVerticalId(vertical: string): string {
  const l = vertical.toLowerCase()
  if (l.includes('ecommerce') || l.includes('e-commerce') || l.includes('retail')) return 'ecommerce'
  if (l.includes('real estate') || l.includes('property')) return 'realestate'
  if (l.includes('food') || l.includes('hospitality') || l.includes('restaurant')) return 'food'
  if (l.includes('fintech') || l.includes('financial') || l.includes('banking')) return 'fintech'
  if (l.includes('travel') || l.includes('lifestyle') || l.includes('hotel')) return 'travel'
  return 'dtc'
}

function linkedinUrl(persona: string, company: string) {
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(persona + ' ' + company)}`
}

export default function TerritoryPlan() {
  const [expandedAccount, setExpandedAccount] = useState<number | null>(null)
  const [researching, setResearching] = useState<Record<number, boolean>>({})
  const [deepDive, setDeepDive] = useState<Record<number, Intel>>({})
  const [copied, setCopied] = useState<string | null>(null)
  const [view, setView] = useState<'list' | 'map'>('list')
  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState<Record<string, 'pending' | 'loading' | 'done' | 'error'>>({})
  const [importedAccounts, setImportedAccounts] = useState<Account[]>([])
  const [includeDefaults, setIncludeDefaults] = useState(true)

  const allAccounts = useMemo(() => {
    const base = includeDefaults ? DEFAULT_ACCOUNTS : []
    return [...base, ...importedAccounts].map((a, i) => ({ ...a, rank: i + 1 }))
  }, [includeDefaults, importedAccounts])

  const totalPipeline = allAccounts.reduce((s, a) => {
    const match = a.est_acv.match(/\$([0-9.]+)([KMB])/i)
    if (!match) return s
    const num = parseFloat(match[1])
    const mult = match[2].toUpperCase() === 'M' ? 1000000 : match[2].toUpperCase() === 'K' ? 1000 : 1
    return s + num * mult
  }, 0)

  const aiResearch = async (idx: number) => {
    const account = allAccounts[idx]
    setResearching(p => ({ ...p, [idx]: true }))
    try {
      const r = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company: account.company }),
      })
      const d = await r.json()
      if (d.intel) setDeepDive(p => ({ ...p, [idx]: d.intel as Intel }))
    } catch {}
    setResearching(p => ({ ...p, [idx]: false }))
  }

  const importAccounts = async () => {
    const lines = importText.split('\n').map(s => s.trim()).filter(Boolean)
    if (!lines.length) return
    setImporting(true)
    const progress: Record<string, 'pending' | 'loading' | 'done' | 'error'> = {}
    lines.forEach(l => { progress[l] = 'pending' })
    setImportProgress({ ...progress })

    for (const line of lines) {
      const parts = line.split(',').map(s => s.trim())
      const company = parts[0]
      const city = parts[1] || ''
      const state = parts[2] || ''
      setImportProgress(p => ({ ...p, [line]: 'loading' }))
      try {
        const r = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ company }),
        })
        const d = await r.json()
        if (d.intel) {
          const intelData = d.intel as Intel
          const resolvedCity = city || (intelData.hq || '').split(',')[0]?.trim() || ''
          const resolvedState = state || (intelData.hq || '').split(',')[1]?.trim() || ''
          const coords = lookupCoords(resolvedCity)
          const newAccount: Account = {
            rank: 0,
            company: intelData.company_name || company,
            vertical: intelData.primary_vertical || 'DTC Brands',
            vertical_id: mapVerticalId(intelData.primary_vertical || ''),
            revenue: '',
            hq_city: resolvedCity,
            hq_state: resolvedState,
            lat: coords.lat,
            lng: coords.lng,
            visual_content_need: intelData.visual_content_need || '',
            snappr_fit: intelData.snappr_fit || '',
            entry_strategy: intelData.outreach_angle || '',
            key_personas: intelData.target_contacts?.map(c => c.title) || [],
            est_acv: 'TBD',
          }
          setImportedAccounts(prev => [...prev, newAccount])
          setImportProgress(p => ({ ...p, [line]: 'done' }))
        } else {
          setImportProgress(p => ({ ...p, [line]: 'error' }))
        }
      } catch {
        setImportProgress(p => ({ ...p, [line]: 'error' }))
      }
    }
    setImporting(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Territory Attack Plan</h2>
          <p className="text-sm text-slate-400">
            {allAccounts.length} pre-researched accounts with high visual content needs aligned to Snappr&apos;s ICP
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImport(p => !p)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              showImport ? 'bg-[#FF5C00]/20 text-[#FF5C00] border border-[#FF5C00]/30' : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
            }`}
          >
            <Upload className="w-3.5 h-3.5" /> Import
          </button>
          <div className="flex rounded-lg border border-white/10 overflow-hidden">
            <button onClick={() => setView('list')} className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-all ${view === 'list' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
              <List className="w-3.5 h-3.5" /> List
            </button>
            <button onClick={() => setView('map')} className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-all ${view === 'map' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
              <Map className="w-3.5 h-3.5" /> Map
            </button>
          </div>
        </div>
      </div>

      {/* Import Panel */}
      {showImport && (
        <div className="p-5 rounded-xl bg-white/[0.03] border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Import Accounts</h3>
              <p className="text-xs text-slate-400 mt-0.5">One per line: Company or Company, City, ST</p>
            </div>
            <button onClick={() => setShowImport(false)} className="p-1 text-slate-500 hover:text-slate-300"><X className="w-4 h-4" /></button>
          </div>
          <textarea
            value={importText}
            onChange={e => setImportText(e.target.value)}
            placeholder={'Nike\nTarget, Minneapolis, MN\nZillow, Seattle, WA'}
            rows={5}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#FF5C00]/50 text-sm resize-none leading-relaxed"
          />
          <div className="flex items-center gap-4">
            <button onClick={importAccounts} disabled={importing || !importText.trim()} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#FF5C00] text-white font-medium text-sm hover:bg-[#e04f00] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {importing ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Importing...</> : <><Upload className="w-3.5 h-3.5" /> Import Accounts</>}
            </button>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <button onClick={() => setIncludeDefaults(p => !p)} className={`relative w-9 h-5 rounded-full transition-colors ${includeDefaults ? 'bg-[#FF5C00]' : 'bg-white/10'}`}>
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${includeDefaults ? 'translate-x-4' : ''}`} />
              </button>
              <span className="text-xs text-slate-400">Include default accounts</span>
            </label>
          </div>
          {Object.keys(importProgress).length > 0 && (
            <div className="space-y-1.5">
              {Object.entries(importProgress).map(([name, status]) => (
                <div key={name} className="flex items-center gap-2 text-xs">
                  {status === 'pending' && <div className="w-3.5 h-3.5 rounded-full border border-slate-600" />}
                  {status === 'loading' && <Loader2 className="w-3.5 h-3.5 text-[#FF5C00] animate-spin" />}
                  {status === 'done' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  {status === 'error' && <X className="w-3.5 h-3.5 text-red-400" />}
                  <span className={status === 'done' ? 'text-slate-300' : status === 'error' ? 'text-red-400' : 'text-slate-400'}>{name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 mb-1"><Building2 className="w-4 h-4 text-[#FF5C00]" /><span className="text-xs text-slate-400">Target Accounts</span></div>
          <div className="text-2xl font-bold text-white">{allAccounts.length}</div>
        </div>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 mb-1"><DollarSign className="w-4 h-4 text-emerald-400" /><span className="text-xs text-slate-400">Pipeline Target (Low)</span></div>
          <div className="text-2xl font-bold text-white">${(totalPipeline / 1000000).toFixed(1)}M</div>
        </div>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 mb-1"><MapPin className="w-4 h-4 text-violet-400" /><span className="text-xs text-slate-400">Verticals Covered</span></div>
          <div className="text-2xl font-bold text-white">{new Set(allAccounts.map(a => a.vertical_id)).size}</div>
        </div>
      </div>

      {view === 'map' && <TerritoryMap accounts={allAccounts} />}

      {view === 'list' && (
        <div className="space-y-2">
          {allAccounts.map((a, idx) => {
            const isOpen = expandedAccount === idx
            return (
              <div key={`${a.company}-${idx}`} className="rounded-xl bg-white/[0.03] border border-white/10 overflow-hidden hover:border-white/20 transition-all">
                <button onClick={() => setExpandedAccount(isOpen ? null : idx)} className="w-full p-4 flex items-center gap-4 text-left">
                  <span className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-xs font-bold text-slate-400">{a.rank}</span>
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-white">{a.company}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${VERTICAL_COLORS[a.vertical_id] || 'bg-white/5 text-slate-400'}`}>{a.vertical}</span>
                      {a.revenue && <span className="text-xs text-slate-500">{a.revenue}</span>}
                      {a.hq_city && <span className="text-xs text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3" />{a.hq_city}, {a.hq_state}</span>}
                    </div>
                  </div>
                  <span className="text-sm font-mono text-emerald-400">{a.est_acv}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>

                {isOpen && (
                  <div className="border-t border-white/10 p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-violet-500/5 border border-violet-500/10">
                        <div className="text-[10px] uppercase tracking-wider text-violet-400 mb-1">Visual Content Need</div>
                        <p className="text-xs text-slate-300">{a.visual_content_need}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-orange-500/5 border border-orange-500/10">
                        <div className="text-[10px] uppercase tracking-wider text-orange-400 mb-1">Snappr Fit</div>
                        <p className="text-xs text-slate-300">{a.snappr_fit}</p>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/10">
                      <div className="text-[10px] uppercase tracking-wider text-cyan-400 mb-1">Entry Strategy</div>
                      <p className="text-xs text-slate-300">{a.entry_strategy}</p>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-2">Key Personas</div>
                      <div className="flex flex-wrap gap-2">
                        {a.key_personas.map((p, i) => (
                          <a key={i} href={linkedinUrl(p, a.company)} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 text-xs text-orange-300 hover:bg-orange-500/10 transition-all">
                            {p} <ExternalLink className="w-3 h-3 opacity-60" />
                          </a>
                        ))}
                      </div>
                    </div>
                    <button onClick={() => aiResearch(idx)} disabled={researching[idx]}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#FF5C00]/10 text-[#FF5C00] hover:bg-[#FF5C00]/20 transition-all text-xs font-medium">
                      {researching[idx] ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Researching...</> : <><Sparkles className="w-3.5 h-3.5" /> AI Deep Dive</>}
                    </button>

                    {deepDive[idx] && (() => {
                      const dd = deepDive[idx]
                      return (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-24 h-2 rounded-full bg-white/10 overflow-hidden">
                              <div className="h-full rounded-full bg-[#FF5C00]" style={{ width: `${dd.relevance_score}%` }} />
                            </div>
                            <span className="text-xs text-[#FF5C00] font-mono">{dd.relevance_score}%</span>
                            <span className="text-[10px] text-slate-400">{dd.relevance_label}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-lg bg-violet-500/5 border border-violet-500/10">
                              <div className="text-[10px] uppercase tracking-wider text-violet-400 mb-1">Visual Content Need</div>
                              <p className="text-xs text-slate-300">{dd.visual_content_need}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-orange-500/5 border border-orange-500/10">
                              <div className="text-[10px] uppercase tracking-wider text-orange-400 mb-1">Snappr Fit</div>
                              <p className="text-xs text-slate-300">{dd.snappr_fit}</p>
                            </div>
                          </div>
                          {dd.talking_points?.length > 0 && (
                            <div className="p-3 rounded-lg bg-white/5">
                              <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-2">Talking Points</div>
                              <ul className="space-y-1">
                                {dd.talking_points.map((pt, pi) => (
                                  <li key={pi} className="flex items-start gap-2 text-xs text-slate-300">
                                    <span className="text-[#FF5C00] mt-0.5">&rarr;</span> {pt}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {dd.target_contacts?.length > 0 && (
                            <div>
                              <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-2">Target Contacts</div>
                              <div className="flex flex-wrap gap-2">
                                {dd.target_contacts.map((c: Contact, ci: number) => (
                                  <a key={ci} href={`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(c.linkedin_search)}`} target="_blank" rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 text-xs text-orange-300 hover:bg-orange-500/10 transition-all" title={c.why_target}>
                                    {c.title} <ExternalLink className="w-3 h-3 opacity-60" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                          {dd.email_subject && (
                            <button onClick={() => {
                              navigator.clipboard.writeText(`Subject: ${dd.email_subject}\n\n${dd.outreach_angle}`)
                              setCopied(`dd-${idx}`)
                              setTimeout(() => setCopied(null), 2000)
                            }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 text-xs text-slate-300 hover:bg-white/10 transition-all">
                              {copied === `dd-${idx}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              {copied === `dd-${idx}` ? 'Copied' : 'Copy outreach'}
                            </button>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
