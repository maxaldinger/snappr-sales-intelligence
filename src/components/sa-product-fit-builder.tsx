'use client'

import { useState } from 'react'
import { Sparkles, RefreshCw } from 'lucide-react'
import FollowUpChat from './sa-follow-up-chat'

interface FitProduct { product: string; score: number; fit_label: string; reasoning: string; evidence: string[] }
interface FitResult { results: { overall_score: number; overall_label: string; overall_summary: string; products: FitProduct[]; discovery_gaps: any[]; red_flags: any[] } }

interface Props { dealName: string | null }

export default function SaProductFitBuilder({ dealName }: Props) {
  const [notes, setNotes] = useState('')
  const [result, setResult] = useState<FitResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const analyze = async () => {
    if (!notes.trim()) return
    setLoading(true); setError('')
    try {
      const r = await fetch('/api/sa-product-fit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notes, dealName }) })
      const text = await r.text()
      let d: any
      try { d = JSON.parse(text) } catch { throw new Error('Analysis timed out or returned an invalid response. Try shorter notes or try again.') }
      if (!r.ok) throw new Error(d.error || 'Failed')
      setResult(d)
    } catch (e: any) { setError(e.message) } finally { setLoading(false) }
  }

  const scoreColor = (s: number) => s >= 70 ? 'text-emerald-400' : s >= 40 ? 'text-yellow-400' : 'text-red-400'
  const scoreBg = (s: number) => s >= 70 ? 'bg-emerald-500' : s >= 40 ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Product Fit Analyzer</h2>
        <p className="text-sm text-slate-400">Evaluate how well a prospect fits Snappr&apos;s photography services.</p>
      </div>

      {!result && (
        <div className="space-y-4">
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Paste discovery notes, deal context, or prospect information..."
            rows={10} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#FF5C00]/50 text-sm resize-none leading-relaxed" />
          <button onClick={analyze} disabled={loading || !notes.trim()} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#FF5C00] text-white font-medium text-sm hover:bg-[#e04f00] disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Analyzing...</> : <><Sparkles className="w-4 h-4" /> Analyze Fit</>}
          </button>
        </div>
      )}

      {error && <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm">{error}</div>}

      {result?.results && (
        <div className="space-y-4">
          <button onClick={() => setResult(null)} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm hover:bg-white/10">New Analysis</button>

          <div className="p-5 rounded-xl bg-white/[0.03] border border-white/10">
            <div className="flex items-center gap-4 mb-3">
              <div className={`text-4xl font-bold ${scoreColor(result.results.overall_score)}`}>{result.results.overall_score}</div>
              <div>
                <div className="text-sm font-medium text-white">{result.results.overall_label}</div>
                <div className="w-32 h-2 rounded-full bg-white/10 overflow-hidden mt-1">
                  <div className={`h-full rounded-full ${scoreBg(result.results.overall_score)}`} style={{ width: `${result.results.overall_score}%` }} />
                </div>
              </div>
            </div>
            <p className="text-sm text-slate-300">{result.results.overall_summary}</p>
          </div>

          {result.results.products?.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {result.results.products.map((p, i) => (
                <div key={i} className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">{p.product}</span>
                    <span className={`text-sm font-bold ${scoreColor(p.score)}`}>{p.score}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden mb-2">
                    <div className={`h-full rounded-full ${scoreBg(p.score)}`} style={{ width: `${p.score}%` }} />
                  </div>
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${
                    p.fit_label === 'Strong' ? 'bg-emerald-500/20 text-emerald-300' :
                    p.fit_label === 'Moderate' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-red-500/20 text-red-300'
                  }`}>{p.fit_label}</span>
                  <p className="text-xs text-slate-400 mt-2">{p.reasoning}</p>
                </div>
              ))}
            </div>
          )}

          {result.results.discovery_gaps?.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
              <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">Discovery Gaps</h4>
              <ul className="space-y-2">{result.results.discovery_gaps.map((g: any, i: number) => (
                <li key={i} className="text-xs text-slate-300"><span className="text-amber-400 font-medium">{g.area}:</span> {g.question}</li>
              ))}</ul>
            </div>
          )}

          {result.results.red_flags?.length > 0 && (
            <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10">
              <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">Red Flags</h4>
              <ul className="space-y-1.5">{result.results.red_flags.map((f: any, i: number) => (
                <li key={i} className="text-xs text-slate-300"><span className={`font-medium ${f.severity === 'high' ? 'text-red-400' : 'text-amber-400'}`}>[{f.severity}]</span> {f.flag}: {f.detail}</li>
              ))}</ul>
            </div>
          )}

          <FollowUpChat context={JSON.stringify(result)} tool="product-fit" dealName={dealName} />
        </div>
      )}
    </div>
  )
}
