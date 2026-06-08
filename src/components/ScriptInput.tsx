"use client";

import { useState } from "react";
import type { TranslationStyle } from "@/types";

interface ScriptInputProps {
  onGenerate: (text: string, style: TranslationStyle) => void;
  isGenerating: boolean;
  disabled?: boolean;
}

/** 每个风格独立的柔和配色 — 边框+文字颜色统一色系 */
const STYLES: {
  value: TranslationStyle;
  label: string;
  desc: string;
  activeBorder: string;  // 选中边框
  activeBg: string;      // 选中背景
  activeText: string;    // 选中文字
  hoverBg: string;       // 悬停背景
}[] = [
  {
    value: "tiktok",
    label: "TikTok 风格", desc: "自然口语，短视频",
    activeBorder: "#b4a0d8", activeBg: "#f0eaf8", activeText: "#7b6aaa",
    hoverBg: "#f5f0fa",
  },
  {
    value: "professional",
    label: "专业商务", desc: "正式流畅，企业介绍",
    activeBorder: "#98acd0", activeBg: "#e8edf8", activeText: "#5b6e9a",
    hoverBg: "#eef2fa",
  },
  {
    value: "casual",
    label: "日常闲聊", desc: "轻松随意，生活",
    activeBorder: "#90c0a8", activeBg: "#e8f5ee", activeText: "#5a8a6e",
    hoverBg: "#eef8f2",
  },
  {
    value: "sales",
    label: "美式促销", desc: "高能量，带货",
    activeBorder: "#d4a0b0", activeBg: "#faeef2", activeText: "#9a6070",
    hoverBg: "#fcf3f6",
  },
];

export function ScriptInput({ onGenerate, isGenerating, disabled = false }: ScriptInputProps) {
  const [text, setText] = useState("");
  const [style, setStyle] = useState<TranslationStyle>("tiktok");
  const [hovered, setHovered] = useState<string | null>(null);

  const handleGenerate = () => {
    if (text.trim() && !isGenerating) onGenerate(text.trim(), style);
  };
  const charCount = text.length;
  const maxChars = 5000;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-gray-600">中文口播文案</h2>
        <p className="mt-0.5 text-xs text-gray-400">输入文案，AI 翻译成自然英文口播</p>
      </div>

      {/* 输入框 — 加深边框 */}
      <div className="relative">
        <textarea
          value={text} onChange={(e) => setText(e.target.value)}
          placeholder="例如：这款机器人能帮你自动修剪草坪，省时省力，你值得拥有！"
          rows={3} maxLength={maxChars} disabled={disabled}
          className="w-full rounded-xl border border-purple-250 bg-white px-4 py-2.5 text-sm text-gray-600 placeholder:text-gray-350 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-200/50 disabled:opacity-50 resize-none transition-all"
          style={{ borderColor: "#d0c4e8", boxShadow: "inset 0 1px 3px rgba(120,100,160,0.04)" }}
        />
        <div className="absolute bottom-2 right-3">
          <span className={`text-xs ${charCount > maxChars * 0.9 ? "text-red-400" : "text-gray-350"}`}>
            {charCount}/{maxChars}
          </span>
        </div>
      </div>

      {/* 风格选择 — 每个按钮统一色系 */}
      <div>
        <p className="mb-1.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider">翻译风格</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {STYLES.map((s) => {
            const isActive = style === s.value;
            const isHover = hovered === s.value && !isActive;
            return (
              <button
                key={s.value} onClick={() => setStyle(s.value)} disabled={disabled}
                onMouseEnter={() => setHovered(s.value)}
                onMouseLeave={() => setHovered(null)}
                className="rounded-xl border px-2.5 py-2 text-left text-xs transition-all disabled:opacity-50"
                style={{
                  borderColor: isActive ? s.activeBorder : isHover ? s.activeBorder + "80" : "#e5e7eb",
                  background: isActive ? s.activeBg : isHover ? s.hoverBg : "#fff",
                  color: isActive ? s.activeText : "#9ca3af",
                  fontWeight: isActive ? 600 : 500,
                  boxShadow: isActive ? "0 1px 3px rgba(0,0,0,0.05)" : "none",
                }}
              >
                <div className="font-semibold">{s.label}</div>
                <div className="mt-0.5" style={{ color: isActive ? s.activeText + "99" : "#d1d5db" }}>
                  {s.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 生成按钮 */}
      <button
        onClick={handleGenerate} disabled={!text.trim() || isGenerating || disabled}
        className="w-full h-10 text-sm font-semibold rounded-xl text-white transition-all disabled:cursor-not-allowed"
        style={{
          background: !text.trim()
            ? "linear-gradient(135deg, #c8bce8 0%, #b0b8d8 100%)"
            : "linear-gradient(135deg, #9b87d0 0%, #8498c8 100%)",
          boxShadow: text.trim() ? "0 2px 10px rgba(130,145,190,0.35)" : "none",
          opacity: !text.trim() || isGenerating ? 0.55 : 1,
        }}
      >
        {isGenerating ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            翻译中...
          </span>
        ) : "✨ 生成英文口播"}
      </button>
    </div>
  );
}
