'use client'

import { useState } from 'react'
import { Sparkles, RefreshCw, Copy, Pencil, Check } from 'lucide-react'
import FollowUpChat from './sa-follow-up-chat'

interface BusinessChallenge { challenge: string; detail: string }
interface NextStep { step: string; description: string }
interface Proposal { title: string; date: string; executive_summary: string; business_challenges: BusinessChallenge[]; recommended_solution: string; why_snappr: string; next_steps: NextStep[]; closing_statement: string }

interface Props { dealName: string | null }

export default function SaProposalBuilder({ dealName }: Props) {
  const [mode, setMode] = useState<'input' | 'proposal'>('input')
  const [notes, setNotes] = useState('')
  const [products, setProducts] = useState('')
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [editField, setEditField] = useState<string | null>(null)

  const generate = async () => {
    if (!notes.trim()) return
    setLoading(true); setError('')
    try {
      const r = await fetch('/api/sa-proposal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notes, products, dealName }) })
      const text = await r.text()
      let d: any
      try { d = JSON.parse(text) } catch { throw new Error('Request timed out or returned an invalid response. Try again.') }
      if (!r.ok) throw new Error(d.error || 'Failed')
      setProposal(d.proposal); setMode('proposal')
    } catch (e: any) { setError(e.message) } finally { setLoading(false) }
  }

  const copyProposal = async () => {
    if (!proposal) return
    const text = [proposal.title, `Date: ${proposal.date}`, '', 'EXECUTIVE SUMMARY', proposal.executive_summary, '', 'BUSINESS CHALLENGES',
      ...proposal.business_challenges.map((c, i) => `${i + 1}. ${c.challenge}\n   ${c.detail}`), '', 'RECOMMENDED SOLUTION', proposal.recommended_solution,
      '', 'WHY SNAPPR', proposal.why_snappr, '', 'NEXT STEPS', ...proposal.next_steps.map((s, i) => `${i + 1}. ${s.step} - ${s.description}`), '', proposal.closing_statement].join('\n')
    await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const updateField = (field: keyof Proposal, value: any) => { if (proposal) setProposal({ ...proposal, [field]: value }) }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Proposal Builder</h2>
        <p className="text-sm text-slate-400">Generate a structured proposal from meeting notes and suggested products.</p>
      </div>

      {mode === 'input' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Meeting Notes / Context</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Paste meeting notes, key requirements, pain points..."
              rows={10} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#FF5C00]/50 text-sm resize-none leading-relaxed" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Suggested Products (optional)</label>
            <textarea value={products} onChange={e => setProducts(e.target.value)} placeholder="e.g. Starter Package, Business Retainer, Enterprise Custom..."
              rows={4} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#FF5C00]/50 text-sm resize-none leading-relaxed" />
          </div>
          <button onClick={generate} disabled={loading || !notes.trim()} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#FF5C00] text-white font-medium text-sm hover:bg-[#e04f00] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4" /> Generate Proposal</>}
          </button>
        </div>
      )}

      {error && <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm">{error}</div>}

      {mode === 'proposal' && proposal && (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <button onClick={() => setMode('input')} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm hover:bg-white/10"><Pencil className="w-3.5 h-3.5" /> Edit Inputs</button>
            <button onClick={copyProposal} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF5C00]/10 border border-[#FF5C00]/20 text-[#FF5C00] text-sm hover:bg-[#FF5C00]/20 ml-auto">
              {copied ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy Proposal</>}
            </button>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
            <div className="px-8 pt-8 pb-4 border-b border-white/5">
              <h3 className="text-xl font-bold text-white cursor-pointer hover:text-[#FF5C00] transition-colors" onClick={() => setEditField('title')}>
                {editField === 'title' ? <input value={proposal.title} onChange={e => updateField('title', e.target.value)} onBlur={() => setEditField(null)} autoFocus className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xl font-bold text-white focus:outline-none focus:border-[#FF5C00]/50" /> : proposal.title}
              </h3>
              <p className="text-sm text-slate-500 mt-1">{proposal.date}</p>
            </div>
            <div className="px-8 py-6 space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-[#FF5C00] uppercase tracking-wider mb-2">Executive Summary</h4>
                <p className="text-sm text-slate-300 leading-relaxed cursor-pointer hover:text-white transition-colors" onClick={() => setEditField('executive_summary')}>
                  {editField === 'executive_summary' ? <textarea value={proposal.executive_summary} onChange={e => updateField('executive_summary', e.target.value)} onBlur={() => setEditField(null)} rows={4} autoFocus className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-[#FF5C00]/50" /> : proposal.executive_summary}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#FF5C00] uppercase tracking-wider mb-3">Business Challenges</h4>
                <div className="space-y-3">{proposal.business_challenges.map((c, i) => (
                  <div key={i} className="p-4 rounded-lg bg-white/5 border border-white/5">
                    <p className="text-sm font-medium text-white">{c.challenge}</p>
                    <p className="text-sm text-slate-400 mt-1">{c.detail}</p>
                  </div>
                ))}</div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#FF5C00] uppercase tracking-wider mb-2">Recommended Solution</h4>
                <p className="text-sm text-slate-300 leading-relaxed">{proposal.recommended_solution}</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#FF5C00] uppercase tracking-wider mb-2">Why Snappr</h4>
                <p className="text-sm text-slate-300 leading-relaxed">{proposal.why_snappr}</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-[#FF5C00] uppercase tracking-wider mb-3">Next Steps</h4>
                <ol className="space-y-3">{proposal.next_steps.map((s, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-[#FF5C00]/10 flex items-center justify-center text-xs text-[#FF5C00] flex-shrink-0 mt-0.5 font-medium">{i + 1}</span>
                    <div><p className="text-sm font-medium text-white">{s.step}</p><p className="text-sm text-slate-400">{s.description}</p></div>
                  </li>
                ))}</ol>
              </div>
              <div className="pt-4 border-t border-white/5">
                <p className="text-sm text-slate-300 italic leading-relaxed">{proposal.closing_statement}</p>
              </div>
            </div>
          </div>
          <FollowUpChat context={JSON.stringify(proposal)} tool="proposal" dealName={dealName} />
        </div>
      )}
    </div>
  )
}
