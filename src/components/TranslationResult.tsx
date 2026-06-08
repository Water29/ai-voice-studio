"use client";

// ============================================
// TranslationResult — 英文翻译结果展示
// ============================================

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

const STYLE_CONFIG: Record<
  TranslationStyle,
  { label: string; accent: string }
> = {
  tiktok: { label: "TikTok 风格", accent: "from-purple-500 to-violet-500" },
  professional: {
    label: "专业商务",
    accent: "from-blue-500 to-sky-500",
  },
  casual: { label: "日常闲聊", accent: "from-emerald-500 to-teal-500" },
  sales: { label: "美式促销", accent: "from-orange-500 to-rose-500" },
};

export function TranslationResult({
  translatedText,
  style,
  costUsd,
  onCopy,
  onRegenerate,
}: TranslationResultProps) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(translatedText);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(translatedText);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = translatedText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy?.();
  };

  if (!translatedText) return null;

  const config = STYLE_CONFIG[style];

  return (
    <div className="space-y-2.5">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`rounded-md bg-gradient-to-r ${config.accent} px-2 py-0.5 text-[11px] font-medium text-white`}
          >
            {config.label}
          </span>
          <span className="text-[11px] text-gray-400">
            {formatCost(costUsd)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="rounded-lg px-2 py-1 text-[11px] text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
          >
            {isEditing ? "预览" : "编辑"}
          </button>
          <button
            onClick={handleCopy}
            className="rounded-lg px-2 py-1 text-[11px] text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
          >
            {copied ? "已复制 ✓" : "复制"}
          </button>
        </div>
      </div>

      {/* 内容 */}
      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-purple-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100 resize-none"
          />
          <button
            onClick={() => setIsEditing(false)}
            className="rounded-lg bg-gradient-to-r from-purple-500 to-violet-500 px-3 py-1 text-xs font-medium text-white"
          >
            保存
          </button>
        </div>
      ) : (
        <div className="relative rounded-xl bg-gradient-to-br from-purple-50/50 via-white to-pink-50/30 border border-purple-100/60 p-3">
          {/* 左侧装饰条 */}
          <div
            className={`absolute left-0 top-2 bottom-2 w-1 rounded-full bg-gradient-to-b ${config.accent}`}
          />
          <p className="pl-3 text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
            {translatedText}
          </p>
        </div>
      )}

      {/* 重新生成 */}
      {onRegenerate && (
        <button
          onClick={onRegenerate}
          className="text-[11px] text-gray-400 hover:text-purple-500 transition-colors"
        >
          🔄 重新翻译
        </button>
      )}
    </div>
  );
}
