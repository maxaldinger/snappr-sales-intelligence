'use client'

import { useState } from 'react'
import SignalFeed from '@/components/signal-feed'
import TerritoryPlan from '@/components/territory-plan'
import SalesAssist from '@/components/sales-assist'

const TABS = [
  { id: 'signals', label: 'Signal Feed' },
  { id: 'territory', label: 'Territory Plan' },
  { id: 'sales-assist', label: 'Sales Assist' },
] as const

type TabId = (typeof TABS)[number]['id']

export default function Home() {
  const [tab, setTab] = useState<TabId>('signals')

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#111827]/95 backdrop-blur border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Snappr logo mark */}
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="#FF5C00" />
              <path
                d="M10 22V14a6 6 0 0 1 12 0v1M16 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="16" cy="15" r="1.5" fill="white" />
            </svg>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">
                Snappr Sales Intelligence
              </h1>
            </div>
            <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </span>
          </div>

          {/* Tab nav */}
          <nav className="flex gap-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  tab === t.id
                    ? 'bg-[#FF5C00]/15 text-[#FF5C00] border border-[#FF5C00]/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6">
        {tab === 'signals' && <SignalFeed />}
        {tab === 'territory' && <TerritoryPlan />}
        {tab === 'sales-assist' && <SalesAssist />}
      </main>
    </div>
  )
}
