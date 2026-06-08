// ============================================
// 存储工具 — Vercel Blob（生产）+ 本地 JSON（开发）
// ============================================

import type { HistoryData, HistoryRecord } from "@/types";

const MAX_RECORDS = 100;
const BLOB_KEY = "history/data.json";

/** 判断是否在 Vercel 环境 */
function isVercel(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

/** 生成本地文件路径 */
function localPath(): string {
  const path = require("path");
  return path.join(process.cwd(), "data", "history.json");
}

/** 确保本地数据文件存在 */
async function ensureLocalFile(): Promise<void> {
  const fs = require("fs/promises");
  const path = require("path");
  const dir = path.join(process.cwd(), "data");
  await fs.mkdir(dir, { recursive: true });
  try { await fs.access(localPath()); } catch {
    await fs.writeFile(localPath(), JSON.stringify({ records: [] }), "utf-8");
  }
}

// ============================================
// 读取
// ============================================
export async function readHistory(): Promise<HistoryRecord[]> {
  if (isVercel()) {
    const { list } = await import("@vercel/blob");
    const { blobs } = await list({ prefix: BLOB_KEY });
    if (blobs.length === 0) return [];
    const res = await fetch(blobs[0].url);
    const data: HistoryData = await res.json();
    return data.records;
  }
  // 本地
  await ensureLocalFile();
  const fs = require("fs/promises");
  const raw = await fs.readFile(localPath(), "utf-8");
  return (JSON.parse(raw) as HistoryData).records;
}

// ============================================
// 写入（upsert）
// ============================================
export async function addRecord(record: HistoryRecord): Promise<void> {
  const records = await readHistory();
  const existingIdx = records.findIndex((r) => r.id === record.id);
  if (existingIdx >= 0) {
    records[existingIdx] = record;
  } else {
    records.unshift(record);
  }
  while (records.length > MAX_RECORDS) records.pop();

  const data: HistoryData = { records };

  if (isVercel()) {
    const { put, list } = await import("@vercel/blob");
    // 删除旧 blob
    const { blobs } = await list({ prefix: BLOB_KEY });
    for (const b of blobs) await (await import("@vercel/blob")).del(b.url);
    // 写入新 blob
    await put(BLOB_KEY, JSON.stringify(data, null, 2), {
      access: "public",
      contentType: "application/json",
    });
  } else {
    const fs = require("fs/promises");
    await fs.writeFile(localPath(), JSON.stringify(data, null, 2), "utf-8");
  }
}

// ============================================
// 查询
// ============================================
export async function getRecord(id: string): Promise<HistoryRecord | null> {
  const records = await readHistory();
  return records.find((r) => r.id === id) ?? null;
}

export async function deleteRecord(id: string): Promise<boolean> {
  const records = await readHistory();
  const idx = records.findIndex((r) => r.id === id);
  if (idx === -1) return false;
  records.splice(idx, 1);
  const data: HistoryData = { records };

  if (isVercel()) {
    const { put, list } = await import("@vercel/blob");
    const { blobs } = await list({ prefix: BLOB_KEY });
    for (const b of blobs) await (await import("@vercel/blob")).del(b.url);
    await put(BLOB_KEY, JSON.stringify(data, null, 2), {
      access: "public",
      contentType: "application/json",
    });
  } else {
    const fs = require("fs/promises");
    await fs.writeFile(localPath(), JSON.stringify(data, null, 2), "utf-8");
  }
  return true;
}

export async function searchHistory(query: string): Promise<HistoryRecord[]> {
  const records = await readHistory();
  const lower = query.toLowerCase();
  return records.filter(
    (r) =>
      r.sourceText.toLowerCase().includes(lower) ||
      r.translatedText.toLowerCase().includes(lower)
  );
}

export function generateId(): string {
  return `rec_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}
