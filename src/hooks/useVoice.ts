// ============================================
// useVoice — 语音生成 Hook
// ============================================

"use client";

import { useState, useCallback } from "react";
import type { TTSResponse, Voice, APIError } from "@/types";

interface UseVoiceReturn {
  audioUrl: string | null;
  voiceName: string | null;
  durationMs: number | null;
  isGenerating: boolean;
  error: string | null;
  voices: Voice[];
  selectedVoice: Voice | null;
  generate: (text: string, voiceId: string) => Promise<TTSResponse | null>;
  selectVoice: (voice: Voice) => void;
  loadVoices: () => Promise<void>;
  reset: () => void;
}

export function useVoice(): UseVoiceReturn {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [voiceName, setVoiceName] = useState<string | null>(null);
  const [durationMs, setDurationMs] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null);

  const loadVoices = useCallback(async () => {
    try {
      const response = await fetch("/api/voices");
      const data = await response.json();

      if (response.ok && data.voices) {
        const voiceList = data.voices as Voice[];
        setVoices(voiceList);
        // 默认选中第一个
        if (voiceList.length > 0 && !selectedVoice) {
          setSelectedVoice(voiceList[0]);
        }
      }
    } catch {
      // 加载音色失败不影响主流程
      console.warn("加载音色列表失败");
    }
  }, [selectedVoice]);

  const generate = useCallback(
    async (text: string, voiceId: string): Promise<TTSResponse | null> => {
      if (!text.trim()) {
        setError("请输入英文文本");
        return null;
      }

      setIsGenerating(true);
      setError(null);

      try {
        const response = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, voiceId }),
        });

        const data = await response.json();

        if (!response.ok) {
          const err = data as APIError;
          setError(err.detail ?? err.error ?? "语音生成失败");
          return null;
        }

        const result = data as TTSResponse;

        // 处理带 _error 标记的失败结果（多音色并发场景）
        if ("_error" in result && result._error) {
          setError(
            `音色 ${result.voiceName} 生成失败: ${result._error}`
          );
          return null;
        }

        setAudioUrl(result.audioUrl);
        setVoiceName(result.voiceName);
        setDurationMs(result.durationMs);
        return result;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "网络错误，请重试";
        setError(message);
        return null;
      } finally {
        setIsGenerating(false);
      }
    },
    []
  );

  const selectVoice = useCallback((voice: Voice) => {
    setSelectedVoice(voice);
  }, []);

  const reset = useCallback(() => {
    setAudioUrl(null);
    setVoiceName(null);
    setDurationMs(null);
    setError(null);
  }, []);

  return {
    audioUrl,
    voiceName,
    durationMs,
    isGenerating,
    error,
    voices,
    selectedVoice,
    generate,
    selectVoice,
    loadVoices,
    reset,
  };
}
