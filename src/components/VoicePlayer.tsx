"use client";

// ============================================
// VoicePlayer — 音频播放器组件
// ============================================

import { useRef, useState, useEffect, useCallback } from "react";

interface VoicePlayerProps {
  audioUrl: string | null;
  voiceName?: string | null;
  durationMs?: number | null;
  onDownload?: () => void;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function VoicePlayer({
  audioUrl,
  voiceName,
  durationMs,
  onDownload,
}: VoicePlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setAudioDuration(0);
    setError(null);
  }, [audioUrl]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch((e) => setError(`播放失败: ${e.message}`));
    }
  }, [isPlaying]);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  if (!audioUrl) return null;

  const displayDuration = audioDuration || (durationMs ? durationMs / 1000 : 0);
  const progress = displayDuration > 0 ? currentTime / displayDuration : 0;

  return (
    <div className="space-y-2.5">
      {/* 顶部信息栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-600">
            🎤 {voiceName || "语音"}
          </span>
          <span className="text-[11px] text-gray-400">
            {displayDuration > 0 && formatDuration(displayDuration * 1000)}
          </span>
        </div>
        <button
          onClick={onDownload}
          className="rounded-lg border border-purple-200 px-2.5 py-1 text-[11px] text-purple-500 hover:bg-gradient-to-r hover:from-purple-50 hover:to-violet-50 hover:border-purple-300 transition-all"
        >
          ⬇ 下载 MP3
        </button>
      </div>

      {/* 播放控制条 */}
      <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-purple-50/50 to-violet-50/50 border border-purple-100/60 px-3 py-2.5">
        {/* 播放按钮 */}
        <button
          onClick={togglePlay}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-md shadow-purple-200 transition-all hover:scale-105"
        >
          {isPlaying ? (
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

        {/* 进度条 */}
        <div className="flex-1">
          <input
            type="range"
            min={0}
            max={displayDuration || 0}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:h-3.5
              [&::-webkit-slider-thumb]:w-3.5
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:shadow-md
              [&::-webkit-slider-thumb]:cursor-pointer"
            style={{
              background: `linear-gradient(to right, #a855f7 ${progress * 100}%, #e9d5ff ${progress * 100}%)`,
            }}
          />
        </div>

        {/* 时间 */}
        <span className="text-[11px] text-gray-400 min-w-[72px] text-right tabular-nums">
          {formatDuration(currentTime * 1000)} /{" "}
          {displayDuration > 0
            ? formatDuration(displayDuration * 1000)
            : "--:--"}
        </span>
      </div>

      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={() => {
          if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) setAudioDuration(audioRef.current.duration);
        }}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        preload="auto"
      />

      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  );
}
