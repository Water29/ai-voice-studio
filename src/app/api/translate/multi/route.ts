// ============================================
// POST /api/translate/multi — AI 自动生成 3 版本翻译
// AI 自动判断文本适合的风格，生成3个版本
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

/** 根据 AI 分析结果选择最佳3种风格 */
function pickStyles(analyzedStyle: string): TranslationStyle[] {
  // 总是包含 tiktok（基础风格），然后根据分析选择另外2个
  const all: TranslationStyle[] = ["tiktok", "professional", "casual", "sales"];
  // 把分析出的风格排在最前面，然后补充其他
  const ordered = all.filter(s => s !== analyzedStyle);
  const primary = (analyzedStyle as TranslationStyle) || "tiktok";
  return [primary, ordered[0], ordered[1]];
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.text || typeof body.text !== "string") {
      return NextResponse.json({ error: "缺少参数 text" }, { status: 400 });
    }

    // Step 1: AI 分析文本适合什么风格
    let bestStyle = "tiktok";
    try {
      const analysis = await analyzeTextStyle(body.text);
      bestStyle = analysis.style || "tiktok";
    } catch { /* 降级使用 tiktok */ }

    // Step 2: 选出3种最合适的风格
    const styles = pickStyles(bestStyle);

    // Step 3: 并行翻译
    const results = await Promise.allSettled(
      styles.map(s => translate(body.text, s))
    );

    // Step 4: 组装响应
    const translations = results.map((r, i) => {
      const style = styles[i];
      const info = STYLE_DESC[style];
      if (r.status === "fulfilled") {
        return { ...r.value, description: info.desc, label: info.label };
      }
      return {
        translatedText: "", style, tokensUsed: 0, costUsd: 0,
        description: info.desc, label: info.label,
        _error: "翻译失败",
      };
    });

    return NextResponse.json({
      translations,
      analyzedStyle: bestStyle,
    });
  } catch (error) {
    console.error("多版本翻译错误:", error);
    return NextResponse.json({ error: "翻译失败" }, { status: 500 });
  }
}
