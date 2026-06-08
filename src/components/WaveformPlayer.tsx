"use client";

// ============================================
// WaveformPlayer — wavesurfer.js 波形播放器
// ============================================

import { useRef, useEffect, useState, useCallback } from "react";

interface WaveformPlayerProps {
  audioUrl: string;
  voiceName?: string;
  onDownload?: () => void;
}

function fmt(ms: number): string {
  const t = Math.floor(ms / 1000);
  return `${Math.floor(t / 60)}:${(t % 60).toString().padStart(2, "0")}`;
}

export function WaveformPlayer({ audioUrl, voiceName, onDownload }: WaveformPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<any>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ws: any = null;
    let cleanup = false;

    const init = async () => {
      try {
        const WaveSurfer = (await import("wavesurfer.js")).default;
        if (cleanup || !containerRef.current) return;

        ws = WaveSurfer.create({
          container: containerRef.current,
          waveColor: "#e8e0f5",
          progressColor: "#b4a0d8",
          cursorColor: "#9b87d0",
          cursorWidth: 2,
          height: 48,
          barWidth: 2,
          barGap: 1,
          barRadius: 2,
          normalize: true,
        });

        ws.load(audioUrl);

        ws.on("ready", () => {
          if (cleanup) return;
          setDuration(ws.getDuration());
          setLoaded(true);
        });

        ws.on("audioprocess", () => {
          if (cleanup) return;
          setCurrent(ws.getCurrentTime());
        });

        ws.on("play", () => setPlaying(true));
        ws.on("pause", () => setPlaying(false));
        ws.on("finish", () => { setPlaying(false); setCurrent(0); });
        ws.on("error", (e: any) => {
          if (!cleanup) setError("波形加载失败");
        });

        wavesurferRef.current = ws;
      } catch {
        if (!cleanup) setError("波形组件初始化失败");
      }
    };

    init();

    return () => {
      cleanup = true;
      if (ws) ws.destroy();
    };
  }, [audioUrl]);

  const toggle = useCallback(() => {
    if (wavesurferRef.current) wavesurferRef.current.playPause();
  }, []);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-600">
          🎤 {voiceName || "语音"}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-gray-400 tabular-nums">
            {loaded ? fmt(current * 1000) : "--:--"} / {loaded ? fmt(duration * 1000) : "--:--"}
          </span>
          {onDownload && (
            <button onClick={onDownload}
              className="rounded-lg border px-2 py-0.5 text-[10px] text-emerald-500 hover:bg-emerald-50 transition-colors"
              style={{ borderColor: "#a0d8b8" }}>
              ⬇ 下载
            </button>
          )}
        </div>
      </div>

      {/* 波形容器 */}
      <div
        ref={containerRef}
        className="rounded-xl border border-purple-200/50 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #faf5ff 0%, #f5f0fa 100%)" }}
      />

      {/* 播放按钮 */}
      {loaded && (
        <div className="flex justify-center">
          <button onClick={toggle}
            className="flex h-8 w-8 items-center justify-center rounded-full text-white shadow-sm transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg, #9b87d0 0%, #8498c8 100%)" }}>
            {playing ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
            )}
          </button>
        </div>
      )}

      {error && <p className="text-[11px] text-red-400 text-center">{error}</p>}
    </div>
  );
}
