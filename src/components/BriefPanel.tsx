"use client";

import { useState } from "react";
import { Signal } from "@/lib/types";

function BriefContent({ markdown }: { markdown: string }) {
  const lines = markdown.split("\n");
  const elements: React.ReactNode[] = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("## ")) {
      elements.push(
        <h2
          key={key++}
          className="text-sm font-bold text-sky-400 mt-5 mb-1.5 uppercase tracking-wide first:mt-0"
        >
          {line.slice(3)}
        </h2>
      );
    } else if (/^\d+\.\s/.test(line)) {
      const text = line.replace(/^\d+\.\s+/, "");
      elements.push(
        <div key={key++} className="flex gap-2 text-[13px] text-slate-300 leading-relaxed ml-1 mb-1">
          <span className="text-slate-500 shrink-0">{line.match(/^\d+/)?.[0]}.</span>
          <span>{text}</span>
        </div>
      );
    } else if (line.startsWith("- ")) {
      elements.push(
        <div key={key++} className="flex gap-2 text-[13px] text-slate-300 leading-relaxed ml-1 mb-1">
          <span className="text-slate-500 shrink-0">&bull;</span>
          <span>{line.slice(2)}</span>
        </div>
      );
    } else if (line.trim() === "") {
      elements.push(<div key={key++} className="h-1" />);
    } else {
      // Bold handling: **text**
      const parts = line.split(/\*\*(.+?)\*\*/g);
      const spans = parts.map((part, j) =>
        j % 2 === 1 ? (
          <strong key={j} className="text-slate-100 font-semibold">
            {part}
          </strong>
        ) : (
          <span key={j}>{part}</span>
        )
      );
      elements.push(
        <p key={key++} className="text-[13px] text-slate-300 leading-relaxed mb-1">
          {spans}
        </p>
      );
    }
  }

  return <div>{elements}</div>;
}

export default function BriefPanel({
  signal,
  briefContent,
  loading,
  onClose,
}: {
  signal: Signal | null;
  briefContent: string | null;
  loading: boolean;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!briefContent) return;
    const plain = briefContent.replace(/^## /gm, "").replace(/\*\*/g, "");
    await navigator.clipboard.writeText(plain);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-full max-w-lg bg-panel-900 border-l border-slate-700/60 z-50 animate-slide-in flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/60">
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-100 truncate">
              {signal?.account_name || "Account Brief"}
            </h2>
            {signal && (
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                {signal.source} &middot; {signal.vertical}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopy}
              disabled={!briefContent || loading}
              className="text-[11px] font-medium px-3 py-1.5 rounded bg-slate-700/60 text-slate-300 hover:bg-slate-700 disabled:opacity-40 transition-colors"
            >
              {copied ? "Copied" : "Copy Brief"}
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 transition-colors p-1"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <div className="w-6 h-6 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
              <p className="text-xs text-slate-500">
                Generating account intelligence...
              </p>
            </div>
          ) : briefContent ? (
            <BriefContent markdown={briefContent} />
          ) : (
            <div className="flex items-center justify-center h-48">
              <p className="text-xs text-slate-500">No brief available</p>
            </div>
          )}
        </div>

        {/* Signal context footer */}
        {signal && (
          <div className="px-5 py-3 border-t border-slate-700/60 bg-slate-800/40">
            <p className="text-[11px] text-slate-500 line-clamp-2">
              {signal.headline}
            </p>
            {signal.url && (
              <a
                href={signal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-1 text-[11px] text-sky-500 hover:text-sky-400 transition-colors"
              >
                View source article
              </a>
            )}
          </div>
        )}
      </div>
    </>
  );
}
