'use client'

import { useState } from 'react'
import { Sparkles, RefreshCw, Plus, Trash2, Pencil, Check, X, Download } from 'lucide-react'
import FollowUpChat from './sa-follow-up-chat'

interface LouRow { id: string; issue: string; response: string; category: string; priority: string; timeframe: string }
const CATEGORIES = ['', 'Visual Content', 'Brand Photography', 'Product Photography', 'Real Estate', 'Events', 'Marketing']
const PRIORITIES = ['', 'High', 'Medium', 'Low']
const TIMEFRAMES = ['', 'Q1', 'Q2', 'Q3', 'Q4']

interface Props { dealName: string | null }

export default function SaLouBuilder({ dealName }: Props) {
  const [mode, setMode] = useState<'input' | 'table'>('input')
  const [transcript, setTranscript] = useState('')
  const [rows, setRows] = useState<LouRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<LouRow | null>(null)

  const generate = async () => {
    if (!transcript.trim()) return
    setLoading(true); setError('')
    try {
      const r = await fetch('/api/sa-lou', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ transcript, dealName }) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Failed')
      setRows((d.rows || []).map((row: any, i: number) => ({ id: row.id || `row-${i}`, issue: row.issue || '', response: row.response || '', category: row.category || '', priority: row.priority || '', timeframe: row.timeframe || '' })))
      setMode('table')
    } catch (e: any) { setError(e.message) } finally { setLoading(false) }
  }

  const addRow = () => { const nr: LouRow = { id: `row-${Date.now()}`, issue: '', response: '', category: '', priority: '', timeframe: '' }; setRows(p => [...p, nr]); setEditingId(nr.id); setEditDraft(nr) }
  const removeRow = (id: string) => { setRows(p => p.filter(r => r.id !== id)); if (editingId === id) { setEditingId(null); setEditDraft(null) } }
  const startEdit = (row: LouRow) => { setEditingId(row.id); setEditDraft({ ...row }) }
  const saveEdit = () => { if (!editDraft) return; setRows(p => p.map(r => r.id === editDraft.id ? editDraft : r)); setEditingId(null); setEditDraft(null) }
  const cancelEdit = () => { setEditingId(null); setEditDraft(null) }

  const exportCSV = () => {
    const headers = ['Critical Business Issue', 'Can we help? If so, how?', 'Category', 'Priority', 'Timeframe']
    const csvRows = rows.map(r => [r.issue, r.response, r.category, r.priority, r.timeframe].map(v => `"${(v || '').replace(/"/g, '""')}"`).join(','))
    const blob = new Blob([[headers.join(','), ...csvRows].join('\n')], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `LOU-${dealName || 'draft'}.csv`; a.click()
  }

  const priorityColor = (p: string) => ({ High: 'text-red-400', Medium: 'text-yellow-400', Low: 'text-emerald-400' }[p] || 'text-slate-500')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Letter of Understanding Builder</h2>
        <p className="text-sm text-slate-400">Paste meeting notes or a transcript to generate a structured LOU table.</p>
      </div>

      {mode === 'input' && (
        <div className="space-y-4">
          <textarea value={transcript} onChange={e => setTranscript(e.target.value)} placeholder="Paste meeting notes, call transcript, or key discussion points..."
            rows={12} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#FF5C00]/50 text-sm resize-none leading-relaxed" />
          <button onClick={generate} disabled={loading || !transcript.trim()} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#FF5C00] text-white font-medium text-sm hover:bg-[#e04f00] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Generating LOU...</> : <><Sparkles className="w-4 h-4" /> Generate LOU</>}
          </button>
        </div>
      )}

      {error && <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm">{error}</div>}

      {mode === 'table' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setMode('input')} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm hover:bg-white/10 transition-colors">Edit Notes</button>
            <button onClick={addRow} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm hover:bg-white/10 transition-colors"><Plus className="w-3.5 h-3.5" /> Add Issue</button>
            <button onClick={exportCSV} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF5C00]/10 border border-[#FF5C00]/20 text-[#FF5C00] text-sm hover:bg-[#FF5C00]/20 transition-colors ml-auto"><Download className="w-3.5 h-3.5" /> Export CSV</button>
          </div>
          <div className="rounded-xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-white/5">
                  <th className="text-left px-4 py-3 text-slate-400 font-medium w-[28%]">Critical Business Issue</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium w-[28%]">Can we help? If so, how?</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium w-[14%]">Category</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium w-[10%]">Priority</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium w-[10%]">Timeframe</th>
                  <th className="text-center px-4 py-3 text-slate-400 font-medium w-[10%]">Actions</th>
                </tr></thead>
                <tbody className="divide-y divide-white/5">
                  {rows.map(row => (
                    <tr key={row.id} className="hover:bg-white/[0.02] transition-colors">
                      {editingId === row.id && editDraft ? (
                        <>
                          <td className="px-3 py-2"><textarea value={editDraft.issue} onChange={e => setEditDraft({ ...editDraft, issue: e.target.value })} rows={2} className="w-full px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs resize-none focus:outline-none focus:border-[#FF5C00]/50" /></td>
                          <td className="px-3 py-2"><textarea value={editDraft.response} onChange={e => setEditDraft({ ...editDraft, response: e.target.value })} rows={2} className="w-full px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs resize-none focus:outline-none focus:border-[#FF5C00]/50" /></td>
                          <td className="px-3 py-2"><select value={editDraft.category} onChange={e => setEditDraft({ ...editDraft, category: e.target.value })} className="w-full px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none">{CATEGORIES.map(c => <option key={c} value={c} className="bg-[#0D1117]">{c || 'Select...'}</option>)}</select></td>
                          <td className="px-3 py-2"><select value={editDraft.priority} onChange={e => setEditDraft({ ...editDraft, priority: e.target.value })} className="w-full px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none">{PRIORITIES.map(p => <option key={p} value={p} className="bg-[#0D1117]">{p || 'Select...'}</option>)}</select></td>
                          <td className="px-3 py-2"><select value={editDraft.timeframe} onChange={e => setEditDraft({ ...editDraft, timeframe: e.target.value })} className="w-full px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none">{TIMEFRAMES.map(t => <option key={t} value={t} className="bg-[#0D1117]">{t || 'Select...'}</option>)}</select></td>
                          <td className="px-3 py-2"><div className="flex items-center justify-center gap-1"><button onClick={saveEdit} className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-emerald-400"><Check className="w-3.5 h-3.5" /></button><button onClick={cancelEdit} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400"><X className="w-3.5 h-3.5" /></button></div></td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 text-slate-300">{row.issue}</td>
                          <td className="px-4 py-3 text-slate-300">{row.response}</td>
                          <td className="px-4 py-3 text-slate-400">{row.category}</td>
                          <td className={`px-4 py-3 font-medium ${priorityColor(row.priority)}`}>{row.priority}</td>
                          <td className="px-4 py-3 text-slate-400">{row.timeframe}</td>
                          <td className="px-4 py-3"><div className="flex items-center justify-center gap-1"><button onClick={() => startEdit(row)} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white"><Pencil className="w-3.5 h-3.5" /></button><button onClick={() => removeRow(row.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button></div></td>
                        </>
                      )}
                    </tr>
                  ))}
                  {rows.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500 text-sm">No issues yet. Click &quot;Add Issue&quot; to get started.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
          <FollowUpChat context={JSON.stringify(rows)} tool="lou" dealName={dealName} />
        </div>
      )}
    </div>
  )
}
