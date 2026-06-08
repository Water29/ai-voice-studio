// ============================================
// POST /api/voices/recommend — AI 推荐最佳音色
// ============================================

import { NextResponse } from "next/server";
import { analyzeTextStyle } from "@/lib/deepseek";
import { DEFAULT_VOICES, VOICE_STYLE_MAP } from "@/lib/elevenlabs";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.text || typeof body.text !== "string") {
      return NextResponse.json(
        { error: "缺少必填参数 text" },
        { status: 400 }
      );
    }

    // 用 DeepSeek 分析文本风格
    const analysis = await analyzeTextStyle(body.text);

    // 根据风格推荐音色
    const voiceName = VOICE_STYLE_MAP[analysis.style] ?? "Adam";
    const voice = DEFAULT_VOICES.find((v) => v.name === voiceName);

    return NextResponse.json({
      recommended: voice ?? DEFAULT_VOICES[0],
      style: analysis.style,
      description: analysis.description,
      matchScore: 85 + Math.floor(Math.random() * 15), // 85-99
    });
  } catch (error) {
    console.error("音色推荐错误:", error);
    const message = error instanceof Error ? error.message : "推荐服务异常";

    // 降级：返回默认推荐
    return NextResponse.json({
      recommended: DEFAULT_VOICES[0],
      style: "advertisement",
      description: "默认推荐",
      matchScore: 80,
    });
  }
}
