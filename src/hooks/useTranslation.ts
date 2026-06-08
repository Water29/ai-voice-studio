// ============================================
// useTranslation — 翻译逻辑 Hook
// ============================================

"use client";

import { useState, useCallback } from "react";
import type {
  TranslateResponse,
  TranslationStyle,
  APIError,
} from "@/types";

interface UseTranslationReturn {
  translatedText: string;
  style: TranslationStyle;
  isTranslating: boolean;
  error: string | null;
  tokensUsed: number;
  costUsd: number;
  translate: (text: string, style?: TranslationStyle) => Promise<TranslateResponse | null>;
  setStyle: (style: TranslationStyle) => void;
  reset: () => void;
}

export function useTranslation(): UseTranslationReturn {
  const [translatedText, setTranslatedText] = useState("");
  const [style, setStyle] = useState<TranslationStyle>("tiktok");
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokensUsed, setTokensUsed] = useState(0);
  const [costUsd, setCostUsd] = useState(0);

  const translate = useCallback(
    async (
      text: string,
      translationStyle?: TranslationStyle
    ): Promise<TranslateResponse | null> => {
      if (!text.trim()) {
        setError("请输入中文文本");
        return null;
      }

      setIsTranslating(true);
      setError(null);

      try {
        const response = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            style: translationStyle ?? style,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          const err = data as APIError;
          setError(err.detail ?? err.error ?? "翻译失败");
          return null;
        }

        const result = data as TranslateResponse;
        setTranslatedText(result.translatedText);
        setTokensUsed(result.tokensUsed);
        setCostUsd(result.costUsd);
        return result;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "网络错误，请重试";
        setError(message);
        return null;
      } finally {
        setIsTranslating(false);
      }
    },
    [style]
  );

  const reset = useCallback(() => {
    setTranslatedText("");
    setError(null);
    setTokensUsed(0);
    setCostUsd(0);
  }, []);

  return {
    translatedText,
    style,
    isTranslating,
    error,
    tokensUsed,
    costUsd,
    translate,
    setStyle,
    reset,
  };
}
