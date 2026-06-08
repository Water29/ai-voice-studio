"use client";

// ============================================
// ScriptInput — 中文口播文案输入区
// ============================================

import { useState } from "react";
import type { TranslationStyle } from "@/types";

interface ScriptInputProps {
  onGenerate: (text: string, style: TranslationStyle) => void;
  isGenerating: boolean;
  disabled?: boolean;
}

const STYLES: {
  value: TranslationStyle;
  label: string;
  desc: string;
  gradient: string;
  activeGradient: string;
}[] = [
  {
    value: "tiktok",
    label: "TikTok 风格",
    desc: "自然口语化，适合短视频",
    gradient: "from-gray-50 to-gray-100",
    activeGradient: "from-purple-500 to-violet-500",
  },
  {
    value: "professional",
    label: "专业商务",
    desc: "正式流畅，企业介绍",
    gradient: "from-blue-50 to-sky-50",
    activeGradient: "from-blue-500 to-sky-500",
  },
  {
    value: "casual",
    label: "日常闲聊",
    desc: "轻松随意，生活类内容",
    gradient: "from-emerald-50 to-teal-50",
    activeGradient: "from-emerald-500 to-teal-500",
  },
  {
    value: "sales",
    label: "美式促销",
    desc: "高能量，适合带货",
    gradient: "from-orange-50 to-rose-50",
    activeGradient: "from-orange-500 to-rose-500",
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
    if (text.trim() && !isGenerating) {
      onGenerate(text.trim(), style);
    }
  };

  const charCount = text.length;
  const maxChars = 5000;

  return (
    <div className="space-y-3">
      {/* 标题 */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700">
          中文口播文案
        </h2>
        <p className="mt-0.5 text-xs text-gray-400">
          输入中文营销文案，AI 翻译成自然流畅的英文口播
        </p>
      </div>

      {/* 输入区 */}
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="例如：这款机器人能帮你自动修剪草坪，省时省力，你值得拥有！"
          rows={3}
          maxLength={maxChars}
          disabled={disabled}
          className="w-full rounded-xl border border-purple-100 bg-gradient-to-b from-purple-50/30 to-white px-4 py-2.5 text-sm text-gray-700 placeholder:text-gray-300 focus:border-purple-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-100 disabled:cursor-not-allowed disabled:opacity-50 resize-none transition-all"
        />
        <div className="absolute bottom-2 right-3">
          <span
            className={`text-xs ${
              charCount > maxChars * 0.9 ? "text-red-400" : "text-gray-300"
            }`}
          >
            {charCount}/{maxChars}
          </span>
        </div>
      </div>

      {/* 风格选择 */}
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
              className={`rounded-xl border px-2.5 py-2 text-left text-xs transition-all ${
                style === s.value
                  ? `bg-gradient-to-r ${s.activeGradient} border-transparent text-white shadow-md`
                  : `bg-gradient-to-b ${s.gradient} border-gray-100 text-gray-500 hover:border-purple-200 hover:shadow-sm`
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <div className="font-semibold">{s.label}</div>
              <div
                className={`mt-0.5 ${
                  style === s.value ? "text-white/70" : "text-gray-400"
                }`}
              >
                {s.desc}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 生成按钮 */}
      <button
        onClick={handleGenerate}
        disabled={!text.trim() || isGenerating || disabled}
        className="w-full h-10 text-sm font-semibold rounded-xl bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500 text-white shadow-md shadow-purple-200 hover:shadow-lg hover:shadow-purple-300 hover:scale-[1.01] disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed transition-all"
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
