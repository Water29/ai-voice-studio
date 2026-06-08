"use client";

import type { Voice, TTSResponse, VoiceRecommendation } from "@/types";

interface VoiceSelectorProps {
  voices: Voice[];
  selectedId: string | null;
  results: (TTSResponse & { _error?: string })[];
  isGenerating: boolean;
  recommendation?: { voiceName: string; style: string; score: number; reason: string } | null;
  onSelect: (voice: Voice) => void;
  onGenerateAll: (voiceIds: string[]) => void;
}

export function VoiceSelector({
  voices, selectedId, results, isGenerating, recommendation,
  onSelect, onGenerateAll,
}: VoiceSelectorProps) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-gray-500">🎤 选择音色</h3>
        <button
          onClick={() => onGenerateAll(voices.map((v) => v.voiceId))}
          disabled={isGenerating}
          className="rounded-lg border px-2 py-0.5 text-[10px] transition-colors disabled:opacity-40"
          style={{ borderColor: "#d0c4e8", color: "#9b87d0" }}>
          {isGenerating ? "生成中..." : "全部试听"}
        </button>
      </div>

      {/* AI 推荐提示 */}
      {recommendation && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/50 px-2.5 py-1.5 flex items-center gap-2">
          <span className="text-[18px]">🤖</span>
          <div>
            <span className="text-[11px] font-semibold text-amber-700">
              推荐 {recommendation.voiceName}
            </span>
            <span className="text-[10px] text-amber-500 ml-1">
              {recommendation.score}% 匹配
            </span>
            <p className="text-[10px] text-amber-400 mt-0.5">{recommendation.reason}</p>
          </div>
        </div>
      )}

      {/* 音色网格 */}
      <div className="grid grid-cols-2 gap-1.5">
        {voices.map((voice) => {
          const isSelected = voice.voiceId === selectedId;
          const isRecommended = recommendation?.voiceName === voice.name;
          const result = results.find((r) => r.voiceName === voice.name);

          return (
            <button
              key={voice.voiceId}
              onClick={() => onSelect(voice)}
              disabled={isGenerating}
              className="rounded-lg border px-2.5 py-2 text-left transition-all disabled:opacity-50 relative"
              style={
                isSelected
                  ? { borderColor: "#b4a0d8", background: "linear-gradient(135deg, #f0eaf8 0%, #ede5f8 100%)", color: "#7b6aaa" }
                  : isRecommended
                  ? { borderColor: "#fcd34d", background: "#fffbeb", color: "#92400e" }
                  : { borderColor: "#e5e7eb", background: "#fff", color: "#6b7280" }
              }>
              {isRecommended && (
                <span className="absolute -top-1 -right-1 text-[10px]">⭐</span>
              )}
              <div className="text-[11px] font-semibold">{voice.name}</div>
              <div className="mt-0.5 text-[10px] opacity-70">{voice.description}</div>
              {result && !result._error && (
                <div className="mt-1 flex items-center gap-1">
                  <span className="text-[10px] text-emerald-500">✓</span>
                  <span className="text-[10px] opacity-60">{result.durationMs ? `${(result.durationMs/1000).toFixed(0)}s` : ""}</span>
                </div>
              )}
              {result?._error && <div className="mt-1 text-[10px] text-rose-400">失败</div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
