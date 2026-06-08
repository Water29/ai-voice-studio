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

    const records = query
      ? await searchHistory(query)
      : await readHistory();

    return NextResponse.json({ records });
  } catch (error) {
    console.error("获取历史记录错误:", error);
    return NextResponse.json(
      { error: "获取历史记录失败" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as HistoryRecord;

    if (!body.id || !body.sourceText || !body.translatedText) {
      return NextResponse.json(
        { error: "缺少必填字段：id, sourceText, translatedText" },
        { status: 400 }
      );
    }

    await addRecord(body);
    return NextResponse.json({ success: true, id: body.id });
  } catch (error) {
    console.error("保存历史记录错误:", error);
    return NextResponse.json(
      { error: "保存历史记录失败" },
      { status: 500 }
    );
  }
}
