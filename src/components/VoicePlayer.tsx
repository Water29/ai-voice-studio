"use client";

import { useRef, useState, useEffect, useCallback } from "react";

interface VoicePlayerProps {
  audioUrl: string | null;
  voiceName?: string | null;
  durationMs?: number | null;
  onDownload?: () => void;
}

function fmt(ms: number): string {
  const total = Math.floor(ms / 1000);
  return `${Math.floor(total / 60)}:${(total % 60).toString().padStart(2, "0")}`;
}

export function VoicePlayer({
  audioUrl,
  voiceName,
  durationMs,
  onDownload,
}: VoicePlayerProps) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [dur, setDur] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPlaying(false);
    setCurrent(0);
    setDur(0);
    setError(null);
  }, [audioUrl]);

  const toggle = useCallback(() => {
    const a = ref.current;
    if (!a) return;
    if (playing) a.pause();
    else a.play().catch((e) => setError(`播放失败: ${e.message}`));
  }, [playing]);

  const seek = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const t = Number(e.target.value);
      if (ref.current) {
        ref.current.currentTime = t;
        setCurrent(t);
      }
    },
    []
  );

  if (!audioUrl) return null;

  const displayDur = dur || (durationMs ? durationMs / 1000 : 0);
  const pct = displayDur > 0 ? current / displayDur : 0;

  return (
    <div className="space-y-3">
      {/* 顶部信息 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500">
            🎤 {voiceName || "语音"}
          </span>
          <span className="text-[11px] text-gray-400">
            {displayDur > 0 && fmt(displayDur * 1000)}
          </span>
        </div>
        {/* 下载按钮 — 绿色调 */}
        <button
          onClick={onDownload}
          className="rounded-lg border border-emerald-200 px-2.5 py-1 text-[11px] text-emerald-500 hover:bg-emerald-50 transition-colors"
        >
          ⬇ 下载 MP3
        </button>
      </div>

      {/* 播放条 */}
      <div
        className="flex items-center gap-3 rounded-xl border border-purple-50 px-3 py-2.5"
        style={{
          background:
            "linear-gradient(135deg, #faf5ff 0%, #f5f3ff 100%)",
        }}
      >
        {/* 播放按钮 — 柔和紫 */}
        <button
          onClick={toggle}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white shadow-sm transition-all hover:scale-105"
          style={{
            background:
              "linear-gradient(135deg, #b4a5e8 0%, #a0aedd 100%)",
            boxShadow: "0 2px 6px rgba(160,174,221,0.3)",
          }}
        >
          {playing ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          )}
        </button>

        <div className="flex-1">
          <input
            type="range"
            min={0}
            max={displayDur || 0}
            step={0.1}
            value={current}
            onChange={seek}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:h-3
              [&::-webkit-slider-thumb]:w-3
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:shadow-sm
              [&::-webkit-slider-thumb]:cursor-pointer"
            style={{
              background: `linear-gradient(to right, #c4b5fd ${pct * 100}%, #ede9fe ${pct * 100}%)`,
            }}
          />
        </div>

        <span className="text-[11px] text-gray-300 min-w-[68px] text-right tabular-nums">
          {fmt(current * 1000)}/{displayDur > 0 ? fmt(displayDur * 1000) : "--:--"}
        </span>
      </div>

      <audio
        ref={ref}
        src={audioUrl}
        onTimeUpdate={() => {
          if (ref.current) setCurrent(ref.current.currentTime);
        }}
        onLoadedMetadata={() => {
          if (ref.current) setDur(ref.current.duration);
        }}
        onEnded={() => {
          setPlaying(false);
          setCurrent(0);
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        preload="auto"
      />

      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  );
}
