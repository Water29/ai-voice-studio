# AI Voice Studio

AI 英文口播生成工具 — 输入中文文案，AI 自动翻译并生成真人感英文语音。

## 🎯 核心功能

- 🇨🇳 → 🇺🇸 **AI 翻译**：DeepSeek 将中文文案翻译为自然口语化英文（4 种风格可选）
- 🎙️ **语音合成**：ElevenLabs 生成高质量英文语音
- 📜 **历史记录**：自动保存翻译+语音记录，支持搜索和回看
- 💰 **成本透明**：每次调用展示预估费用

## 🚀 快速开始

### 前置条件

- Node.js >= 18
- DeepSeek API Key（[获取地址](https://platform.deepseek.com/api_keys)）
- ElevenLabs API Key（[获取地址](https://elevenlabs.io/app/settings/api-keys)）

### 安装运行

```bash
# 1. 安装依赖
npm install

# 2. 配置密钥
cp .env.example .env.local
# 编辑 .env.local 填入你的 API Keys

# 3. 启动开发服务器
npm run dev

# 4. 打开浏览器
open http://localhost:3000
```

## 📂 项目结构

```
src/
├── app/              # Next.js App Router
│   ├── api/          # API Routes（后端）
│   ├── layout.tsx    # 根布局
│   └── page.tsx      # 主页面
├── components/       # React 组件
├── hooks/            # 自定义 Hooks
├── lib/              # 业务逻辑库
└── types/            # TypeScript 类型
```

## 🛠️ 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 15 + TypeScript |
| 样式 | TailwindCSS + shadcn/ui |
| 翻译 | DeepSeek API (deepseek-chat) |
| 语音 | ElevenLabs API |
| 存储 | JSON 文件 |

## 📖 文档

- [架构设计](docs/ARCHITECTURE.md)
- [环境搭建](docs/SETUP.md)
- [API 文档](docs/API.md)
- [翻译方案](docs/TRANSLATION.md)
- [语音合成](docs/TTS.md)
- [存储设计](docs/STORAGE.md)
- [组件说明](docs/COMPONENTS.md)
- [变更日志](docs/CHANGELOG.md)
