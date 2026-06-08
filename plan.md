# AI Voice Studio 开发方案

## 项目目标

实现一个面向运营人员的 AI 英文口播生成工具。

用户输入中文口播文案后，系统能够：

- 自动翻译为自然流畅的英文
- 生成真人感英文语音
- 支持在线试听
- 支持音频下载
- 保存历史记录

在完成基础功能后，进一步提升产品体验和完成度，打造接近真实 SaaS 产品的 Demo。

---

# 产品定位

## 不要做成

```text
输入框
↓
点击生成
↓
显示结果
```

这种作业风格页面。

## 目标

打造类似：

- ElevenLabs
- ChatGPT
- Notion AI

风格的 AI 工具产品。

项目名称建议：

```text
AI Voice Studio
```

或者

```text
TikTok Voice Generator
```

---

# 技术选型

## 前端

### Next.js 15

原因：

- React生态成熟
- SSR友好
- API Route可直接作为后端
- Vercel部署方便

技术栈：

```text
Next.js 15
TypeScript
TailwindCSS
shadcn/ui
```

---

## 后端

使用：

```text
Next.js API Route
```

即可满足需求。

无需额外SpringBoot服务。

---

## 数据库

### Prisma + SQLite

开发效率最高。

历史记录表：

```sql
TranslationHistory

id
source_text
translated_text
audio_url
voice_name
created_at
```

---

# 翻译方案

## 不推荐

```text
Google Translate
DeepL
```

原因：

翻译结果偏书面化。

不适合短视频口播。

---

## 推荐

GPT翻译

模型：

```text
gpt-4o-mini
```

Prompt：

```text
You are a professional TikTok marketing translator.

Translate Chinese scripts into natural spoken English.

Requirements:
- Sound like a native speaker
- Suitable for short-form videos
- Avoid literal translation
- Keep persuasive tone
```

目标：

生成类似真人营销文案的翻译结果。

---

# ElevenLabs配置

## 推荐模型

优先尝试：

```text
eleven_multilingual_v2
```

或者：

```text
eleven_turbo_v2
```

对比试听后选择效果最佳方案。

---

## 推荐参数

初始参数：

```json
{
  "stability": 0.4,
  "similarity_boost": 0.8,
  "style": 0.5,
  "use_speaker_boost": true
}
```

目标：

提升口播自然度。

---

# 页面设计

## 页面结构

```text
┌───────────────────────────┐
│ AI Voice Studio           │
├───────────────────────────┤
│ Chinese Script            │
│                           │
│ 输入区域                  │
│                           │
│ Generate                  │
├───────────────────────────┤
│ Translation Result        │
│                           │
│ 英文翻译                  │
│ Copy                      │
├───────────────────────────┤
│ Voice Preview             │
│                           │
│ Voice A                   │
│ Voice B                   │
│ Voice C                   │
└───────────────────────────┘
```

---

# MVP功能

## 1. 中文输入

支持多行文本。

---

## 2. 英文翻译

生成英文结果。

支持：

- 复制
- 编辑

---

## 3. 英文语音生成

生成MP3。

支持：

- 播放
- 暂停
- 下载

---

## 4. 历史记录

保存：

- 原文
- 翻译结果
- 音频地址
- 音色
- 时间

支持：

- 查看
- 删除
- 重新生成

---

# 加分项设计

---

# 加分项1：多音色并发试听

## 功能

一次生成多个音色。

例如：

```text
Rachel
Bella
Adam
```

并排展示。

---

## 技术实现

```typescript
Promise.all([
  generateVoice("Rachel"),
  generateVoice("Bella"),
  generateVoice("Adam"),
]);
```

---

## UI

```text
Rachel
▶ Play

Bella
▶ Play

Adam
▶ Play
```

用户选中后再下载。

---

# 加分项2：AI推荐最佳音色

## 实现思路

GPT分析文本风格。

输出：

```json
{
  "style": "advertisement",
  "recommended_voice": "Adam"
}
```

---

## 页面展示

```text
Recommended Voice

Adam
92% Match
```

---

# 加分项3：多版本翻译

同时生成：

```text
Professional
Casual
TikTok Style
American Sales Style
```

方便运营直接选择。

---

# 加分项4：逐句同步高亮

## 目标

播放音频时同步高亮对应文本。

效果：

```text
[高亮]
Still struggling with mowing your lawn?
[/高亮]

Save time and effort...
```

---

## 技术方案A

使用 ElevenLabs Alignment。

如果API返回时间戳：

```text
sentence
start_time
end_time
```

即可直接同步。

---

## 技术方案B

Whisper强制对齐。

流程：

```text
文本
↓
ElevenLabs
↓
音频
↓
Whisper
↓
时间轴
↓
字幕同步
```

---

# 加分项5：音频波形播放器

## 技术

```text
wavesurfer.js
```

---

## 功能

支持：

- 波形显示
- 拖动播放
- 快速定位
- 与字幕同步

效果远优于原生audio标签。

---

# 加分项6：跟读模式

## 功能

逐句播放。

用户可以模仿朗读。

适用于：

- 英语练习
- 主播培训
- 运营口播

---

# 加分项7：历史记录升级

## 不要

```text
列表
```

## 推荐

```text
Today

Robotic mower ad

Yesterday

Pet product ad

Last Week

Garden tools
```

支持：

- 搜索
- 分类
- 重新生成

---

# 加分项8：导出字幕

支持导出：

```text
SRT
VTT
```

方便直接导入：

- 剪映
- Premiere
- CapCut

---

# 加分项9：成本统计

展示：

```text
Characters: 243

Estimated Cost:
$0.013
```

体现工程意识。

---

# 加分项10：短视频素材包

最终输出：

```text
✓ 英文翻译

✓ MP3

✓ 字幕文件

✓ 推荐音色

✓ 推荐标题

✓ 推荐标签
```

示例：

```text
Title:
This Robot Mows Your Lawn For You

Hashtags:
#gadgets
#robotics
#lawncare
#amazonfinds
```

让工具从TTS升级为内容创作助手。

---

# 开发优先级

## 第一阶段（必须完成）

- 中文输入
- GPT翻译
- ElevenLabs语音生成
- 播放
- 下载
- 历史记录

---

## 第二阶段（重点加分）

- 多音色并发试听
- GPT推荐音色
- 多版本翻译
- 波形播放器

---

## 第三阶段（冲刺亮点）

- 逐句高亮
- Whisper时间轴
- 字幕导出
- 跟读模式

---

# 面试官最容易认可的组合

推荐实现：

✅ GPT营销翻译

✅ 多音色并发试听

✅ WaveSurfer波形播放器

✅ 逐句同步高亮

这四项投入产出比最高。

如果全部完成，整体完成度已经接近真实商业产品，而不仅仅是一道笔试题。
