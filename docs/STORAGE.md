# JSON 文件存储设计

## 设计原则

- **无数据库依赖**：不引入 SQLite、PostgreSQL 等任何数据库
- **简单可读**：JSON 格式可直接用文本编辑器查看调试
- **自动管理**：系统自动创建文件、限制容量、清理旧数据

## 存储文件

### `data/history.json` — 翻译历史记录

```json
{
  "records": [
    {
      "id": "rec_1717838400000_a1b2c3",
      "sourceText": "这款机器人能帮你自动修剪草坪",
      "translatedText": "This robot mows your lawn for you — automatically.",
      "translationStyle": "tiktok",
      "audioUrl": "/audio/tts_2024-06-08T10-30-00_pNInz6ob.mp3",
      "voiceName": "Adam",
      "voiceId": "pNInz6obpgDQGcFmaJgB",
      "durationMs": 4200,
      "costUsd": 0.0048,
      "createdAt": "2024-06-08T10:30:00.000Z"
    }
  ]
}
```

### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 唯一标识，格式 `rec_{timestamp}_{random}` |
| sourceText | string | 中文原文 |
| translatedText | string | 英文翻译 |
| translationStyle | string | 翻译风格：tiktok/professional/casual/sales |
| audioUrl | string/null | 音频文件路径（相对 public 目录） |
| voiceName | string/null | 音色名称 |
| voiceId | string/null | ElevenLabs voice_id |
| durationMs | number/null | 音频时长（毫秒） |
| costUsd | number | 预估费用（美元） |
| createdAt | string | 创建时间（ISO 8601） |

## 容量控制

- **最大记录数**：100 条
- **溢出策略**：FIFO（先进先出），删除最旧的记录
- **清理行为**：删除记录时自动删除关联的音频文件

## API 操作

| 操作 | 函数 | 说明 |
|------|------|------|
| 读取全部 | `readHistory()` | 返回所有记录 |
| 按ID查询 | `getRecord(id)` | 返回单条或 null |
| 添加记录 | `addRecord(record)` | 插入到开头，自动去旧 |
| 删除记录 | `deleteRecord(id)` | 删除记录+音频文件 |
| 搜索 | `searchHistory(query)` | 文本匹配原文/译文/音色名 |

## 实现代码

文件：`src/lib/storage.ts`

核心依赖：Node.js `fs/promises` + `path`

```typescript
import fs from "fs/promises";
import path from "path";

const HISTORY_FILE = path.join(process.cwd(), "data", "history.json");
const MAX_RECORDS = 100;
```
