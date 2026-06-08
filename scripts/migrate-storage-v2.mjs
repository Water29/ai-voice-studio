// ============================================
// 存储 v2 迁移：合并JSON → 独立JSON + 上传Blob
// 用法：BLOB_READ_WRITE_TOKEN=xxx node scripts/migrate-storage-v2.mjs
// ============================================

import { put, list } from "@vercel/blob";
import { readFile, writeFile, mkdir, readdir, unlink, access } from "fs/promises";
import { join } from "path";

const OLD_FILE = join(process.cwd(), "data", "history.json");
const NEW_DIR = join(process.cwd(), "data", "history");

async function migrateLocal() {
  console.log("📂 本地迁移...");
  await mkdir(NEW_DIR, { recursive: true });

  // 读取旧格式
  let records = [];
  try {
    const raw = await readFile(OLD_FILE, "utf-8");
    records = JSON.parse(raw).records;
    console.log(`   从 history.json 读取到 ${records.length} 条记录`);
  } catch {
    console.log("   无旧 history.json，跳过");
  }

  // 也读取已存在的独立文件
  try {
    const files = await readdir(NEW_DIR);
    for (const f of files) {
      if (!f.endsWith(".json")) continue;
      try {
        const r = JSON.parse(await readFile(join(NEW_DIR, f), "utf-8"));
        if (!records.find(x => x.id === r.id)) records.push(r);
      } catch {}
    }
  } catch {}

  // 写入独立文件
  for (const r of records) {
    await writeFile(join(NEW_DIR, `${r.id}.json`), JSON.stringify(r, null, 2), "utf-8");
    console.log(`   ✅ ${r.id}.json`);
  }

  // 备份旧文件
  try {
    await writeFile(OLD_FILE + ".bak", await readFile(OLD_FILE), "utf-8");
    console.log("   📦 旧 history.json 已备份为 .bak");
  } catch {}

  console.log(`\n   本地迁移完成！${records.length} 条记录 → data/history/`);
}

async function migrateBlob() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.log("☁️  无 BLOB_READ_WRITE_TOKEN，跳过 Blob 迁移");
    return;
  }

  console.log("\n☁️  Blob 迁移...");

  // 1. 删除旧的 history/data.json（如果存在）
  try {
    const oldList = await list({ prefix: "history/data.json" });
    for (const b of oldList.blobs) {
      await (await import("@vercel/blob")).del(b.url);
      console.log("   🗑️  删除旧 history/data.json");
    }
  } catch (e) {
    console.log("   无需清理旧文件:", e.message);
  }

  // 2. 读取本地独立文件并上传
  const files = await readdir(NEW_DIR);
  let uploaded = 0;
  for (const f of files) {
    if (!f.endsWith(".json")) continue;
    const record = JSON.parse(await readFile(join(NEW_DIR, f), "utf-8"));
    await put(`history/${record.id}.json`, JSON.stringify(record), {
      access: "private",
      allowOverwrite: true,
      contentType: "application/json",
    });
    console.log(`   ✅ history/${record.id}.json`);
    uploaded++;
  }
  console.log(`\n   Blob 迁移完成！${uploaded} 条记录上传`);
}

async function main() {
  await migrateLocal();
  await migrateBlob();
  console.log("\n🎉 全部迁移完成！");
}

main().catch((e) => {
  console.error("迁移失败:", e);
  process.exit(1);
});
