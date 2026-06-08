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

    // 更新历史记录 — 始终保存，不管成功或失败
    let histSaved = false;
    let histError = "";
    const rid = body.recordId || `rec_${Date.now()}_${Math.random().toString(36).substr(2,6)}`;
    const allVoiceResults = results.map((r: any) => ({
      voiceName: r.voiceName, audioUrl: r.audioUrl || "",
      durationMs: r.durationMs || 0,
      _error: r._error || (r.audioUrl ? undefined : "生成失败"),
      forText: body.text,
    }));

    try {
      const { addRecord } = await import("@/lib/storage");
      await addRecord({
        id: rid,
        sourceText: body.sourceText || "",
        translatedText: body.translations?.[0]?.text || body.text || "",
        translationStyle: body.translations?.[0]?.style || "",
        translations: body.translations || [{ text: body.text || "", style: "", label: "" }],
        voiceResults: allVoiceResults,
        audioUrl: allVoiceResults.find((r: any) => r.audioUrl)?.audioUrl || null,
        voiceName: allVoiceResults.find((r: any) => r.audioUrl)?.voiceName || null,
        voiceId: null,
        durationMs: allVoiceResults.find((r: any) => r.audioUrl)?.durationMs || null,
        costUsd: 0,
        createdAt: body.createdAt || new Date().toISOString(),
      } as any);
      histSaved = true;
    } catch (e: any) {
      histError = e.message;
    }

    return NextResponse.json({ results, _hist: { saved: histSaved, error: histError, recordId: rid } });
  } catch (error) {
    console.error("多音色生成错误:", error);
    const message = error instanceof Error ? error.message : "语音生成异常";
    return NextResponse.json(
      { error: "语音生成失败", detail: message },
      { status: 500 }
    );
  }
}
