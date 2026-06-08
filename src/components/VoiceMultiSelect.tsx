"use client";

import type { Voice } from "@/types";

interface VoiceMultiSelectProps {
  voices: Voice[];
  selectedIds: Set<string>;
  onToggle: (voiceId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onGenerate: () => void;
  isGenerating: boolean;
  disabled: boolean;
}

const VOICE_COLORS: Record<string, string> = {
  Adam: "#9b87d0", Rachel: "#8498c8", Bella: "#d4849a",
  Sam: "#90a8c0", Domi: "#c89878", Emily: "#8ba0b8",
};

export function VoiceMultiSelect({
  voices, selectedIds, onToggle, onSelectAll, onDeselectAll,
  onGenerate, isGenerating, disabled,
}: VoiceMultiSelectProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-gray-500">🎤 选择音色</h3>
        <div className="flex gap-1">
          <button onClick={onSelectAll} disabled={disabled}
            className="text-[10px] text-purple-400 hover:text-purple-500 px-1.5 py-0.5 rounded transition-colors">
            全选
          </button>
          <button onClick={onDeselectAll} disabled={disabled}
            className="text-[10px] text-gray-400 hover:text-gray-500 px-1.5 py-0.5 rounded transition-colors">
            取消
          </button>
        </div>
      </div>

      {/* 音色列表 */}
      <div className="space-y-1">
        {voices.map((voice) => {
          const checked = selectedIds.has(voice.voiceId);
          const accent = VOICE_COLORS[voice.name] || "#9b87d0";
          return (
            <div
              key={voice.voiceId}
              onClick={() => !disabled && onToggle(voice.voiceId)}
              className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 cursor-pointer transition-all ${
                disabled ? "opacity-50 cursor-not-allowed" : "hover:shadow-sm"
              }`}
              style={{
                borderColor: checked ? accent + "80" : "#e5e7eb",
                background: checked
                  ? `linear-gradient(135deg, ${accent}10 0%, ${accent}08 100%)`
                  : "#fff",
              }}>
              {/* 自定义 checkbox */}
              <div
                className="h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-all"
                style={{
                  borderColor: checked ? accent : "#d1d5db",
                  background: checked ? accent : "#fff",
                }}>
                {checked && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-semibold text-gray-600">{voice.name}</span>
                <span className="text-[10px] text-gray-400 ml-1.5">{voice.description}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 生成按钮 */}
      <button
        onClick={onGenerate} disabled={selectedIds.size === 0 || isGenerating || disabled}
        className="w-full h-9 text-xs font-semibold rounded-xl text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: selectedIds.size > 0
            ? "linear-gradient(135deg, #9b87d0 0%, #8498c8 100%)"
            : "linear-gradient(135deg, #c8bce8 0%, #b0b8d8 100%)",
          boxShadow: selectedIds.size > 0 ? "0 2px 8px rgba(130,145,190,0.3)" : "none",
        }}>
        {isGenerating ? (
          <span className="flex items-center justify-center gap-1.5">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            生成中...
          </span>
        ) : (
          `🎤 生成语音 (${selectedIds.size} 个音色)`
        )}
      </button>
    </div>
  );
}
