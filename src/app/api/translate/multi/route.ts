// ============================================
// POST /api/translate/multi — 多版本翻译
// ============================================

import { NextResponse } from "next/server";
import { translate } from "@/lib/deepseek";
import type { TranslationStyle } from "@/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.text || typeof body.text !== "string") {
      return NextResponse.json(
        { error: "缺少必填参数 text" },
        { status: 400 }
      );
    }

    // 并行翻译多个风格
    const styles: TranslationStyle[] = body.styles ?? ["tiktok", "professional", "casual", "sales"];
    const results = await Promise.allSettled(
      styles.map((style) => translate(body.text, style))
    );

    const translations = results.map((r, i) => {
      if (r.status === "fulfilled") return r.value;
      return { translatedText: "", style: styles[i], tokensUsed: 0, costUsd: 0, _error: "翻译失败" };
    });

    return NextResponse.json({ translations });
  } catch (error) {
    console.error("多版本翻译错误:", error);
    return NextResponse.json(
      { error: "翻译失败" },
      { status: 500 }
    );
  }
}
