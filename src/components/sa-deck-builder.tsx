'use client'

import { useState } from 'react'
import { Plus, Trash2, GripVertical, Sparkles, RefreshCw, Download } from 'lucide-react'
import FollowUpChat from './sa-follow-up-chat'

type SlideType = 'title' | 'agenda' | 'bullets' | 'two-col' | 'stat' | 'closing'

interface Slide { id: string; type: SlideType; title: string; content: string }

const SLIDE_TYPES: { type: SlideType; label: string; desc: string }[] = [
  { type: 'title', label: 'Title Slide', desc: 'Company name, subtitle, date' },
  { type: 'agenda', label: 'Agenda', desc: 'Meeting agenda or outline' },
  { type: 'bullets', label: 'Bullet Points', desc: 'Key points with details' },
  { type: 'two-col', label: 'Two Column', desc: 'Side-by-side comparison' },
  { type: 'stat', label: 'Big Stat', desc: 'Hero number with context' },
  { type: 'closing', label: 'Closing', desc: 'Thank you, next steps, CTA' },
]

interface Props { dealName: string | null }

export default function SaDeckBuilder({ dealName }: Props) {
  const [slides, setSlides] = useState<Slide[]>([])
  const [notes, setNotes] = useState('')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  const addSlide = (type: SlideType) => {
    setSlides(prev => [...prev, { id: `slide-${Date.now()}`, type, title: '', content: '' }])
  }

  const removeSlide = (id: string) => setSlides(prev => prev.filter(s => s.id !== id))

  const updateSlide = (id: string, field: keyof Slide, value: string) => {
    setSlides(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s))
  }

  const generateFromNotes = async () => {
    if (!notes.trim()) return
    setGenerating(true); setError('')
    try {
      const r = await fetch('/api/sa-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: `Generate a sales presentation deck outline from these notes. Return a JSON array of slides, each with "type" (title|agenda|bullets|two-col|stat|closing), "title", and "content". Notes:\n\n${notes}` }],
          tool: 'deck',
        }),
      })
      const rawText = await r.text()
      let d: any
      try { d = JSON.parse(rawText) } catch { throw new Error('Request timed out or returned an invalid response. Try again.') }
      const text = d.content || d.message || ''
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        setSlides(parsed.map((s: any, i: number) => ({
          id: `slide-${Date.now()}-${i}`,
          type: s.type || 'bullets',
          title: s.title || '',
          content: s.content || '',
        })))
      }
    } catch (e: any) { setError('Failed to generate deck outline.') }
    finally { setGenerating(false) }
  }

  const typeLabel = (type: SlideType) => SLIDE_TYPES.find(t => t.type === type)?.label || type

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Deck Builder</h2>
        <p className="text-sm text-slate-400">Build a sales presentation slide by slide, or generate from notes.</p>
      </div>

      {/* Generate from notes */}
      {slides.length === 0 && (
        <div className="space-y-4">
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Paste meeting notes or describe the presentation you need..."
            rows={8} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#FF5C00]/50 text-sm resize-none leading-relaxed" />
          <div className="flex gap-3">
            <button onClick={generateFromNotes} disabled={generating || !notes.trim()} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#FF5C00] text-white font-medium text-sm hover:bg-[#e04f00] disabled:opacity-50 disabled:cursor-not-allowed">
              {generating ? <><RefreshCw className="w-4 h-4 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4" /> Generate Deck</>}
            </button>
            <span className="text-sm text-slate-500 self-center">or add slides manually below</span>
          </div>
        </div>
      )}

      {error && <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm">{error}</div>}

      {/* Add slide buttons */}
      <div>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Add Slide</h3>
        <div className="flex flex-wrap gap-2">
          {SLIDE_TYPES.map(t => (
            <button key={t.type} onClick={() => addSlide(t.type)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-xs text-slate-400 hover:border-[#FF5C00]/30 hover:text-[#FF5C00] hover:bg-[#FF5C00]/5 transition-all">
              <Plus className="w-3 h-3" /> {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Slide list */}
      {slides.length > 0 && (
        <div className="space-y-3">
          {slides.map((slide, idx) => (
            <div key={slide.id} className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-mono">#{idx + 1}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#FF5C00]/10 text-[#FF5C00] border border-[#FF5C00]/20">{typeLabel(slide.type)}</span>
                </div>
                <button onClick={() => removeSlide(slide.id)} className="p-1 text-slate-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
              <input value={slide.title} onChange={e => updateSlide(slide.id, 'title', e.target.value)} placeholder="Slide title"
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-[#FF5C00]/50" />
              <textarea value={slide.content} onChange={e => updateSlide(slide.id, 'content', e.target.value)} placeholder="Slide content..."
                rows={3} className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-[#FF5C00]/50 resize-none" />
            </div>
          ))}

          <FollowUpChat context={JSON.stringify(slides)} tool="deck" dealName={dealName} />
        </div>
      )}
    </div>
  )
}
