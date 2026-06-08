"use client";

import type { Voice } from "@/types";

interface VoiceMultiSelectProps {
  voices: Voice[];
  selectedIds: Set<string>;
  onToggle: (voiceId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  disabled: boolean;
}

const VOICE_COLORS: Record<string, string> = {
  Adam: "#9b87d0", Rachel: "#8498c8", Bella: "#d4849a",
  Sam: "#90a8c0", Domi: "#c89878", Emily: "#8ba0b8",
};

export function VoiceMultiSelect({
  voices, selectedIds, onToggle, onSelectAll, onDeselectAll, disabled,
}: VoiceMultiSelectProps) {
  return (
    <div className="space-y-2.5">
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

      <div className="space-y-1">
        {voices.map((voice) => {
          const checked = selectedIds.has(voice.voiceId);
          const accent = VOICE_COLORS[voice.name] || "#9b87d0";
          // Rachel, Sam, Domi, Emily 需要付费计划
          const isPaidOnly = ["Rachel", "Sam", "Domi", "Emily"].includes(voice.name);
          const canSelect = !isPaidOnly && !disabled;

          return (
            <div
              key={voice.voiceId}
              onClick={() => canSelect && onToggle(voice.voiceId)}
              className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 transition-all ${
                isPaidOnly ? "opacity-50 cursor-not-allowed" :
                disabled ? "opacity-50 cursor-not-allowed" :
                "cursor-pointer hover:shadow-sm"
              }`}
              style={{
                borderColor: checked ? accent + "80" : "#e5e7eb",
                background: checked
                  ? `linear-gradient(135deg, ${accent}10 0%, ${accent}08 100%)`
                  : "#fff",
              }}>
              {/* checkbox */}
              <div
                className="h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-all"
                style={{
                  borderColor: isPaidOnly ? "#e5e7eb" : checked ? accent : "#d1d5db",
                  background: isPaidOnly ? "#f3f4f6" : checked ? accent : "#fff",
                }}>
                {checked && !isPaidOnly && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-semibold text-gray-600">{voice.name}</span>
                <span className="text-[10px] text-gray-400 ml-1.5">
                  {isPaidOnly ? "付费音色，Free用户暂不可用" : voice.description}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-gray-350">
        已选 {selectedIds.size} 个免费音色
      </p>
    </div>
  );
}
