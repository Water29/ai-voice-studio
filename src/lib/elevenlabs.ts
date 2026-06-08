// ============================================
// ElevenLabs API TTS 客户端
// API 文档：https://elevenlabs.io/docs/api-reference
// ============================================

import type { TTSResponse, Voice } from "@/types";

const ELEVENLABS_BASE_URL = "https://api.elevenlabs.io";

// ============================================
// 预定义音色库
// ============================================

/** ElevenLabs 推荐音色列表（高质量英文口播） */
export const DEFAULT_VOICES: Voice[] = [
  {
    voiceId: "pNInz6obpgDQGcFmaJgB",
    name: "Adam",
    label: "Adam — Deep American Male",
    category: "male",
    description: "深沉有力的美式男声，适合广告和促销",
  },
  {
    voiceId: "21m00Tcm4TlvDq8ikWAM",
    name: "Rachel",
    label: "Rachel — Warm American Female",
    category: "female",
    description: "温暖自然的美国女声，适合旁白和教程",
  },
  {
    voiceId: "EXAVITQu4vr4xnSDxMaL",
    name: "Bella",
    label: "Bella — Young American Female",
    category: "female",
    description: "年轻活泼的美国女声，适合 TikTok 和社媒",
  },
  {
    voiceId: "yoZ06aMxZJJ28mfd3POQ",
    name: "Sam",
    label: "Sam — Calm American Male",
    category: "male",
    description: "沉稳平静的男声，适合企业介绍",
  },
  {
    voiceId: "AZnzlk1XvdvUeBnXmlld",
    name: "Domi",
    label: "Domi — Energetic American Female",
    category: "female",
    description: "高能量美式女声，适合促销导购",
  },
  {
    voiceId: "MF3mGyEYCl7XYWbV9V6O",
    name: "Emily",
    label: "Emily — Soft American Female",
    category: "female",
    description: "温柔亲切的美国女声，适合生活类内容",
  },
];

/** 文本风格 → 推荐音色映射（Phase 2 使用） */
export const VOICE_STYLE_MAP: Record<string, string> = {
  advertisement: "Adam",
  storytelling: "Rachel",
  tutorial: "Sam",
  news: "Emily",
  casual_vlog: "Bella",
};

/** 推荐音色（不确定时的默认值） */
export const DEFAULT_RECOMMENDED_VOICE = "Adam";

// ============================================
// TTS 生成
// ============================================

/**
 * 调用 ElevenLabs API 生成语音
 * @param text 要转换的英文文本
 * @param voiceId ElevenLabs 音色 ID
 * @returns TTSResponse 包含音频 URL
 */
export async function generateSpeech(
  text: string,
  voiceId: string
): Promise<TTSResponse> {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY is not configured");
  }

  const url = `${ELEVENLABS_BASE_URL}/v1/text-to-speech/${voiceId}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "audio/mpeg",
      "Content-Type": "application/json",
      "xi-api-key": apiKey,
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.4,
        similarity_boost: 0.8,
        style: 0.5,
        use_speaker_boost: true,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `ElevenLabs API error (${response.status}): ${errorBody}`
    );
  }

  // 获取音频 blob
  const audioBuffer = await response.arrayBuffer();

  // 保存到 public/audio/ 目录
  const fs = await import("fs/promises");
  const path = await import("path");

  const audioDir = path.join(process.cwd(), "public", "audio");
  await fs.mkdir(audioDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `tts_${timestamp}_${voiceId.substring(0, 8)}.mp3`;
  const filePath = path.join(audioDir, fileName);

  await fs.writeFile(filePath, Buffer.from(audioBuffer));

  // 估算音频时长（ElevenLabs 约 150 词/分钟 ≈ 2.5 词/秒）
  const wordCount = text.split(/\s+/).length;
  const estimatedDurationMs = Math.round((wordCount / 2.5) * 1000);

  // 找到音色名称
  const voice = DEFAULT_VOICES.find((v) => v.voiceId === voiceId);

  // 成本计算（ElevenLabs: $0.03/1000 字符 ≈ 多语言模型价格）
  const costUsd = Math.round((text.length / 1000) * 0.03 * 10000) / 10000;

  return {
    audioUrl: `/audio/${fileName}`,
    durationMs: estimatedDurationMs,
    voiceName: voice?.name ?? voiceId,
    costUsd,
  };
}

/**
 * 并发生成多个音色的语音
 * Phase 2 使用
 */
export async function generateMultiSpeech(
  text: string,
  voiceIds: string[]
): Promise<TTSResponse[]> {
  const results = await Promise.allSettled(
    voiceIds.map((voiceId) => generateSpeech(text, voiceId))
  );

  return results.map((result, index) => {
    if (result.status === "fulfilled") {
      return result.value;
    }
    // 返回失败的标记
    return {
      audioUrl: "",
      durationMs: 0,
      voiceName: DEFAULT_VOICES.find((v) => v.voiceId === voiceIds[index])
        ?.name ?? "Unknown",
      costUsd: 0,
      _error: result.reason?.message ?? "Unknown error",
    } as TTSResponse & { _error: string };
  });
}

/**
 * 获取可用的音色列表
 */
export function getVoices(): Voice[] {
  return DEFAULT_VOICES;
}

/**
 * AI 根据文本风格推荐最佳音色
 * Phase 2 使用
 */
export function recommendVoice(style: string): Voice {
  const voiceName = VOICE_STYLE_MAP[style] ?? DEFAULT_RECOMMENDED_VOICE;
  const voice = DEFAULT_VOICES.find((v) => v.name === voiceName);
  return voice ?? DEFAULT_VOICES[0];
}
