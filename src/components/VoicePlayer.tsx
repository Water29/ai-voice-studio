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

/**
 * 格式化毫秒为 mm:ss
 */
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

  // 重置播放状态
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

  // 如果没有音频，不渲染
  if (!audioUrl) {
    return null;
  }

  const displayDuration = audioDuration || (durationMs ? durationMs / 1000 : 0);
  const progress = displayDuration > 0 ? currentTime / displayDuration : 0;

  return (
    <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/30 p-4 space-y-3">
      {/* 头部信息 */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-200">
            {voiceName ? `${voiceName}` : "英文语音"}
          </p>
          <p className="text-xs text-zinc-500">
            {displayDuration > 0
              ? `时长 ${formatDuration(displayDuration * 1000)}`
              : "加载中..."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onDownload}
            className="h-7 text-xs rounded-lg border-zinc-600 text-zinc-300 hover:text-zinc-100"
          >
            下载
          </Button>
        </div>
      </div>

      {/* 播放控制 */}
      <div className="flex items-center gap-3">
        {/* 播放/暂停按钮 */}
        <button
          onClick={togglePlay}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
        >
          {isPlaying ? (
            // 暂停图标
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            // 播放图标
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
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
            className="w-full h-1.5 rounded-full appearance-none bg-zinc-600 cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:h-3.5
              [&::-webkit-slider-thumb]:w-3.5
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-blue-500
              [&::-webkit-slider-thumb]:cursor-pointer
              [&::-webkit-slider-thumb]:shadow-md"
            style={{
              background: `linear-gradient(to right, #3b82f6 ${progress * 100}%, #52525b ${progress * 100}%)`,
            }}
          />
        </div>

        {/* 时间显示 */}
        <span className="text-xs text-zinc-500 min-w-[80px] text-right tabular-nums">
          {formatDuration(currentTime * 1000)} /{" "}
          {displayDuration > 0
            ? formatDuration(displayDuration * 1000)
            : "--:--"}
        </span>
      </div>

      {/* 隐藏的 audio 元素 */}
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

      {/* 错误提示 */}
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
