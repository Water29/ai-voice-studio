// ============================================
// GET  /api/history — 获取历史记录列表
// POST /api/history — 保存新的历史记录
// ============================================

import { NextResponse } from "next/server";
import {
  readHistory,
  searchHistory,
  addRecord,
} from "@/lib/storage";
import type { HistoryRecord } from "@/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const debug = searchParams.get("debug");

    // 诊断模式
    if (debug) {
      const diag: any = {
        vercel: !!process.env.VERCEL,
        hasBlobToken: !!process.env.BLOB_READ_WRITE_TOKEN,
        hasDeepSeek: !!process.env.DEEPSEEK_API_KEY,
        hasElevenLabs: !!process.env.ELEVENLABS_API_KEY,
      };
      if (process.env.BLOB_READ_WRITE_TOKEN) {
        try {
          const { list } = await import("@vercel/blob");
          const all = await list();
          diag.totalBlobs = all.blobs.length;
          diag.blobNames = all.blobs.map((b: any) => b.pathname);
        } catch (e: any) {
          diag.blobError = e.message;
        }
      }
      return NextResponse.json(diag);
    }

    const records = query
      ? await searchHistory(query)
      : await readHistory();

    return NextResponse.json({ records });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "未知";
    console.error("获取历史记录错误:", msg);
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.id || !body.sourceText) {
      return NextResponse.json(
        { error: "缺少必填字段：id, sourceText" },
        { status: 400 }
      );
    }

    // 兼容新旧格式：translations数组 或 translatedText字符串
    const record = {
      id: body.id,
      sourceText: body.sourceText,
      translatedText: body.translations?.[0]?.text || body.translatedText || "",
      translationStyle: body.translations?.[0]?.style || body.translationStyle || "",
      translations: body.translations || [],
      voiceResults: body.voiceResults || [],
      audioUrl: body.voiceResults?.[0]?.audioUrl || body.audioUrl || null,
      voiceName: body.voiceResults?.[0]?.voiceName || body.voiceName || null,
      voiceId: body.voiceId || null,
      durationMs: body.voiceResults?.[0]?.durationMs || body.durationMs || null,
      costUsd: 0,
      createdAt: body.createdAt || new Date().toISOString(),
    };

    await addRecord(record);
    return NextResponse.json({ success: true, id: record.id });
  } catch (error) {
    console.error("保存历史记录错误:", error);
    return NextResponse.json(
      { error: "保存历史记录失败" },
      { status: 500 }
    );
  }
}
