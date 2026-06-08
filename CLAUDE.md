# CLAUDE.md — AI Voice Studio 项目规范

## 项目概述

**AI Voice Studio** — 面向短视频运营人员的 AI 英文口播生成工具。

核心流程：`中文口播文案 → DeepSeek翻译 → 英文文案 → ElevenLabs TTS → 英文语音`

## 技术栈

| 层级 | 技术                                          |
| ---- | --------------------------------------------- |
| 框架 | Next.js 15 (App Router) + TypeScript (strict) |
| 样式 | TailwindCSS + shadcn/ui                       |
| 翻译 | DeepSeek API (deepseek-chat)                  |
| TTS  | ElevenLabs API                                |
| 存储 | JSON 文件 (`data/history.json`)               |
| 部署 | Vercel                                        |

## 目录结构

```
yeete/
├── CLAUDE.md              # 本文件
├── README.md              # 项目总览
├── .env.local             # API Keys（不提交）
├── .env.example           # 环境变量模板
├── docs/                  # 项目文档
├── data/                  # JSON 数据存储
├── scripts/               # Python 脚本（Phase 3）
├── public/audio/          # 生成的音频（不提交）
└── src/
    ├── app/api/           # API Routes（后端逻辑）
    ├── components/        # React 组件
    ├── lib/               # 业务逻辑库
    ├── hooks/             # 自定义 Hooks
    └── types/             # TypeScript 类型
```

## 编码规范

### TypeScript

- **strict: true** — 所有函数必须标注参数和返回值类型
- 优先使用 `interface` 定义对象类型，`type` 用于联合类型
- 禁止 `any`，不确定类型用 `unknown` + 类型守卫

### 命名约定

- **组件文件**：PascalCase — `ScriptInput.tsx`
- **工具函数**：camelCase — `formatDuration.ts`
- **API Routes**：kebab-case 目录 — `api/voices/recommend/route.ts`
- **类型/接口**：PascalCase — `HistoryRecord`, `TranslateRequest`

### 文件组织

- API 调用逻辑 → `src/lib/`（不与 React 耦合）
- 业务逻辑 Hook → `src/hooks/`
- UI 组件 → `src/components/`
- 所有类型定义 → `src/types/index.ts`

### API Routes 规范

- 每个 `route.ts` 只导出一个 HTTP 方法处理函数
- 统一错误响应格式：
  ```typescript
  return NextResponse.json({ error: "错误描述" }, { status: 400 });
  ```
- API Key 从 `process.env` 读取，**绝不硬编码**
- 调用外部 API 时使用 `fetch`（Node.js 18+ 原生支持）

### React 组件规范

- **Server Component 优先**，仅在需要交互时加 `"use client"`
- 使用 shadcn/ui 组件，不手写基础 UI（Button, Input, Card 等）
- Props 类型定义在组件文件顶部导出
- 状态管理用 React 内置 hooks（useState, useEffect, useCallback）
- 不引入外部状态管理库（Redux, Zustand 等）

### 样式规范

- 使用 TailwindCSS 原子类，不写自定义 CSS（除非必要）
- 组件间间距使用父容器的 `gap` 而非子元素的 `margin`
- 响应式设计：移动优先，断点 `sm` → `md` → `lg`

## 关键约束

1. **不引入数据库**：所有持久化数据存 JSON 文件
2. **不引入 Python 后端**：后端逻辑全部在 Next.js API Routes
3. **Python 仅 Phase 3**：conda `claudecode` 环境仅用于 Whisper 对齐
4. **API Keys 在 .env.local**：提交 `.env.example` 模板，不提交真实密钥

## 常用命令

```bash
# 开发
npm run dev              # 启动开发服务器 http://localhost:3000

# 构建
npm run build            # 生产构建
npm start                # 启动生产服务器

# 代码检查
npm run lint             # ESLint 检查

# Python（Phase 3）
conda activate claudecode
python scripts/align.py --audio <path> --text <text>
```

## Git 规范

- 提交信息使用中文：`feat: 实现 DeepSeek 翻译接口`
- 提交类型：`feat:` 功能 / `fix:` 修复 / `docs:` 文档 / `refactor:` 重构 / `style:` 样式
- 不提交：`.env.local`, `node_modules/`, `public/audio/`, `data/history.json`, `.next/`
