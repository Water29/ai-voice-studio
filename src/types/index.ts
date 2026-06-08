// ============================================
// AI Voice Studio — TypeScript 类型定义
// ============================================

/** 翻译风格 */
export type TranslationStyle = "tiktok" | "professional" | "casual" | "sales";

/** 翻译请求 */
export interface TranslateRequest {
  text: string;
  style?: TranslationStyle;
}

/** 翻译响应 */
export interface TranslateResponse {
  translatedText: string;
  style: TranslationStyle;
  tokensUsed: number;
  costUsd: number;
}

/** TTS 语音生成请求 */
export interface TTSRequest {
  text: string;
  voiceId: string;
}

/** TTS 语音生成响应 */
export interface TTSResponse {
  audioUrl: string;
  durationMs: number;
  voiceName: string;
  costUsd: number;
}

/** 可用音色 */
export interface Voice {
  voiceId: string;
  name: string;
  label: string;        // 展示标签，如 "Adam — Deep American Male"
  category: string;      // 分类：male / female / narrator
  previewUrl?: string;
  description?: string;
}

/** AI 音色推荐结果 */
export interface VoiceRecommendation {
  style: string;                // 文本风格标签
  recommendedVoice: Voice;
  matchScore: number;           // 0-100
  reasoning: string;            // AI 推荐理由
}

/** 历史记录 */
export interface HistoryRecord {
  id: string;
  sourceText: string;
  translatedText: string;
  translationStyle: TranslationStyle;
  audioUrl: string | null;
  voiceName: string | null;
  voiceId: string | null;
  durationMs: number | null;
  costUsd: number;
  createdAt: string;            // ISO 8601
}

/** 历史数据文件结构 */
export interface HistoryData {
  records: HistoryRecord[];
}

/** 字幕导出格式 */
export type SubtitleFormat = "srt" | "vtt";

/** 字幕导出请求 */
export interface SubtitleExportRequest {
  text: string;
  audioUrl: string;
  segments?: SubtitleSegment[];  // 如果有 Whisper 对齐的时间戳
  format: SubtitleFormat;
}

/** 字幕片段 */
export interface SubtitleSegment {
  index: number;
  startTime: number;   // 毫秒
  endTime: number;     // 毫秒
  text: string;
}

/** API 错误响应 */
export interface APIError {
  error: string;
  detail?: string;
}

/** 成本计算 */
export interface CostBreakdown {
  translationCost: number;
  ttsCost: number;
  totalCost: number;
  characters: number;
}
