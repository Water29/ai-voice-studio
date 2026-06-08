// ============================================
// GET /api/debug — 诊断 Blob 连接
// ============================================

import { NextResponse } from "next/server";

export async function GET() {
  const result: any = {
    ts: new Date().toISOString(),
    vercel: !!process.env.VERCEL,
    hasToken: !!process.env.BLOB_READ_WRITE_TOKEN,
    hasStoreId: !!process.env.BLOB_STORE_ID,
    tokenPrefix: process.env.BLOB_READ_WRITE_TOKEN?.substring(0, 20) || "N/A",
  };

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { list } = await import("@vercel/blob");
      // 不带 prefix 列出所有 blob
      const all = await list();
      result.totalBlobs = all.blobs.length;
      result.blobs = all.blobs.map((b) => ({
        pathname: b.pathname,
        url: b.url?.substring(0, 80),
        hasDownloadUrl: !!b.downloadUrl,
      }));

      // 尝试读取 history blob
      const hist = await list({ prefix: "history/data.json" });
      result.historyBlobs = hist.blobs.length;
      if (hist.blobs.length > 0) {
        const blob = hist.blobs[0];
        result.historyBlob = {
          pathname: blob.pathname,
          url: blob.url?.substring(0, 80),
          hasDownloadUrl: !!blob.downloadUrl,
        };
        // 尝试 fetch downloadUrl
        try {
          const res = await fetch(blob.downloadUrl);
          result.downloadTest = { status: res.status, ok: res.ok };
          if (res.ok) {
            const text = await res.text();
            result.downloadPreview = text.substring(0, 200);
          }
        } catch (e: any) {
          result.downloadError = e.message;
        }
      }
    } catch (e: any) {
      result.error = e.message;
      result.errorStack = e.stack?.substring(0, 300);
    }
  }

  return NextResponse.json(result);
}
