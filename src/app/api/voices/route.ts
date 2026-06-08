// ============================================
// GET /api/voices — 获取可用音色列表
// ============================================

import { NextResponse } from "next/server";
import { getVoices } from "@/lib/elevenlabs";

export async function GET() {
  try {
    const voices = getVoices();
    return NextResponse.json({ voices });
  } catch (error) {
    console.error("获取音色列表错误:", error);
    return NextResponse.json(
      { error: "获取音色列表失败" },
      { status: 500 }
    );
  }
}
