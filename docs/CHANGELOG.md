# 变更日志

## [Phase 1] 2024-06-08 — MVP 基础版本

### 项目初始化
- 创建项目目录结构
- 初始化 Next.js 15 + TypeScript + TailwindCSS + shadcn/ui
- 编写 CLAUDE.md 编码规范
- 配置 .gitignore + .env.example

### 核心功能
- **翻译**：DeepSeek API 集成，4 种翻译风格（TikTok/Professional/Casual/Sales）
- **语音**：ElevenLabs API 集成，6 个预置音色
- **历史**：JSON 文件存储，支持搜索/分组/删除
- **UI**：深色模式 SaaS 风格界面

### API Routes
- `POST /api/translate` — 中文→英文翻译
- `POST /api/tts` — 文本→语音生成
- `GET /api/voices` — 音色列表
- `GET /api/history` — 历史记录列表（支持搜索）
- `POST /api/history` — 保存历史记录
- `GET /api/history/[id]` — 历史详情
- `DELETE /api/history/[id]` — 删除记录

### 文档
- README.md
- docs/ARCHITECTURE.md
- docs/SETUP.md
- docs/API.md
- docs/TRANSLATION.md
- docs/TTS.md
- docs/STORAGE.md
- docs/COMPONENTS.md
- docs/CHANGELOG.md

---

## [待实现] Phase 2 — 高价值加分项
- [ ] 多音色并发生成 + VoiceSelector 组件
- [ ] DeepSeek AI 推荐最佳音色
- [ ] 多版本翻译切换
- [ ] wavesurfer.js 波形播放器
- [ ] 成本统计展示

## [待实现] Phase 3 — 冲刺亮点
- [ ] 创建 conda `claudecode` Python 环境
- [ ] Whisper 强制对齐脚本
- [ ] 逐句同步高亮
- [ ] SRT/VTT 字幕导出
- [ ] 跟读模式
