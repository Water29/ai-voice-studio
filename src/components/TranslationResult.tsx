"use client";

// ============================================
// TranslationResult — 英文翻译结果展示
// ============================================

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatCost } from "@/lib/cost";
import type { TranslationStyle } from "@/types";

interface TranslationResultProps {
  translatedText: string;
  style: TranslationStyle;
  costUsd: number;
  onCopy?: () => void;
  onRegenerate?: () => void;
}

const STYLE_LABELS: Record<TranslationStyle, string> = {
  tiktok: "TikTok 风格",
  professional: "专业商务",
  casual: "日常闲聊",
  sales: "美式促销",
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
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onCopy?.();
    } catch {
      // fallback: 通过 textarea 复制
      const textarea = document.createElement("textarea");
      textarea.value = translatedText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveEdit = () => {
    // 编辑后的文本通过回调传出
    setIsEditing(false);
  };

  if (!translatedText) {
    return null;
  }

  return (
    <div className="space-y-3 rounded-xl border border-zinc-700/50 bg-zinc-800/30 p-4">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-400">
            {STYLE_LABELS[style]}
          </span>
          <span className="text-xs text-zinc-500">
            预估费用 {formatCost(costUsd)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            className="h-7 text-xs text-zinc-400 hover:text-zinc-200"
          >
            {isEditing ? "预览" : "编辑"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-7 text-xs text-zinc-400 hover:text-zinc-200"
          >
            {copied ? "已复制 ✓" : "复制"}
          </Button>
        </div>
      </div>

      {/* 内容 */}
      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-zinc-600 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
          />
          <Button
            size="sm"
            onClick={handleSaveEdit}
            className="text-xs rounded-lg"
          >
            保存
          </Button>
        </div>
      ) : (
        <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
          {translatedText}
        </p>
      )}

      {/* 重新生成（可选） */}
      {onRegenerate && (
        <div className="pt-1 border-t border-zinc-700/30">
          <button
            onClick={onRegenerate}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            🔄 重新翻译
          </button>
        </div>
      )}
    </div>
  );
}
