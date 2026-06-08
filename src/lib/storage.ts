// ============================================
// 存储工具 — 每条记录独立JSON文件
// Vercel Blob: history/{id}.json
// 本地:       data/history/{id}.json
// ============================================

import type { HistoryRecord } from "@/types";

function onVercel(): boolean { return !!process.env.VERCEL; }
function hasBlob(): boolean { return !!process.env.BLOB_READ_WRITE_TOKEN; }
function blobKey(id: string): string { return `history/${id}.json`; }

// Node.js built-ins — 仅服务端，Vercel编译时处理
let fs: any = null;
let path: any = null;
async function getFS() {
  if (!fs) { fs = await import("fs/promises"); path = await import("path"); }
  return { fs, path };
}

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
        } catch { /* skip corrupt */ }
      }
      return records.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (e: any) {
      console.error("[storage] readHistory blob:", e.message);
      return [];
    }
  }

  if (onVercel()) return [];

  // 本地
  try {
    const { fs: f, path: p } = await getFS();
    const dir = p.join(process.cwd(), "data", "history");
    await f.mkdir(dir, { recursive: true });
    const files = await f.readdir(dir);
    const records: HistoryRecord[] = [];
    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      try {
        const raw = await f.readFile(p.join(dir, file), "utf-8");
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
    try {
      const { put } = await import("@vercel/blob");
      await put(blobKey(record.id), json, {
        access: "private",
        allowOverwrite: true,
        contentType: "application/json",
      });
      console.log(`[storage] blob saved: ${blobKey(record.id)}`);
    } catch (e: any) {
      console.error(`[storage] blob addRecord failed: ${e.message}`);
      throw e; // 抛出让调用方感知
    }
    return;
  }

  if (onVercel()) return;

  // 本地
  try {
    const { fs: f, path: p } = await getFS();
    const dir = p.join(process.cwd(), "data", "history");
    await f.mkdir(dir, { recursive: true });
    await f.writeFile(p.join(dir, `${record.id}.json`), json, "utf-8");
  } catch (e: any) {
    console.error("[storage] local addRecord:", e.message);
    throw e;
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
      const res = await fetch(all.blobs[0].url, {
        headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN!}` },
      });
      return res.ok ? await res.json() : null;
    } catch { return null; }
  }

  if (onVercel()) return null;

  try {
    const { fs: f, path: p } = await getFS();
    const file = p.join(process.cwd(), "data", "history", `${id}.json`);
    return JSON.parse(await f.readFile(file, "utf-8"));
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
    } catch (e: any) { console.error("[storage] deleteRecord:", e.message); return false; }
  }

  if (onVercel()) return true;

  try {
    const { fs: f, path: p } = await getFS();
    await f.unlink(p.join(process.cwd(), "data", "history", `${id}.json`));
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
