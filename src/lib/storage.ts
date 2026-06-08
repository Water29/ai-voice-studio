// ============================================
// JSON 文件存储工具
// 替代数据库，用本地 JSON 文件持久化历史记录
// ============================================

import fs from "fs/promises";
import path from "path";
import type { HistoryData, HistoryRecord } from "@/types";

const DATA_DIR = path.join(process.cwd(), "data");
const HISTORY_FILE = path.join(DATA_DIR, "history.json");
const MAX_RECORDS = 100; // 最多保留 100 条记录

/**
 * 初始化数据文件（如果不存在则创建）
 */
async function ensureDataFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(HISTORY_FILE);
  } catch {
    // 文件不存在，创建空数据文件
    const initialData: HistoryData = { records: [] };
    await fs.writeFile(HISTORY_FILE, JSON.stringify(initialData, null, 2), "utf-8");
  }
}

/**
 * 读取所有历史记录
 */
export async function readHistory(): Promise<HistoryRecord[]> {
  await ensureDataFile();

  const raw = await fs.readFile(HISTORY_FILE, "utf-8");
  const data: HistoryData = JSON.parse(raw);
  return data.records;
}

/**
 * 根据 ID 获取单条记录
 */
export async function getRecord(id: string): Promise<HistoryRecord | null> {
  const records = await readHistory();
  return records.find((r) => r.id === id) ?? null;
}

/**
 * 添加或更新记录（按 ID 去重）
 */
export async function addRecord(record: HistoryRecord): Promise<void> {
  await ensureDataFile();

  const records = await readHistory();

  // 如果已存在同 ID 记录，替换之
  const existingIdx = records.findIndex((r) => r.id === record.id);
  if (existingIdx >= 0) {
    records[existingIdx] = record;
  } else {
    // 新记录添加到数组开头
    records.unshift(record);
  }

  // 超过上限时删除最旧的记录
  while (records.length > MAX_RECORDS) {
    const removed = records.pop();
    // 如果有关联的音频文件，尝试清理
    if (removed?.audioUrl?.startsWith("/audio/")) {
      try {
        const audioPath = path.join(
          process.cwd(),
          "public",
          removed.audioUrl
        );
        await fs.unlink(audioPath);
      } catch {
        // 文件可能不存在，忽略
      }
    }
  }

  const data: HistoryData = { records };
  await fs.writeFile(HISTORY_FILE, JSON.stringify(data, null, 2), "utf-8");
}

/**
 * 删除指定记录
 */
export async function deleteRecord(id: string): Promise<boolean> {
  const records = await readHistory();
  const index = records.findIndex((r) => r.id === id);

  if (index === -1) {
    return false; // 未找到
  }

  const removed = records[index];

  // 清理关联的音频文件
  if (removed?.audioUrl?.startsWith("/audio/")) {
    try {
      const audioPath = path.join(
        process.cwd(),
        "public",
        removed.audioUrl
      );
      await fs.unlink(audioPath);
    } catch {
      // 文件可能不存在，忽略
    }
  }

  records.splice(index, 1);

  const data: HistoryData = { records };
  await fs.writeFile(HISTORY_FILE, JSON.stringify(data, null, 2), "utf-8");

  return true;
}

/**
 * 搜索历史记录（简单文本匹配）
 */
export async function searchHistory(query: string): Promise<HistoryRecord[]> {
  const records = await readHistory();
  const lowerQuery = query.toLowerCase();

  return records.filter(
    (r) =>
      r.sourceText.toLowerCase().includes(lowerQuery) ||
      r.translatedText.toLowerCase().includes(lowerQuery) ||
      (r.voiceName?.toLowerCase().includes(lowerQuery) ?? false)
  );
}

/**
 * 生成唯一 ID
 */
export function generateId(): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const random = Math.random().toString(36).substring(2, 8);
  return `rec_${timestamp}_${random}`;
}
