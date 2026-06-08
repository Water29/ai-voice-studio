"use client";

import { useState } from "react";
import type { TranslationStyle } from "@/types";

interface ScriptInputProps {
  onGenerate: (text: string, style: TranslationStyle) => void;
  isGenerating: boolean;
  disabled?: boolean;
}

/** 每个风格独立的柔和配色 */
const STYLES: {
  value: TranslationStyle;
  label: string;
  desc: string;
  color: string;        // 选中边框+文字色
  bg: string;            // 选中背景
  hoverBg: string;       // 悬停背景
}[] = [
  {
    value: "tiktok",
    label: "TikTok 风格",
    desc: "自然口语，适合短视频",
    color: "#9b8eca",
    bg: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)",
    hoverBg: "#f5f3ff",
  },
  {
    value: "professional",
    label: "专业商务",
    desc: "正式流畅，企业介绍",
    color: "#8ba3c7",
    bg: "linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)",
    hoverBg: "#eef2ff",
  },
  {
    value: "casual",
    label: "日常闲聊",
    desc: "轻松随意，生活类内容",
    color: "#8cbaa0",
    bg: "linear-gradient(135deg, #f0faf4 0%, #e6f5ed 100%)",
    hoverBg: "#f0faf4",
  },
  {
    value: "sales",
    label: "美式促销",
    desc: "高能量，适合带货",
    color: "#c99da8",
    bg: "linear-gradient(135deg, #fef5f7 0%, #fde8ed 100%)",
    hoverBg: "#fef5f7",
  },
];

export function ScriptInput({
  onGenerate,
  isGenerating,
  disabled = false,
}: ScriptInputProps) {
  const [text, setText] = useState("");
  const [style, setStyle] = useState<TranslationStyle>("tiktok");

  const handleGenerate = () => {
    if (text.trim() && !isGenerating) onGenerate(text.trim(), style);
  };

  const charCount = text.length;
  const maxChars = 5000;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-gray-500">
          中文口播文案
        </h2>
        <p className="mt-0.5 text-xs text-gray-400">
          输入中文营销文案，AI 将翻译成自然流畅的英文口播
        </p>
      </div>

      {/* 输入框 */}
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="例如：这款机器人能帮你自动修剪草坪，省时省力，你值得拥有！"
          rows={3}
          maxLength={maxChars}
          disabled={disabled}
          className="w-full rounded-xl border border-purple-100/60 bg-white px-4 py-2.5 text-sm text-gray-600 placeholder:text-gray-350 focus:border-purple-250 focus:outline-none focus:ring-2 focus:ring-purple-100/40 disabled:cursor-not-allowed disabled:opacity-50 resize-none transition-all"
          style={{ boxShadow: "inset 0 1px 3px rgba(168,85,247,0.03)" }}
        />
        <div className="absolute bottom-2 right-3">
          <span
            className={`text-xs ${
              charCount > maxChars * 0.9 ? "text-red-400" : "text-gray-350"
            }`}
          >
            {charCount}/{maxChars}
          </span>
        </div>
      </div>

      {/* 风格选择 — 每个按钮不同颜色 */}
      <div>
        <p className="mb-1.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider">
          翻译风格
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {STYLES.map((s) => (
            <button
              key={s.value}
              onClick={() => setStyle(s.value)}
              disabled={disabled}
              className="rounded-xl border px-2.5 py-2 text-left text-xs transition-all disabled:cursor-not-allowed disabled:opacity-50"
              style={
                style === s.value
                  ? {
                      borderColor: s.color,
                      background: s.bg,
                      color: s.color,
                      fontWeight: 600,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    }
                  : {
                      borderColor: "#f3f4f6",
                      background: "#fff",
                      color: "#9ca3af",
                      fontWeight: 500,
                    }
              }
              onMouseEnter={(e) => {
                if (style !== s.value) {
                  (e.target as HTMLElement).style.background = s.hoverBg;
                  (e.target as HTMLElement).style.borderColor = s.color + "40";
                }
              }}
              onMouseLeave={(e) => {
                if (style !== s.value) {
                  (e.target as HTMLElement).style.background = "#fff";
                  (e.target as HTMLElement).style.borderColor = "#f3f4f6";
                }
              }}
            >
              <div className="font-semibold">{s.label}</div>
              <div
                className="mt-0.5"
                style={{
                  color:
                    style === s.value ? s.color + "99" : "#d1d5db",
                }}
              >
                {s.desc}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 生成按钮 — 柔和紫 */}
      <button
        onClick={handleGenerate}
        disabled={!text.trim() || isGenerating || disabled}
        className="w-full h-10 text-sm font-semibold rounded-xl text-white transition-all disabled:cursor-not-allowed"
        style={{
          background: !text.trim()
            ? "linear-gradient(135deg, #d8cef0 0%, #c4c8e8 100%)"
            : "linear-gradient(135deg, #b4a5e8 0%, #a0aedd 100%)",
          boxShadow: text.trim()
            ? "0 2px 10px rgba(160,174,221,0.3)"
            : "none",
          opacity: !text.trim() || isGenerating ? 0.5 : 1,
        }}
      >
        {isGenerating ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            翻译中...
          </span>
        ) : (
          "✨ 生成英文口播"
        )}
      </button>
    </div>
  );
}
