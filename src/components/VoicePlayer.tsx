"use client";

// ============================================
// VoicePlayer — 音频播放器组件
// ============================================

import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";

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

  // 切换音频时重置
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
      audio.play().catch((e) => {
        setError(`播放失败: ${e.message}`);
      });
    }
  }, [isPlaying]);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setAudioDuration(audioRef.current.duration);
    }
  }, []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
  }, []);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  if (!audioUrl) {
    return null;
  }

  const displayDuration = audioDuration || (durationMs ? durationMs / 1000 : 0);
  const progress = displayDuration > 0 ? currentTime / displayDuration : 0;

  return (
    <div className="rounded-xl border border-gray-100 bg-purple-50/30 p-4 space-y-3">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-700">
            🎤 {voiceName || "英文语音"}
          </p>
          <p className="text-xs text-gray-400">
            {displayDuration > 0
              ? `时长 ${formatDuration(displayDuration * 1000)}`
              : "加载中..."}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onDownload}
          className="h-7 text-xs rounded-lg border-gray-200 text-gray-500 hover:text-purple-600 hover:border-purple-300 hover:bg-purple-50"
        >
          ⬇ 下载
        </Button>
      </div>

      {/* 播放控制 */}
      <div className="flex items-center gap-3">
        {/* 播放按钮 */}
        <button
          onClick={togglePlay}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-500 text-white hover:bg-purple-600 transition-colors shadow-sm"
        >
          {isPlaying ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
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
            className="w-full h-1.5 rounded-full appearance-none bg-gray-200 cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:h-3.5
              [&::-webkit-slider-thumb]:w-3.5
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-purple-500
              [&::-webkit-slider-thumb]:cursor-pointer
              [&::-webkit-slider-thumb]:shadow-sm"
            style={{
              background: `linear-gradient(to right, #a855f7 ${progress * 100}%, #e5e7eb ${progress * 100}%)`,
            }}
          />
        </div>

        {/* 时间 */}
        <span className="text-xs text-gray-400 min-w-[80px] text-right tabular-nums">
          {formatDuration(currentTime * 1000)} /{" "}
          {displayDuration > 0
            ? formatDuration(displayDuration * 1000)
            : "--:--"}
        </span>
      </div>

      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        preload="auto"
      />

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
