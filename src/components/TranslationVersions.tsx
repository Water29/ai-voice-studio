"use client";

import { useState } from "react";

interface TransVersion {
  translatedText: string; style: string; tokensUsed: number; costUsd: number;
  description: string; label: string; _error?: string;
}

interface TranslationVersionsProps {
  versions: TransVersion[];
  onRegenerate: (index: number) => void;
  isRegenerating: boolean;
}

const COLORS = [
  { bar: "#b4a0d8", bg: "#f0eaf8", text: "#7b6aaa" },
  { bar: "#98acd0", bg: "#e8edf8", text: "#5b6e9a" },
  { bar: "#90c0a8", bg: "#e8f5ee", text: "#5a8a6e" },
];

function VersionCard({ v, index, onRegenerate, isRegenerating }: {
  v: TransVersion; index: number; onRegenerate: (i: number) => void; isRegenerating: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const c = COLORS[index];

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(v.translatedText); } catch { /* fallback */ }
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border flex flex-col" style={{ borderColor: c.bar + "80", background: "#fff" }}>
      {/* 标签 */}
      <div className="px-3 py-2 rounded-t-xl flex items-center justify-between"
        style={{ background: `linear-gradient(135deg, ${c.bg} 0%, #fff 100%)` }}>
        <div>
          <span className="text-[11px] font-semibold" style={{ color: c.text }}>{v.label}</span>
          <p className="text-[10px] mt-0.5 opacity-70" style={{ color: c.text }}>{v.description}</p>
        </div>
        {v._error && <span className="text-[10px] text-rose-400">失败</span>}
      </div>
      {/* 文本 */}
      <div className="px-3 py-2 flex-1">
        <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">
          {v.translatedText || "等待生成..."}
        </p>
      </div>
      {/* 操作 */}
      <div className="px-3 py-1.5 border-t border-gray-100 flex items-center gap-1.5">
        <button onClick={handleCopy}
          className="text-[10px] text-gray-400 hover:text-purple-500 px-1.5 py-0.5 rounded transition-colors">
          {copied ? "已复制" : "复制"}
        </button>
        <button onClick={() => onRegenerate(index)} disabled={isRegenerating}
          className="text-[10px] text-gray-400 hover:text-amber-500 px-1.5 py-0.5 rounded transition-colors disabled:opacity-50">
          🔄 重译
        </button>
      </div>
    </div>
  );
}

export function TranslationVersions({ versions, onRegenerate, isRegenerating }: TranslationVersionsProps) {
  return (
    <div className="space-y-3">
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        📝 AI 多版本翻译
      </h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {versions.map((v, i) => (
          <VersionCard key={i} v={v} index={i} onRegenerate={onRegenerate} isRegenerating={isRegenerating} />
        ))}
      </div>
    </div>
  );
}
