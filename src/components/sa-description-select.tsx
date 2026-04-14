'use client'

import { useState, useRef, useEffect } from 'react'

interface Option {
  value: string
  label: string
  shortLabel: string
  description: string
}

interface Props {
  label: string
  value: string
  options: Option[]
  onChange: (value: string) => void
}

export default function DescriptionSelect({ label, value, options, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selected = options.find(o => o.value === value)

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(p => !p)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs text-slate-400 hover:text-slate-200 hover:border-white/20 transition-all"
      >
        <span className="text-[10px] text-slate-500 uppercase tracking-wider">{label}:</span>
        <span className="text-slate-300">{selected?.shortLabel || value}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="ml-0.5">
          <path d="M2.5 3.75L5 6.25L7.5 3.75" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className="absolute bottom-full mb-1 right-0 z-50 w-72 py-1 rounded-xl bg-[#1e293b] border border-white/10 shadow-2xl">
          {options.map(o => (
            <button
              key={o.value}
              onClick={() => { onChange(o.value); setOpen(false) }}
              className={`w-full text-left px-3 py-2 hover:bg-white/5 transition-colors ${o.value === value ? 'bg-white/5' : ''}`}
            >
              <div className="text-xs text-white font-medium">{o.label}</div>
              <div className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{o.description}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
