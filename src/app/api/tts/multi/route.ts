// ============================================
// POST /api/tts/multi — 多音色并发生成
// ============================================

import { NextResponse } from "next/server";
import { generateMultiSpeech } from "@/lib/elevenlabs";
import type { TTSRequest } from "@/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.text || !Array.isArray(body.voiceIds) || body.voiceIds.length === 0) {
      return NextResponse.json(
        { error: "缺少必填参数 text 和 voiceIds" },
        { status: 400 }
      );
    }

    if (body.voiceIds.length > 6) {
      return NextResponse.json(
        { error: "最多同时生成 6 个音色" },
        { status: 400 }
      );
    }

    const results = await generateMultiSpeech(body.text, body.voiceIds);

    // 更新历史记录（如果提供了 recordId + translations）
    let histSaved = false;
    let histError = "";
    if (body.recordId && body.translations && body.sourceText) {
      try {
        const { addRecord } = await import("@/lib/storage");
        const newResults = results.map((r: any) => ({
          voiceName: r.voiceName, audioUrl: r.audioUrl,
          durationMs: r.durationMs, _error: r._error || undefined,
          forText: body.text,
        }));
        await addRecord({
          id: body.recordId,
          sourceText: body.sourceText,
          translatedText: body.translations[0]?.text || "",
          translationStyle: body.translations[0]?.style || "",
          translations: body.translations,
          voiceResults: newResults,
          audioUrl: null, voiceName: null, voiceId: null,
          durationMs: null, costUsd: 0,
          createdAt: body.createdAt || new Date().toISOString(),
        } as any);
        histSaved = true;
      } catch (e: any) {
        histError = e.message;
      }
    } else {
      histError = `缺少数据: recordId=${!!body.recordId} translations=${!!body.translations} sourceText=${!!body.sourceText}`;
    }

    return NextResponse.json({ results, _hist: { saved: histSaved, error: histError } });
  } catch (error) {
    console.error("多音色生成错误:", error);
    const message = error instanceof Error ? error.message : "语音生成异常";
    return NextResponse.json(
      { error: "语音生成失败", detail: message },
      { status: 500 }
    );
  }
}
