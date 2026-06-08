// ============================================
// 存储工具 — 每条记录独立JSON文件
// Vercel Blob: history/{id}.json
// 本地:       data/history/{id}.json
// ============================================

import fs from "fs/promises";
import path from "path";
import type { HistoryRecord } from "@/types";

const MAX_RECORDS = 100;

function onVercel(): boolean { return !!process.env.VERCEL; }
function hasBlob(): boolean { return !!process.env.BLOB_READ_WRITE_TOKEN; }

function blobKey(id: string): string { return `history/${id}.json`; }

// ============================================
// 读取全部
// ============================================
export async function readHistory(): Promise<HistoryRecord[]> {
  if (onVercel() && hasBlob()) {
    try {
      const { list } = await import("@vercel/blob");
      const all = await list({ prefix: "history/" });
      if (all.blobs.length === 0) return [];
      const token = process.env.BLOB_READ_WRITE_TOKEN!;
      const records: HistoryRecord[] = [];
      for (const blob of all.blobs) {
        try {
          const res = await fetch(blob.url, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) records.push(await res.json());
        } catch { /* skip corrupt blob */ }
      }
      return records.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (e: any) {
      console.error("[storage] readHistory:", e.message);
      return [];
    }
  }

  if (onVercel()) return [];

  // 本地：扫描 data/history/ 目录
  try {
    const dir = path.join(process.cwd(), "data", "history");
    await fs.mkdir(dir, { recursive: true });
    const files = await fs.readdir(dir);
    const records: HistoryRecord[] = [];
    for (const f of files) {
      if (!f.endsWith(".json")) continue;
      try {
        const raw = await fs.readFile(path.join(dir, f), "utf-8");
        records.push(JSON.parse(raw));
      } catch { /* skip */ }
    }
    return records.sort((a: any, b: any) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (e: any) {
    console.error("[storage] local readHistory:", e.message);
    return [];
  }
}

// ============================================
// 写入（单文件，无并发问题）
// ============================================
export async function addRecord(record: HistoryRecord): Promise<void> {
  const json = JSON.stringify(record);

  if (onVercel() && hasBlob()) {
    const { put } = await import("@vercel/blob");
    await put(blobKey(record.id), json, {
      access: "private",
      allowOverwrite: true,
      contentType: "application/json",
    });
    return;
  }

  if (onVercel()) return;

  // 本地
  try {
    const dir = path.join(process.cwd(), "data", "history");
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, `${record.id}.json`), json, "utf-8");
  } catch (e: any) {
    console.error("[storage] local addRecord:", e.message);
  }
}

// ============================================
// 查询 / 删除
// ============================================
export async function getRecord(id: string): Promise<HistoryRecord | null> {
  if (onVercel() && hasBlob()) {
    try {
      const { list } = await import("@vercel/blob");
      const all = await list({ prefix: blobKey(id) });
      if (all.blobs.length === 0) return null;
      const token = process.env.BLOB_READ_WRITE_TOKEN!;
      const res = await fetch(all.blobs[0].url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      return await res.json();
    } catch { return null; }
  }

  if (onVercel()) return null;

  try {
    const file = path.join(process.cwd(), "data", "history", `${id}.json`);
    return JSON.parse(await fs.readFile(file, "utf-8"));
  } catch { return null; }
}

export async function deleteRecord(id: string): Promise<boolean> {
  if (onVercel() && hasBlob()) {
    try {
      const { list } = await import("@vercel/blob");
      const all = await list({ prefix: blobKey(id) });
      for (const b of all.blobs) {
        await (await import("@vercel/blob")).del(b.url);
      }
      return true;
    } catch (e: any) {
      console.error("[storage] deleteRecord:", e.message);
      return false;
    }
  }

  if (onVercel()) return true;

  try {
    const file = path.join(process.cwd(), "data", "history", `${id}.json`);
    await fs.unlink(file);
    return true;
  } catch { return false; }
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
