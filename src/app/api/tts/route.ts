// ============================================
// POST /api/tts — ElevenLabs 语音生成接口
// ============================================

import { NextResponse } from "next/server";
import { generateSpeech } from "@/lib/elevenlabs";
import type { TTSRequest, TTSResponse } from "@/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TTSRequest;

    // 参数校验
    if (!body.text || typeof body.text !== "string") {
      return NextResponse.json(
        { error: "缺少必填参数 text" },
        { status: 400 }
      );
    }

    if (body.text.length > 5000) {
      return NextResponse.json(
        { error: "文本长度超过限制（最多 5000 字符）" },
        { status: 400 }
      );
    }

    if (!body.voiceId || typeof body.voiceId !== "string") {
      return NextResponse.json(
        { error: "缺少必填参数 voiceId" },
        { status: 400 }
      );
    }

    // 调用 ElevenLabs
    const result: TTSResponse = await generateSpeech(body.text, body.voiceId);

    return NextResponse.json(result);
  } catch (error) {
    console.error("TTS 接口错误:", error);

    const message =
      error instanceof Error ? error.message : "语音生成服务异常";

    if (message.includes("not configured")) {
      return NextResponse.json(
        { error: "语音服务未配置", detail: message },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "语音生成失败", detail: message },
      { status: 500 }
    );
  }
}
