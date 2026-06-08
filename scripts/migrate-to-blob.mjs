// ============================================
// 数据迁移脚本：本地 → Vercel Blob（私有）
// 用法：BLOB_READ_WRITE_TOKEN=xxx node scripts/migrate-to-blob.mjs
// ============================================

import { put } from "@vercel/blob";
import { readFile, access } from "fs/promises";
import { join } from "path";

const HISTORY_FILE = join(process.cwd(), "data", "history.json");
const AUDIO_DIR = join(process.cwd(), "public", "audio");

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("❌ 请设置 BLOB_READ_WRITE_TOKEN 环境变量");
    process.exit(1);
  }

  // 读取本地历史
  console.log("📄 读取本地历史数据...");
  let history;
  try {
    const raw = await readFile(HISTORY_FILE, "utf-8");
    history = JSON.parse(raw);
    console.log(`   找到 ${history.records.length} 条历史记录`);
  } catch {
    console.log("   无历史数据");
    history = { records: [] };
  }

  // Step 1: 收集并上传音频文件（URL还没改，还是 /audio/xxx）
  const audioFiles = new Set();
  for (const r of history.records) {
    for (const v of r.voiceResults || []) {
      if (v.audioUrl && v.audioUrl.startsWith("/audio/")) {
        audioFiles.add(v.audioUrl.replace("/audio/", ""));
      }
    }
  }

  console.log(`\n🎵 上传 ${audioFiles.size} 个音频文件...`);
  let uploaded = 0;
  for (const fileName of audioFiles) {
    const localPath = join(AUDIO_DIR, fileName);
    try {
      await access(localPath);
      const buffer = await readFile(localPath);
      await put(`audio/${fileName}`, buffer, {
        access: "private",
        contentType: "audio/mpeg",
      });
      console.log(`   ✅ ${fileName}`);
      uploaded++;
    } catch {
      console.log(`   ⚠️  ${fileName} (本地文件不存在)`);
    }
  }

  // Step 2: 更新历史中的音频 URL：/audio/ → /api/audio/
  for (const r of history.records) {
    for (const v of r.voiceResults || []) {
      if (v.audioUrl && v.audioUrl.startsWith("/audio/")) {
        v.audioUrl = v.audioUrl.replace("/audio/", "/api/audio/");
      }
    }
  }

  // Step 3: 上传历史数据到 Blob
  console.log("\n☁️  上传历史数据到 Blob...");
  const historyBlob = await put("history/data.json", JSON.stringify(history), {
    access: "private",
    allowOverwrite: true,
    contentType: "application/json",
  });
  console.log(`   ✅ ${historyBlob.url}`);

  console.log(`\n🎉 迁移完成！${uploaded}/${audioFiles.size} 个音频文件上传`);
}

main().catch((e) => {
  console.error("迁移失败:", e);
  process.exit(1);
});
