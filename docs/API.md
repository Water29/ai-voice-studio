# API 接口文档

## 基础信息

- **Base URL**: `http://localhost:3000/api`
- **请求格式**: JSON
- **响应格式**: JSON
- **错误格式**: `{ "error": "错误描述", "detail": "详细信息" }`

---

## 1. 翻译接口

### POST `/api/translate`

中文文案翻译为英文。

**请求体**
```json
{
  "text": "这款机器人能帮你自动修剪草坪",
  "style": "tiktok"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| text | string | 是 | 中文原文，最大 5000 字符 |
| style | string | 否 | 翻译风格，默认 tiktok。可选：tiktok / professional / casual / sales |

**成功响应** (200)
```json
{
  "translatedText": "This robot mows your lawn for you — automatically.",
  "style": "tiktok",
  "tokensUsed": 156,
  "costUsd": 0.0003
}
```

**错误响应**
```json
// 400 - 参数错误
{ "error": "缺少必填参数 text" }

// 503 - 服务未配置
{ "error": "翻译服务未配置", "detail": "DEEPSEEK_API_KEY is not configured" }

// 500 - 服务异常
{ "error": "翻译失败", "detail": "DeepSeek API error (429): ..." }
```

---

## 2. 语音生成接口

### POST `/api/tts`

将英文文本转换为语音。

**请求体**
```json
{
  "text": "This robot mows your lawn for you.",
  "voiceId": "pNInz6obpgDQGcFmaJgB"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| text | string | 是 | 英文文本，最大 5000 字符 |
| voiceId | string | 是 | ElevenLabs 音色 ID |

**成功响应** (200)
```json
{
  "audioUrl": "/audio/tts_2024-06-08T10-30-00_pNInz6ob.mp3",
  "durationMs": 4200,
  "voiceName": "Adam",
  "costUsd": 0.0045
}
```

---

## 3. 音色列表接口

### GET `/api/voices`

获取可用的 ElevenLabs 音色列表。

**响应** (200)
```json
{
  "voices": [
    {
      "voiceId": "pNInz6obpgDQGcFmaJgB",
      "name": "Adam",
      "label": "Adam — Deep American Male",
      "category": "male",
      "description": "深沉有力的美式男声，适合广告和促销"
    }
  ]
}
```

---

## 4. 历史记录接口

### GET `/api/history`

获取历史记录列表，支持搜索。

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| q | string | 否 | 搜索关键词（匹配原文/译文/音色名） |

**响应** (200)
```json
{
  "records": [
    {
      "id": "rec_2024-06-08T10-30-00_a1b2c3",
      "sourceText": "这款机器人能帮你自动修剪草坪",
      "translatedText": "This robot mows your lawn for you — automatically.",
      "translationStyle": "tiktok",
      "audioUrl": "/audio/tts_xxx.mp3",
      "voiceName": "Adam",
      "voiceId": "pNInz6obpgDQGcFmaJgB",
      "durationMs": 4200,
      "costUsd": 0.0048,
      "createdAt": "2024-06-08T10:30:00Z"
    }
  ]
}
```

### POST `/api/history`

保存新的历史记录。

### GET `/api/history/[id]`

获取单条历史记录详情。

### DELETE `/api/history/[id]`

删除指定历史记录。成功返回 `{ "success": true }`。
