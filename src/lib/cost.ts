// ============================================
// 成本计算工具
// 预估翻译 + TTS 的 API 调用费用
// ============================================

import type { CostBreakdown } from "@/types";

// DeepSeek 定价（$/1M tokens）
const DEEPSEEK_INPUT_PRICE = 0.27;   // 输入 $0.27/1M
const DEEPSEEK_OUTPUT_PRICE = 1.1;   // 输出 $1.10/1M

// ElevenLabs 定价（$/1000 字符）
const ELEVENLABS_CHAR_PRICE = 0.03;  // Multilingual v2: ~$0.03/1K chars

/**
 * 估算翻译费用
 */
export function estimateTranslationCost(
  inputChars: number,
  estimatedOutputChars: number
): number {
  const inputTokens = inputChars * 0.6;    // 中文：约 1 字符 = 0.6 token
  const outputTokens = estimatedOutputChars * 0.3; // 英文：约 1 字符 = 0.3 token

  const cost =
    (inputTokens / 1_000_000) * DEEPSEEK_INPUT_PRICE +
    (outputTokens / 1_000_000) * DEEPSEEK_OUTPUT_PRICE;

  return Math.round(cost * 10000) / 10000;
}

/**
 * 估算 TTS 费用
 */
export function estimateTTSCost(charCount: number): number {
  const cost = (charCount / 1000) * ELEVENLABS_CHAR_PRICE;
  return Math.round(cost * 10000) / 10000;
}

/**
 * 计算完整流程的费用明细
 */
export function calculateCosts(
  sourceChars: number,
  translatedChars: number
): CostBreakdown {
  const translationCost = estimateTranslationCost(
    sourceChars,
    translatedChars
  );
  const ttsCost = estimateTTSCost(translatedChars);

  return {
    translationCost,
    ttsCost,
    totalCost: Math.round((translationCost + ttsCost) * 10000) / 10000,
    characters: sourceChars,
  };
}

/**
 * 格式化费用显示
 */
export function formatCost(costUsd: number): string {
  if (costUsd < 0.01) {
    return "< $0.01";
  }
  return `$${costUsd.toFixed(4)}`;
}
