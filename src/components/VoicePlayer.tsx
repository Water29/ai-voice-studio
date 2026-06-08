"use client";

import { useRef, useState, useEffect, useCallback } from "react";

interface VoicePlayerProps {
  audioUrl: string | null;
  voiceName?: string | null;
  durationMs?: number | null;
  onDownload?: () => void;
}

function fmt(ms: number): string {
  const t = Math.floor(ms / 1000);
  return `${Math.floor(t / 60)}:${(t % 60).toString().padStart(2, "0")}`;
}

export function VoicePlayer({ audioUrl, voiceName, durationMs, onDownload }: VoicePlayerProps) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(0);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { setPlaying(false); setCur(0); setDur(0); setErr(null); }, [audioUrl]);

  const toggle = useCallback(() => {
    const a = ref.current; if (!a) return;
    if (playing) a.pause(); else a.play().catch((e) => setErr(`播放失败: ${e.message}`));
  }, [playing]);

  const seek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const t = Number(e.target.value); if (ref.current) { ref.current.currentTime = t; setCur(t); }
  }, []);

  if (!audioUrl) return null;
  const dd = dur || (durationMs ? durationMs / 1000 : 0);
  const pct = dd > 0 ? cur / dd : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-600">🎤 {voiceName || "语音"}</span>
          <span className="text-[11px] text-gray-400">{dd > 0 && fmt(dd * 1000)}</span>
        </div>
        <button onClick={onDownload}
          className="rounded-lg border border-emerald-250 px-2.5 py-1 text-[11px] text-emerald-600 hover:bg-emerald-50 transition-colors"
          style={{ borderColor: "#a0d8b8" }}>
          ⬇ 下载 MP3
        </button>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-purple-200/50 px-3 py-2.5"
        style={{ background: "linear-gradient(135deg, #f5f0fa 0%, #f0eaf8 100%)" }}>
        <button onClick={toggle}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white shadow-sm transition-all hover:scale-105"
          style={{ background: "linear-gradient(135deg, #9b87d0 0%, #8498c8 100%)", boxShadow: "0 2px 6px rgba(130,145,190,0.3)" }}>
          {playing ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
          )}
        </button>
        <div className="flex-1">
          <input type="range" min={0} max={dd || 0} step={0.1} value={cur} onChange={seek}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-400 [&::-webkit-slider-thumb]:shadow-sm"
            style={{ background: `linear-gradient(to right, #b4a0d8 ${pct*100}%, #e8e0f5 ${pct*100}%)` }} />
        </div>
        <span className="text-[11px] text-gray-350 min-w-[68px] text-right tabular-nums">
          {fmt(cur*1000)}/{dd>0?fmt(dd*1000):"--:--"}
        </span>
      </div>

      <audio ref={ref} src={audioUrl} preload="auto"
        onTimeUpdate={() => { if (ref.current) setCur(ref.current.currentTime); }}
        onLoadedMetadata={() => { if (ref.current) setDur(ref.current.duration); }}
        onEnded={() => { setPlaying(false); setCur(0); }}
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />
      {err && <p className="text-[11px] text-red-400">{err}</p>}
    </div>
  );
}
