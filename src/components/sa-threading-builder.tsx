'use client'

import { useState } from 'react'
import { Sparkles, RefreshCw, Plus, Trash2, UserPlus } from 'lucide-react'
import FollowUpChat from './sa-follow-up-chat'

interface ContactInput { name: string; title: string; role: string; engagement: string; notes: string }
interface ThreadingResult { health_score: number; health_label: string; summary: string; contacts: any[]; gaps: any[]; recommendations: string[] }

interface Props { dealName: string | null }

export default function SaThreadingBuilder({ dealName }: Props) {
  const [contacts, setContacts] = useState<ContactInput[]>([{ name: '', title: '', role: '', engagement: '', notes: '' }])
  const [result, setResult] = useState<ThreadingResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const updateContact = (idx: number, field: keyof ContactInput, value: string) => {
    setContacts(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c))
  }
  const addContact = () => setContacts(prev => [...prev, { name: '', title: '', role: '', engagement: '', notes: '' }])
  const removeContact = (idx: number) => setContacts(prev => prev.filter((_, i) => i !== idx))

  const analyze = async () => {
    setLoading(true); setError('')
    try {
      const r = await fetch('/api/sa-threading', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contacts, dealName }) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Failed')
      setResult(d)
    } catch (e: any) { setError(e.message) } finally { setLoading(false) }
  }

  const healthColor = (score: number) => score >= 70 ? 'text-emerald-400' : score >= 40 ? 'text-yellow-400' : 'text-red-400'
  const healthBg = (score: number) => score >= 70 ? 'bg-emerald-500' : score >= 40 ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Multi-Threading Analyzer</h2>
        <p className="text-sm text-slate-400">Add your deal contacts to analyze threading health and identify gaps.</p>
      </div>

      <div className="space-y-3">
        {contacts.map((c, i) => (
          <div key={i} className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Contact {i + 1}</span>
              {contacts.length > 1 && <button onClick={() => removeContact(i)} className="p-1 text-slate-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input value={c.name} onChange={e => updateContact(i, 'name', e.target.value)} placeholder="Name" className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-[#FF5C00]/50" />
              <input value={c.title} onChange={e => updateContact(i, 'title', e.target.value)} placeholder="Title" className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-[#FF5C00]/50" />
              <select value={c.role} onChange={e => updateContact(i, 'role', e.target.value)} className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none">
                <option value="" className="bg-[#0D1117]">Role...</option>
                <option value="Champion" className="bg-[#0D1117]">Champion</option>
                <option value="Economic Buyer" className="bg-[#0D1117]">Economic Buyer</option>
                <option value="Technical Buyer" className="bg-[#0D1117]">Technical Buyer</option>
                <option value="End User" className="bg-[#0D1117]">End User</option>
                <option value="Blocker" className="bg-[#0D1117]">Blocker</option>
                <option value="Coach" className="bg-[#0D1117]">Coach</option>
              </select>
              <select value={c.engagement} onChange={e => updateContact(i, 'engagement', e.target.value)} className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none">
                <option value="" className="bg-[#0D1117]">Engagement...</option>
                <option value="Active" className="bg-[#0D1117]">Active</option>
                <option value="Warm" className="bg-[#0D1117]">Warm</option>
                <option value="Cold" className="bg-[#0D1117]">Cold</option>
                <option value="Unknown" className="bg-[#0D1117]">Unknown</option>
              </select>
            </div>
            <input value={c.notes} onChange={e => updateContact(i, 'notes', e.target.value)} placeholder="Notes (optional)" className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-[#FF5C00]/50" />
          </div>
        ))}
        <div className="flex gap-3">
          <button onClick={addContact} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm hover:bg-white/10"><UserPlus className="w-3.5 h-3.5" /> Add Contact</button>
          <button onClick={analyze} disabled={loading || contacts.every(c => !c.name.trim())} className="flex items-center gap-2 px-6 py-2 rounded-xl bg-[#FF5C00] text-white font-medium text-sm hover:bg-[#e04f00] disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Analyzing...</> : <><Sparkles className="w-4 h-4" /> Analyze Threading</>}
          </button>
        </div>
      </div>

      {error && <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm">{error}</div>}

      {result && (
        <div className="space-y-4">
          <div className="p-5 rounded-xl bg-white/[0.03] border border-white/10">
            <div className="flex items-center gap-4 mb-3">
              <div className={`text-3xl font-bold ${healthColor(result.health_score)}`}>{result.health_score}</div>
              <div>
                <div className="text-sm font-medium text-white">{result.health_label}</div>
                <div className="w-32 h-2 rounded-full bg-white/10 overflow-hidden mt-1">
                  <div className={`h-full rounded-full ${healthBg(result.health_score)}`} style={{ width: `${result.health_score}%` }} />
                </div>
              </div>
            </div>
            <p className="text-sm text-slate-300">{result.summary}</p>
          </div>

          {result.gaps?.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
              <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">Threading Gaps</h4>
              <ul className="space-y-2">{result.gaps.map((g: any, i: number) => (
                <li key={i} className="text-xs text-slate-300"><span className="text-amber-400 font-medium">{g.role || g.area}:</span> {g.recommendation || g.detail}</li>
              ))}</ul>
            </div>
          )}

          {result.recommendations?.length > 0 && (
            <div className="p-4 rounded-xl bg-white/5">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Recommendations</h4>
              <ul className="space-y-1.5">{result.recommendations.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-300"><span className="text-[#FF5C00] mt-0.5">&rarr;</span> {r}</li>
              ))}</ul>
            </div>
          )}

          <FollowUpChat context={JSON.stringify(result)} tool="threading" dealName={dealName} />
        </div>
      )}
    </div>
  )
}
