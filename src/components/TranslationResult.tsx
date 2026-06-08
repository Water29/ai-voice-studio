"use client";

import { useState } from "react";
import { formatCost } from "@/lib/cost";
import type { TranslationStyle } from "@/types";

interface TranslationResultProps {
  translatedText: string;
  style: TranslationStyle;
  costUsd: number;
  onCopy?: () => void;
  onRegenerate?: () => void;
}

const CFG: Record<TranslationStyle, { label: string; bar: string; tagBg: string; tagColor: string }> = {
  tiktok:    { label: "TikTok 风格", bar: "#b4a0d8", tagBg: "#f0eaf8", tagColor: "#7b6aaa" },
  professional: { label: "专业商务", bar: "#98acd0", tagBg: "#e8edf8", tagColor: "#5b6e9a" },
  casual:    { label: "日常闲聊", bar: "#90c0a8", tagBg: "#e8f5ee", tagColor: "#5a8a6e" },
  sales:     { label: "美式促销", bar: "#d4a0b0", tagBg: "#faeef2", tagColor: "#9a6070" },
};

export function TranslationResult({ translatedText, style, costUsd, onCopy, onRegenerate }: TranslationResultProps) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(translatedText);

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(translatedText); } catch { /* fallback */ }
    setCopied(true); setTimeout(() => setCopied(false), 2000); onCopy?.();
  };

  if (!translatedText) return null;
  const c = CFG[style];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded-md px-2 py-0.5 text-[11px] font-medium border"
            style={{ background: c.tagBg, color: c.tagColor, borderColor: c.bar + "80" }}>
            {c.label}
          </span>
          <span className="text-[11px] text-gray-400">{formatCost(costUsd)}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setEditing(!editing)}
            className="rounded-lg px-2 py-1 text-[11px] text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 transition-colors">
            {editing ? "预览" : "编辑"}
          </button>
          <button onClick={handleCopy}
            className="rounded-lg px-2 py-1 text-[11px] text-gray-400 hover:text-purple-500 hover:bg-purple-50 transition-colors">
            {copied ? "已复制 ✓" : "复制"}
          </button>
        </div>
      </div>

      {editing ? (
        <div className="space-y-2">
          <textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={3}
            className="w-full rounded-lg border border-purple-200 bg-white px-3 py-2 text-sm text-gray-600 focus:border-purple-400 focus:ring-2 focus:ring-purple-200/50 resize-none" />
          <button onClick={() => setEditing(false)}
            className="rounded-lg px-3 py-1 text-xs font-medium text-white"
            style={{ background: "linear-gradient(135deg, #9b87d0 0%, #8498c8 100%)" }}>保存</button>
        </div>
      ) : (
        <div className="relative rounded-xl border border-purple-200/50 p-3"
          style={{ background: "linear-gradient(135deg, #f5f0fa 0%, #faf0f5 100%)" }}>
          <div className="absolute left-0 top-2 bottom-2 w-1 rounded-full" style={{ background: c.bar }} />
          <p className="pl-3 text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{translatedText}</p>
        </div>
      )}

      {onRegenerate && (
        <button onClick={onRegenerate} className="text-[11px] text-gray-400 hover:text-amber-500 transition-colors">
          🔄 重新翻译
        </button>
      )}
    </div>
  );
}
