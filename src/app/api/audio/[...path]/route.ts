// ============================================
// GET /api/audio/[...path] — 音频代理（私有 Blob）
// 服务端读取 Vercel Blob → 流式返回给客户端
// ============================================

import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const blobPath = `audio/${path.join("/")}`;

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      // Vercel Blob 环境：通过 SDK 获取并流式返回
      const { list } = await import("@vercel/blob");
      const { blobs } = await list({ prefix: blobPath });
      if (blobs.length === 0) {
        return new NextResponse("Audio not found", { status: 404 });
      }

      const response = await fetch(blobs[0].url, {
        headers: {
          Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
        },
      });

      if (!response.ok) {
        return new NextResponse("Failed to fetch audio", { status: 500 });
      }

      const buffer = await response.arrayBuffer();
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Cache-Control": "public, max-age=86400",
        },
      });
    }

    // 本地开发：直接返回 public/audio/ 下的文件
    const fs = await import("fs/promises");
    const pathMod = await import("path");
    const filePath = pathMod.join(process.cwd(), "public", blobPath);
    try {
      const buffer = await fs.readFile(filePath);
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Cache-Control": "public, max-age=86400",
        },
      });
    } catch {
      return new NextResponse("Audio file not found", { status: 404 });
    }
  } catch (error) {
    console.error("音频代理错误:", error);
    return new NextResponse("Audio proxy error", { status: 500 });
  }
}
