"use client";

import { useState } from "react";

interface ScriptInputProps {
  onGenerate: (text: string) => void;
  isGenerating: boolean;
}

export function ScriptInput({ onGenerate, isGenerating }: ScriptInputProps) {
  const [text, setText] = useState("");
  const charCount = text.length;
  const maxChars = 5000;

  const handleGenerate = () => {
    if (text.trim() && !isGenerating) onGenerate(text.trim());
  };

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-gray-600">中文口播文案</h2>
        <p className="mt-0.5 text-xs text-gray-400">
          AI 将自动判断风格，生成 3 个版本的英文翻译
        </p>
      </div>

      {/* 输入框 — 加高 + 可见边框 + 字数在下方 */}
      <div>
        <textarea
          value={text} onChange={(e) => setText(e.target.value)}
          placeholder="例如：这款机器人能帮你自动修剪草坪，省时省力，你值得拥有！"
          rows={6} maxLength={maxChars}
          disabled={isGenerating}
          className="w-full rounded-xl bg-white px-4 py-3 text-sm text-gray-600 placeholder:text-gray-350 focus:outline-none focus:ring-2 focus:ring-purple-200/50 disabled:opacity-50 resize-none transition-all"
          style={{
            border: "1.5px solid #d0c4e8",
            boxShadow: "inset 0 1px 3px rgba(120,100,160,0.04)",
          }}
        />
        {/* 字数统计 — 移到输入框下方 */}
        <div className="flex justify-end mt-1">
          <span className={`text-xs ${charCount > maxChars * 0.9 ? "text-red-400" : "text-gray-350"}`}>
            {charCount} / {maxChars}
          </span>
        </div>
      </div>

      <button
        onClick={handleGenerate} disabled={!text.trim() || isGenerating}
        className="w-full h-10 text-sm font-semibold rounded-xl text-white transition-all disabled:cursor-not-allowed"
        style={{
          background: !text.trim()
            ? "linear-gradient(135deg, #c8bce8 0%, #b0b8d8 100%)"
            : "linear-gradient(135deg, #9b87d0 0%, #8498c8 100%)",
          boxShadow: text.trim() ? "0 2px 10px rgba(130,145,190,0.35)" : "none",
          opacity: !text.trim() || isGenerating ? 0.55 : 1,
        }}>
        {isGenerating ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            AI 翻译分析中...
          </span>
        ) : "✨ AI 智能翻译"}
      </button>
    </div>
  );
}
