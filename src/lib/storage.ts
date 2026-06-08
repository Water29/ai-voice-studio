// ============================================
// 存储工具 — Vercel Blob / 本地 JSON 双模式
// ============================================

import type { HistoryData, HistoryRecord } from "@/types";

const MAX_RECORDS = 100;
const BLOB_KEY = "history/data.json";

/** 是否在 Vercel Serverless 环境（不管有没有连 Blob） */
function onVercel(): boolean {
  return !!process.env.VERCEL;
}

/** 是否已连接 Vercel Blob */
function hasBlob(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

// ============================================
// 读取
// ============================================
export async function readHistory(): Promise<HistoryRecord[]> {
  // Vercel + 有 Blob → 从 Blob 读
  if (onVercel() && hasBlob()) {
    const { list } = await import("@vercel/blob");
    const { blobs } = await list({ prefix: BLOB_KEY });
    if (blobs.length === 0) {
      // 诊断：检查是否完全没有 blob
      const all = await list();
      console.warn(`[storage] 未找到 prefix=${BLOB_KEY}，共 ${all.blobs.length} 个 blob`);
      return [];
    }
    const res = await fetch(blobs[0].url, {
      headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
    });
    if (!res.ok) {
      console.error(`[storage] Blob fetch 失败: ${res.status} ${res.statusText}`);
      return [];
    }
    const data: HistoryData = await res.json();
    return data.records;
  }

  // Vercel + 无 Blob → 返回空（不尝试写本地文件）
  if (onVercel()) {
    return [];
  }

  // 本地开发
  try {
    const fs = require("fs/promises");
    const path = require("path");
    const file = path.join(process.cwd(), "data", "history.json");
    const dir = path.dirname(file);
    await fs.mkdir(dir, { recursive: true });
    try { await fs.access(file); } catch {
      await fs.writeFile(file, JSON.stringify({ records: [] }), "utf-8");
    }
    const raw = await fs.readFile(file, "utf-8");
    return (JSON.parse(raw) as HistoryData).records;
  } catch (e) {
    console.error("本地读取历史失败:", e);
    return [];
  }
}

// ============================================
// 写入（upsert）
// ============================================
export async function addRecord(record: HistoryRecord): Promise<void> {
  const records = await readHistory();
  const existingIdx = records.findIndex((r) => r.id === record.id);
  if (existingIdx >= 0) records[existingIdx] = record;
  else records.unshift(record);
  while (records.length > MAX_RECORDS) records.pop();

  const data: HistoryData = { records };

  // Vercel + Blob
  if (onVercel() && hasBlob()) {
    const { put, list } = await import("@vercel/blob");
    // 清理旧 blob
    try {
      const { blobs } = await list({ prefix: BLOB_KEY });
      for (const b of blobs) {
        await (await import("@vercel/blob")).del(b.url);
      }
    } catch { /* 清理失败不影响写入 */ }
    await put(BLOB_KEY, JSON.stringify(data), {
      access: "private",
      allowOverwrite: true,
      contentType: "application/json",
    });
    return;
  }

  // Vercel 无 Blob → 不写
  if (onVercel()) return;

  // 本地
  try {
    const fs = require("fs/promises");
    const path = require("path");
    const file = path.join(process.cwd(), "data", "history.json");
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error("本地写入历史失败:", e);
  }
}

// ============================================
// 查询 / 删除
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

  if (onVercel() && hasBlob()) {
    const { put, list } = await import("@vercel/blob");
    try {
      const { blobs } = await list({ prefix: BLOB_KEY });
      for (const b of blobs) await (await import("@vercel/blob")).del(b.url);
    } catch { /* ignore */ }
    await put(BLOB_KEY, JSON.stringify(data), {
      access: "private",
      allowOverwrite: true,
      contentType: "application/json",
    });
    return true;
  }

  if (onVercel()) return true; // 无 Blob 时假装成功

  try {
    const fs = require("fs/promises");
    const path = require("path");
    const file = path.join(process.cwd(), "data", "history.json");
    await fs.writeFile(file, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error("本地删除历史失败:", e);
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
