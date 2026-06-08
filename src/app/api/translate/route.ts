// ============================================
// POST /api/translate — DeepSeek 翻译接口
// ============================================

import { NextResponse } from "next/server";
import { translate } from "@/lib/deepseek";
import { calculateCosts } from "@/lib/cost";
import type { TranslateRequest, TranslateResponse } from "@/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TranslateRequest;

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

    const style = body.style ?? "tiktok";
    const validStyles = ["tiktok", "professional", "casual", "sales"];

    if (!validStyles.includes(style)) {
      return NextResponse.json(
        { error: `无效的翻译风格，可选值：${validStyles.join(", ")}` },
        { status: 400 }
      );
    }

    // 调用 DeepSeek
    const result: TranslateResponse = await translate(body.text, style);

    return NextResponse.json(result);
  } catch (error) {
    console.error("翻译接口错误:", error);

    const message =
      error instanceof Error ? error.message : "翻译服务异常";

    // 判断是否为配置错误
    if (message.includes("not configured")) {
      return NextResponse.json(
        { error: "翻译服务未配置", detail: message },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "翻译失败", detail: message },
      { status: 500 }
    );
  }
}
