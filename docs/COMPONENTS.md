# 前端组件说明

## 组件树

```
page.tsx (主页面，客户端组件)
├── ScriptInput
│   └── 翻译风格选择器 (TikTok/Professional/Casual/Sales)
├── TranslationResult
│   └── 支持复制、编辑、重新翻译
├── VoicePlayer
│   └── 音频播放/暂停/进度条/下载
├── HistoryPanel
│   └── 按日期分组 + 搜索 + 删除
└── (Phase 2/3 组件待实现)
    ├── VoiceSelector
    ├── WaveformPlayer
    ├── CostDisplay
    └── SubtitleExport
```

## 组件详解

### ScriptInput – 文案输入区

**Props**
```typescript
interface ScriptInputProps {
  onGenerate: (text: string, style: TranslationStyle) => void;
  isGenerating: boolean;
  disabled?: boolean;
}
```

**功能**
- 多行文本输入（最大 5000 字符，实时计数）
- 4 种翻译风格选择（网格按钮，高亮当前选择）
- 生成按钮（带加载动画）

### TranslationResult – 翻译结果展示

**Props**
```typescript
interface TranslationResultProps {
  translatedText: string;
  style: TranslationStyle;
  costUsd: number;
  onCopy?: () => void;
  onRegenerate?: () => void;
}
```

**功能**
- 显示译文（支持换行）
- 复制到剪贴板（带反馈动画）
- 编辑模式（textarea 修改）
- 重新翻译按钮
- 风格标签 + 费用显示

### VoicePlayer – 音频播放器

**Props**
```typescript
interface VoicePlayerProps {
  audioUrl: string | null;
  voiceName?: string | null;
  durationMs?: number | null;
  onDownload?: () => void;
}
```

**功能**
- 播放/暂停（圆形按钮 + SVG 图标）
- 进度条（拖动定位，渐变色显示进度）
- 时间显示（mm:ss 格式）
- 下载按钮
- 自动重置（audioUrl 变化时）

### HistoryPanel – 历史记录面板

**Props**
```typescript
interface HistoryPanelProps {
  records: HistoryRecord[];
  isLoading: boolean;
  onSelect: (record: HistoryRecord) => void;
  onDelete: (id: string) => void;
  onSearch: (query: string) => void;
}
```

**功能**
- 按日期分组（今天/昨天/最近7天/更早）
- 搜索框（支持回车搜索）
- 悬停显示删除按钮
- 空状态提示
- 记录数统计

## 自定义 Hooks

### useTranslation
管理翻译流程的状态（translating/error/result）。

### useVoice
管理语音生成流程，音色列表加载，多音色选择。

### useHistory
管理历史记录 CRUD，初始加载，搜索。
