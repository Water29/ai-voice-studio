"use client";

// ============================================
// VoiceSelector — 多音色选择 + 并发生成预览
// ============================================

import type { Voice, TTSResponse } from "@/types";

interface VoiceSelectorProps {
  voices: Voice[];
  selectedId: string | null;
  results: (TTSResponse & { _error?: string })[];
  isGenerating: boolean;
  onSelect: (voice: Voice) => void;
  onGenerateAll: (voiceIds: string[]) => void;
}

export function VoiceSelector({
  voices,
  selectedId,
  results,
  isGenerating,
  onSelect,
  onGenerateAll,
}: VoiceSelectorProps) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-gray-500">
          🎤 选择音色
        </h3>
        <button
          onClick={() => onGenerateAll(voices.map((v) => v.voiceId))}
          disabled={isGenerating}
          className="rounded-lg border px-2 py-0.5 text-[10px] transition-colors disabled:opacity-40"
          style={{
            borderColor: "#d0c4e8",
            color: "#9b87d0",
          }}
        >
          {isGenerating ? "生成中..." : "全部试听"}
        </button>
      </div>

      {/* 音色网格 */}
      <div className="grid grid-cols-2 gap-1.5">
        {voices.map((voice) => {
          const isSelected = voice.voiceId === selectedId;
          const result = results.find((r) => r.voiceName === voice.name);

          return (
            <button
              key={voice.voiceId}
              onClick={() => onSelect(voice)}
              disabled={isGenerating}
              className={`rounded-lg border px-2.5 py-2 text-left transition-all disabled:opacity-50 ${
                isSelected
                  ? "ring-1"
                  : "hover:shadow-sm"
              }`}
              style={
                isSelected
                  ? {
                      borderColor: "#b4a0d8",
                      background: "linear-gradient(135deg, #f0eaf8 0%, #ede5f8 100%)",
                      color: "#7b6aaa",
                    }
                  : {
                      borderColor: "#e5e7eb",
                      background: "#fff",
                      color: "#6b7280",
                    }
              }
            >
              <div className="text-[11px] font-semibold">{voice.name}</div>
              <div className="mt-0.5 text-[10px] opacity-70">{voice.description}</div>
              {result && !result._error && (
                <div className="mt-1 flex items-center gap-1">
                  <span className="text-[10px] text-emerald-500">✓ 已生成</span>
                  <span className="text-[10px] opacity-60">{result.durationMs ? `${(result.durationMs / 1000).toFixed(0)}s` : ""}</span>
                </div>
              )}
              {result?._error && (
                <div className="mt-1 text-[10px] text-rose-400">生成失败</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
