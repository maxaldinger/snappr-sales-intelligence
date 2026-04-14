"use client";

import { Signal } from "@/lib/types";

const SOURCE_STYLES: Record<string, string> = {
  News: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Job Posting": "bg-violet-500/20 text-violet-400 border-violet-500/30",
  "Gov Contract": "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

function strengthColor(strength: number): string {
  if (strength >= 7) return "bg-emerald-500";
  if (strength >= 4) return "bg-amber-500";
  return "bg-red-500";
}

function strengthLabel(strength: number): string {
  if (strength >= 8) return "Very High";
  if (strength >= 6) return "High";
  if (strength >= 4) return "Medium";
  return "Low";
}

export default function SignalCard({
  signal,
  onGenerateBrief,
  isSelected,
}: {
  signal: Signal;
  onGenerateBrief: (signal: Signal) => void;
  isSelected: boolean;
}) {
  const pct = (signal.signal_strength / 10) * 100;

  return (
    <div
      className={`group relative rounded-lg border p-4 transition-all duration-150 cursor-pointer ${
        isSelected
          ? "border-sky-500/60 bg-sky-500/5"
          : "border-slate-700/60 bg-slate-800/60 hover:border-slate-600 hover:bg-slate-800"
      }`}
      onClick={() => onGenerateBrief(signal)}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: signal info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                SOURCE_STYLES[signal.source] || SOURCE_STYLES.News
              }`}
            >
              {signal.source}
            </span>
            {signal.brief && (
              <span className="inline-flex items-center rounded bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                Brief Ready
              </span>
            )}
          </div>

          <h3 className="text-sm font-semibold text-slate-100 mb-0.5 truncate">
            {signal.account_name}
          </h3>
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {signal.headline}
          </p>
        </div>

        {/* Right: strength + action */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="text-right">
            <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wider mb-1">
              Signal
            </div>
            <div className="flex items-center gap-2">
              <div className="w-16 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${strengthColor(signal.signal_strength)}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span
                className={`text-xs font-bold tabular-nums ${
                  signal.signal_strength >= 7
                    ? "text-emerald-400"
                    : signal.signal_strength >= 4
                      ? "text-amber-400"
                      : "text-red-400"
                }`}
              >
                {signal.signal_strength}
              </span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {strengthLabel(signal.signal_strength)}
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onGenerateBrief(signal);
            }}
            className={`text-[11px] font-medium px-3 py-1.5 rounded transition-colors ${
              signal.brief
                ? "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
                : "bg-sky-500/15 text-sky-400 hover:bg-sky-500/25"
            }`}
          >
            {signal.brief ? "View Brief" : "Generate Brief"}
          </button>
        </div>
      </div>
    </div>
  );
}
