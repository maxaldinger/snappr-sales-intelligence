"use client";

import { useState, useEffect, useCallback } from "react";
import { VERTICALS, VERTICAL_ORDER } from "@/lib/verticals";
import { Signal } from "@/lib/types";
import SignalCard from "./SignalCard";
import BriefPanel from "./BriefPanel";

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function SignalSkeleton() {
  return (
    <div className="rounded-lg border border-slate-700/40 bg-slate-800/40 p-4 animate-pulse">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex gap-2 mb-2">
            <div className="h-4 w-14 rounded bg-slate-700/60" />
          </div>
          <div className="h-4 w-48 rounded bg-slate-700/60 mb-1.5" />
          <div className="h-3 w-full rounded bg-slate-700/40" />
          <div className="h-3 w-3/4 rounded bg-slate-700/40 mt-1" />
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="h-3 w-20 rounded bg-slate-700/40" />
          <div className="h-6 w-24 rounded bg-slate-700/60" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [activeVertical, setActiveVertical] = useState("ecommerce");
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [wasCached, setWasCached] = useState(false);

  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);
  const [briefContent, setBriefContent] = useState<string | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefOpen, setBriefOpen] = useState(false);

  const fetchSignals = useCallback(
    async (vertical: string, refresh = false) => {
      if (refresh) setRefreshing(true);
      else setLoading(true);

      try {
        const url = `/api/signals/${vertical}${refresh ? "?refresh=true" : ""}`;
        const res = await fetch(url);
        const data = await res.json();
        setSignals(data.signals || []);
        setWasCached(!!data.cached);
        setLastRefreshed(new Date());
      } catch {
        setSignals([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchSignals(activeVertical);
  }, [activeVertical, fetchSignals]);

  const handleGenerateBrief = async (signal: Signal) => {
    setSelectedSignal(signal);
    setBriefOpen(true);

    if (signal.brief) {
      setBriefContent(signal.brief);
      return;
    }

    setBriefLoading(true);
    setBriefContent(null);

    try {
      const res = await fetch("/api/generate-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signalId: signal.id,
          accountName: signal.account_name,
          headline: signal.headline,
          source: signal.source,
          vertical: signal.vertical,
        }),
      });
      const data = await res.json();
      setBriefContent(data.brief || data.error || "Failed to generate brief.");

      if (data.brief) {
        setSignals((prev) =>
          prev.map((s) =>
            s.id === signal.id ? { ...s, brief: data.brief } : s
          )
        );
      }
    } catch {
      setBriefContent("Network error. Please try again.");
    } finally {
      setBriefLoading(false);
    }
  };

  const signalCounts = {
    total: signals.length,
    hot: signals.filter((s) => s.signal_strength >= 7).length,
    withBrief: signals.filter((s) => s.brief).length,
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-panel-900/95 backdrop-blur border-b border-slate-700/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-base font-bold text-slate-100 tracking-tight">
                Snappr Account Intelligence
              </h1>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Enterprise buying signals &middot;{" "}
                {VERTICALS[activeVertical]?.name}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {lastRefreshed && (
                <span className="text-[11px] text-slate-500">
                  {wasCached ? "Cached" : "Live"} &middot; Updated{" "}
                  {formatTime(lastRefreshed)}
                </span>
              )}
              <button
                onClick={() => fetchSignals(activeVertical, true)}
                disabled={refreshing}
                className="text-[11px] font-medium px-3 py-1.5 rounded bg-slate-700/60 text-slate-300 hover:bg-slate-700 disabled:opacity-40 transition-colors flex items-center gap-1.5"
              >
                <svg
                  className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Vertical tabs */}
      <nav className="sticky top-[57px] z-20 bg-panel-800/95 backdrop-blur border-b border-slate-700/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1 overflow-x-auto py-1.5 -mb-px">
            {VERTICAL_ORDER.map((vId) => {
              const v = VERTICALS[vId];
              const isActive = vId === activeVertical;
              return (
                <button
                  key={vId}
                  onClick={() => setActiveVertical(vId)}
                  className={`shrink-0 px-3.5 py-2 rounded-md text-xs font-medium transition-all ${
                    isActive
                      ? "bg-sky-500/15 text-sky-400 border border-sky-500/30"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 border border-transparent"
                  }`}
                >
                  {v.shortName}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Stats bar */}
      {!loading && signals.length > 0 && (
        <div className="bg-panel-800/50 border-b border-slate-700/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex gap-6">
            <span className="text-[11px] text-slate-500">
              <span className="text-slate-300 font-semibold">
                {signalCounts.total}
              </span>{" "}
              signals
            </span>
            <span className="text-[11px] text-slate-500">
              <span className="text-emerald-400 font-semibold">
                {signalCounts.hot}
              </span>{" "}
              high-strength
            </span>
            <span className="text-[11px] text-slate-500">
              <span className="text-sky-400 font-semibold">
                {signalCounts.withBrief}
              </span>{" "}
              briefs ready
            </span>
          </div>
        </div>
      )}

      {/* Signal list */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <SignalSkeleton key={i} />
              ))}
            </div>
          ) : signals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="text-slate-600 text-sm mb-2">
                No signals found for {VERTICALS[activeVertical]?.name}
              </div>
              <button
                onClick={() => fetchSignals(activeVertical, true)}
                className="text-xs text-sky-500 hover:text-sky-400 transition-colors"
              >
                Try refreshing from live sources
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {signals.map((signal) => (
                <SignalCard
                  key={signal.id || signal.url}
                  signal={signal}
                  onGenerateBrief={handleGenerateBrief}
                  isSelected={selectedSignal?.id === signal.id}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Brief panel */}
      {briefOpen && (
        <BriefPanel
          signal={selectedSignal}
          briefContent={briefContent}
          loading={briefLoading}
          onClose={() => {
            setBriefOpen(false);
            setSelectedSignal(null);
          }}
        />
      )}
    </div>
  );
}
