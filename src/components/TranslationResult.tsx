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

const STYLE_CONFIG: Record<
  TranslationStyle,
  { label: string; barColor: string; tagBg: string; tagColor: string }
> = {
  tiktok: {
    label: "TikTok 风格",
    barColor: "#c4b5fd",
    tagBg: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)",
    tagColor: "#8b7fc0",
  },
  professional: {
    label: "专业商务",
    barColor: "#a5b4fc",
    tagBg: "linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)",
    tagColor: "#7c8cc0",
  },
  casual: {
    label: "日常闲聊",
    barColor: "#a7c9b8",
    tagBg: "linear-gradient(135deg, #f0faf4 0%, #e6f5ed 100%)",
    tagColor: "#6d9e82",
  },
  sales: {
    label: "美式促销",
    barColor: "#f0c0cc",
    tagBg: "linear-gradient(135deg, #fef5f7 0%, #fde8ed 100%)",
    tagColor: "#b87d8a",
  },
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
      const ta = document.createElement("textarea");
      ta.value = translatedText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy?.();
  };

  if (!translatedText) return null;

  const config = STYLE_CONFIG[style];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="rounded-md px-2 py-0.5 text-[11px] font-medium border"
            style={{
              background: config.tagBg,
              color: config.tagColor,
              borderColor: config.barColor + "80",
            }}
          >
            {config.label}
          </span>
          <span className="text-[11px] text-gray-400">
            {formatCost(costUsd)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {/* 编辑按钮 — 蓝灰色调 */}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="rounded-lg px-2 py-1 text-[11px] text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 transition-colors"
          >
            {isEditing ? "预览" : "编辑"}
          </button>
          {/* 复制按钮 — 紫色调 */}
          <button
            onClick={handleCopy}
            className="rounded-lg px-2 py-1 text-[11px] text-gray-400 hover:text-purple-500 hover:bg-purple-50 transition-colors"
          >
            {copied ? "已复制 ✓" : "复制"}
          </button>
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-purple-100 bg-white px-3 py-2 text-sm text-gray-600 focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-100/40 resize-none"
          />
          <button
            onClick={() => setIsEditing(false)}
            className="rounded-lg px-3 py-1 text-xs font-medium text-white"
            style={{
              background: "linear-gradient(135deg, #b4a5e8 0%, #a0aedd 100%)",
            }}
          >
            保存
          </button>
        </div>
      ) : (
        <div
          className="relative rounded-xl border border-purple-50 p-3"
          style={{
            background:
              "linear-gradient(135deg, #faf5ff 0%, #fdf2f8 100%)",
          }}
        >
          <div
            className="absolute left-0 top-2 bottom-2 w-1 rounded-full"
            style={{ background: config.barColor }}
          />
          <p className="pl-3 text-sm text-gray-500 leading-relaxed whitespace-pre-wrap">
            {translatedText}
          </p>
        </div>
      )}

      {/* 重新翻译 — 柔和琥珀色 */}
      {onRegenerate && (
        <button
          onClick={onRegenerate}
          className="text-[11px] text-gray-400 hover:text-amber-600 transition-colors"
        >
          🔄 重新翻译
        </button>
      )}
    </div>
  );
}
