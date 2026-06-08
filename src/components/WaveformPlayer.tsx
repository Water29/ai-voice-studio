"use client";

import { useRef, useEffect, useState, useCallback } from "react";

interface WaveformPlayerProps {
  audioUrl: string;
  voiceName?: string;
  onDownload?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
}

function fmt(ms: number): string {
  const t = Math.floor(ms / 1000);
  return `${Math.floor(t / 60)}:${(t % 60).toString().padStart(2, "0")}`;
}

export function WaveformPlayer({ audioUrl, voiceName, onDownload, onTimeUpdate }: WaveformPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<any>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onTimeUpdateRef = useRef(onTimeUpdate);
  onTimeUpdateRef.current = onTimeUpdate;

  useEffect(() => {
    let ws: any = null;
    let dead = false;

    const init = async () => {
      try {
        const WaveSurfer = (await import("wavesurfer.js")).default;
        if (dead || !containerRef.current) return;

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
          if (dead) return;
          setDuration(ws.getDuration());
          setLoaded(true);
        });

        ws.on("audioprocess", () => {
          if (dead) return;
          const t = ws.getCurrentTime();
          setCurrent(t);
          onTimeUpdateRef.current?.(t, ws.getDuration());
        });

        ws.on("play", () => setPlaying(true));
        ws.on("pause", () => setPlaying(false));
        ws.on("finish", () => { setPlaying(false); setCurrent(0); });
        ws.on("error", () => { if (!dead) setError("波形加载失败"); });

        wsRef.current = ws;
      } catch {
        if (!dead) setError("波形组件初始化失败");
      }
    };

    init();
    return () => { dead = true; if (ws) ws.destroy(); };
  }, [audioUrl]);

  const toggle = useCallback(() => {
    if (wsRef.current) wsRef.current.playPause();
  }, []);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-600">🎤 {voiceName || "语音"}</span>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-gray-400 tabular-nums">
            {loaded ? fmt(current * 1000) : "--:--"} / {loaded ? fmt(duration * 1000) : "--:--"}
          </span>
          {onDownload && (
            <button onClick={onDownload}
              className="rounded-lg border px-2 py-0.5 text-[10px] text-emerald-500 hover:bg-emerald-50 transition-colors"
              style={{ borderColor: "#a0d8b8" }}>⬇ 下载</button>
          )}
        </div>
      </div>

      <div ref={containerRef}
        className="rounded-xl border border-purple-200/50 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #faf5ff 0%, #f5f0fa 100%)" }} />

      {loaded && (
        <div className="flex justify-center">
          <button onClick={toggle}
            className="flex h-7 w-7 items-center justify-center rounded-full text-white shadow-sm transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg, #9b87d0 0%, #8498c8 100%)" }}>
            {playing ? (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
            ) : (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
            )}
          </button>
        </div>
      )}

      {error && <p className="text-[11px] text-red-400 text-center">{error}</p>}
    </div>
  );
}
