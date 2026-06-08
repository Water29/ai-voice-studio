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

  if (!translatedText) {
    return null;
  }

  return (
    <div className="space-y-3 rounded-xl border border-gray-100 bg-purple-50/30 p-4">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-600">
            {STYLE_LABELS[style]}
          </span>
          <span className="text-xs text-gray-400">
            费用 {formatCost(costUsd)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            className="h-7 text-xs text-gray-400 hover:text-purple-600 hover:bg-purple-50"
          >
            {isEditing ? "预览" : "编辑"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-7 text-xs text-gray-400 hover:text-purple-600 hover:bg-purple-50"
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
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100 resize-none"
          />
          <Button
            size="sm"
            onClick={() => setIsEditing(false)}
            className="text-xs rounded-lg bg-purple-500 hover:bg-purple-600 text-white"
          >
            保存
          </Button>
        </div>
      ) : (
        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
          {translatedText}
        </p>
      )}

      {/* 重新生成 */}
      {onRegenerate && (
        <div className="pt-1 border-t border-purple-100">
          <button
            onClick={onRegenerate}
            className="text-xs text-gray-400 hover:text-purple-500 transition-colors"
          >
            🔄 重新翻译
          </button>
        </div>
      )}
    </div>
  );
}
