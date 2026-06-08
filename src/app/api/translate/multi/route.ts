// ============================================
// POST /api/translate/multi — AI 自动生成 3 版本翻译
// ============================================

import { NextResponse } from "next/server";
import { translate } from "@/lib/deepseek";
import { analyzeTextStyle } from "@/lib/deepseek";
import type { TranslationStyle } from "@/types";

/** 风格描述映射 */
const STYLE_DESC: Record<TranslationStyle, { label: string; desc: string }> = {
  tiktok:    { label: "TikTok 风", desc: "活泼自然，适合短视频口播" },
  professional: { label: "专业商务", desc: "正式流畅，适合企业场景" },
  casual:    { label: "轻松日常", desc: "亲切随和，适合生活分享" },
  sales:     { label: "美式带货", desc: "高能量促销，适合产品推荐" },
};

/** AI 分析结果 → TranslationStyle 映射 */
const AI_STYLE_MAP: Record<string, TranslationStyle> = {
  advertisement: "sales",
  storytelling: "tiktok",
  tutorial: "professional",
  news: "professional",
  casual_vlog: "casual",
};

/**
 * 根据 AI 分析结果选出3种风格：
 * 1个主推荐 + 2个补充
 */
function pickStyles(analyzed: string): TranslationStyle[] {
  const all: TranslationStyle[] = ["tiktok", "professional", "casual", "sales"];
  const primary = AI_STYLE_MAP[analyzed] || "tiktok";
  const rest = all.filter(s => s !== primary);
  return [primary, rest[0], rest[1]];
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.text || typeof body.text !== "string") {
      return NextResponse.json({ error: "缺少参数 text" }, { status: 400 });
    }

    // AI 分析文本风格
    let bestStyle = "tiktok";
    try {
      const analysis = await analyzeTextStyle(body.text);
      bestStyle = analysis.style || "tiktok";
    } catch { /* 降级 */ }

    // 选出3种风格
    const styles = pickStyles(bestStyle);

    // 并行翻译
    const results = await Promise.allSettled(
      styles.map(s => translate(body.text, s))
    );

    // 组装响应
    const translations = results.map((r, i) => {
      const style = styles[i];
      const info = STYLE_DESC[style];
      if (r.status === "fulfilled") {
        return { ...r.value, description: info.desc, label: info.label };
      }
      return {
        translatedText: "", style, tokensUsed: 0, costUsd: 0,
        description: info.desc, label: info.label, _error: "翻译失败",
      };
    });

    // 自动保存历史
    const recordId = `rec_${Date.now()}_${Math.random().toString(36).substr(2,6)}`;
    try {
      const { addRecord } = await import("@/lib/storage");
      await addRecord({
        id: recordId,
        sourceText: body.text,
        translatedText: translations[0]?.translatedText || "",
        translationStyle: translations[0]?.style || "",
        translations: translations.filter((t: any) => t.translatedText).map((t: any) => ({
          text: t.translatedText, style: t.style, label: t.label,
        })),
        voiceResults: [],
        audioUrl: null, voiceName: null, voiceId: null,
        durationMs: null, costUsd: 0,
        createdAt: new Date().toISOString(),
      } as any);
    } catch { /* 历史保存失败不影响翻译 */ }

    return NextResponse.json({ translations, analyzedStyle: bestStyle, recordId });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "未知错误";
    console.error("多版本翻译错误:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
