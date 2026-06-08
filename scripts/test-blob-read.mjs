// 本地测试 Blob 读取
import "dotenv/config";
import { list } from "@vercel/blob";

const BLOB_KEY = "history/data.json";

async function main() {
  console.log("Token:", process.env.BLOB_READ_WRITE_TOKEN?.substring(0, 25) + "...");
  console.log("StoreId:", process.env.BLOB_STORE_ID);

  // 1. list all
  console.log("\n1. list() all blobs:");
  const all = await list();
  console.log(`   ${all.blobs.length} blobs:`, all.blobs.map(b => b.pathname));

  // 2. find history
  const hist = all.blobs.find(b => b.pathname === BLOB_KEY);
  if (!hist) {
    console.log("   ❌ history/data.json not found!");
    return;
  }
  console.log("\n2. Found history blob:");
  console.log("   url:", hist.url);
  console.log("   downloadUrl:", hist.downloadUrl?.substring(0, 80));

  // 3. try downloadUrl
  console.log("\n3. fetch(downloadUrl):");
  const r1 = await fetch(hist.downloadUrl);
  console.log(`   status: ${r1.status}`);
  if (r1.ok) console.log("   ✅ works!");

  // 4. try url + Bearer
  console.log("\n4. fetch(url + Bearer):");
  const r2 = await fetch(hist.url, {
    headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
  });
  console.log(`   status: ${r2.status}`);
  if (r2.ok) console.log("   ✅ works!");

  // 5. try url + x-api-key
  console.log("\n5. fetch(url + x-api-key):");
  const r3 = await fetch(hist.url, {
    headers: { "x-api-key": process.env.BLOB_READ_WRITE_TOKEN },
  });
  console.log(`   status: ${r3.status}`);
  if (r3.ok) console.log("   ✅ works!");

  // 6. try url + token query
  console.log("\n6. fetch(url?token=):");
  const r4 = await fetch(`${hist.url}?token=${process.env.BLOB_READ_WRITE_TOKEN}`);
  console.log(`   status: ${r4.status}`);
  if (r4.ok) console.log("   ✅ works!");
}

main().catch(e => console.error("Error:", e.message));
