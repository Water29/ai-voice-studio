"use client";

// ============================================
// ScriptInput — 中文口播文案输入区
// ============================================

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { TranslationStyle } from "@/types";

interface ScriptInputProps {
  onGenerate: (text: string, style: TranslationStyle) => void;
  isGenerating: boolean;
  disabled?: boolean;
}

const STYLES: { value: TranslationStyle; label: string; desc: string }[] = [
  {
    value: "tiktok",
    label: "TikTok 风格",
    desc: "自然口语化，适合短视频",
  },
  {
    value: "professional",
    label: "专业商务",
    desc: "正式流畅，适合企业介绍",
  },
  {
    value: "casual",
    label: "日常闲聊",
    desc: "轻松随意，适合生活类内容",
  },
  {
    value: "sales",
    label: "美式促销",
    desc: "高能量销售风，适合带货",
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
    <div className="space-y-4">
      {/* 标题区域 */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-100">
          中文口播文案
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          输入你的中文营销文案，AI 将翻译成自然流畅的英文口播
        </p>
      </div>

      {/* 输入区 */}
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="例如：这款机器人能帮你自动修剪草坪，省时省力，你值得拥有！"
          rows={5}
          maxLength={maxChars}
          disabled={disabled}
          className="w-full rounded-xl border border-zinc-700 bg-zinc-900/50 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
        />
        {/* 字符计数 */}
        <div className="absolute bottom-3 right-3">
          <span
            className={`text-xs ${
              charCount > maxChars * 0.9
                ? "text-red-400"
                : "text-zinc-500"
            }`}
          >
            {charCount}/{maxChars}
          </span>
        </div>
      </div>

      {/* 风格选择 */}
      <div>
        <p className="mb-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">
          翻译风格
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {STYLES.map((s) => (
            <button
              key={s.value}
              onClick={() => setStyle(s.value)}
              disabled={disabled}
              className={`rounded-lg border px-3 py-2.5 text-left text-sm transition-all ${
                style === s.value
                  ? "border-blue-500 bg-blue-500/10 text-blue-300"
                  : "border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <div className="font-medium">{s.label}</div>
              <div className="mt-0.5 text-xs opacity-70">{s.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 生成按钮 */}
      <Button
        onClick={handleGenerate}
        disabled={!text.trim() || isGenerating || disabled}
        className="w-full h-11 text-sm font-medium rounded-xl"
        size="lg"
      >
        {isGenerating ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-100 border-t-transparent" />
            翻译中...
          </span>
        ) : (
          "生成英文口播"
        )}
      </Button>
    </div>
  );
}
