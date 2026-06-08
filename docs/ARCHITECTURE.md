# 系统架构

## 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                      用户浏览器                           │
│                 http://localhost:3000                    │
└────────────┬────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────┐
│                    Next.js App Router                     │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │   page.tsx   │  │  components/ │  │    hooks/     │  │
│  │  (客户端组件) │  │  (UI组件)    │  │  (业务逻辑)   │  │
│  └──────┬───────┘  └──────────────┘  └───────────────┘  │
│         │                                                │
│         │  fetch("/api/...")                             │
│         ▼                                                │
│  ┌──────────────────────────────────────────────────┐   │
│  │                  API Routes                        │   │
│  │                                                    │   │
│  │  /api/translate  →  lib/deepseek.ts  → DeepSeek   │   │
│  │  /api/tts        →  lib/elevenlabs.ts → ElevenLabs│   │
│  │  /api/history    →  lib/storage.ts  → data/*.json │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
└─────────────────────────────────────────────────────────┘
             │
             ▼
┌────────────────────────┐    ┌──────────────────────────┐
│    DeepSeek API        │    │    ElevenLabs API         │
│  api.deepseek.com      │    │  api.elevenlabs.io        │
│                        │    │                           │
│  - chat/completions    │    │  - text-to-speech         │
│  - 营销翻译             │    │  - 多音色支持             │
└────────────────────────┘    └──────────────────────────┘
```

## 数据流

### 核心流程（翻译 + TTS）

```
用户输入中文文案
       │
       ▼
POST /api/translate ────► DeepSeek API ────► 英文翻译
       │
       ▼
POST /api/tts       ────► ElevenLabs API ──► MP3 音频
       │
       ▼
POST /api/history   ────► data/history.json ─► 保存记录
```

### 历史加载流程

```
用户打开页面 / 搜索
       │
       ▼
GET /api/history?q=xxx ──► 读取 data/history.json ──► 返回列表
```

## 技术选型理由

### 为什么是 Next.js 全栈？
- API Routes 可以直接作为后端，无需额外服务
- React Server Components 减少客户端 JS 体积
- Vercel 一键部署，运维成本低

### 为什么是 DeepSeek 而不是 GPT？
- **成本**：DeepSeek 翻译费用约为 GPT-4o-mini 的 1/5
- **质量**：中文理解优秀，营销翻译场景与 GPT 相当
- **兼容**：API 完全兼容 OpenAI SDK 格式，迁移成本为零

### 为什么是 JSON 文件而不是数据库？
- 数据量小（最多 100 条记录）
- 无需安装和配置数据库服务
- 可以直接用文本编辑器查看和调试
- 部署时无需额外的数据库连接

### 为什么是 TailwindCSS + shadcn/ui？
- TailwindCSS：原子化 CSS，开发效率高
- shadcn/ui：组件源码可控，设计质量高
- 暗色模式开箱即用
