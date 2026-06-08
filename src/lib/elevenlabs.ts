// ============================================
// ElevenLabs API TTS 客户端
// 生产(Vercel Blob) + 本地(public/audio/) 双模式
// ============================================

import type { TTSResponse, Voice } from "@/types";

const ELEVENLABS_BASE_URL = "https://api.elevenlabs.io";

function isVercel(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

export const DEFAULT_VOICES: Voice[] = [
  { voiceId: "pNInz6obpgDQGcFmaJgB", name: "Adam", label: "Adam — Deep American Male", category: "male", description: "深沉美式男声，广告促销" },
  { voiceId: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", label: "Rachel — Warm American Female", category: "female", description: "温暖美国女声，旁白教程" },
  { voiceId: "EXAVITQu4vr4xnSDxMaL", name: "Bella", label: "Bella — Young American Female", category: "female", description: "年轻活泼，TikTok社媒" },
  { voiceId: "yoZ06aMxZJJ28mfd3POQ", name: "Sam", label: "Sam — Calm American Male", category: "male", description: "沉稳平静，企业介绍" },
  { voiceId: "AZnzlk1XvdvUeBnXmlld", name: "Domi", label: "Domi — Energetic Female", category: "female", description: "高能量女声，促销导购" },
  { voiceId: "MF3mGyEYCl7XYWbV9V6O", name: "Emily", label: "Emily — Soft American Female", category: "female", description: "温柔亲切，生活类" },
];

export const VOICE_STYLE_MAP: Record<string, string> = {
  advertisement: "Adam", storytelling: "Rachel", tutorial: "Sam",
  news: "Emily", casual_vlog: "Bella",
};

export const DEFAULT_RECOMMENDED_VOICE = "Adam";

// ============================================
// TTS 生成
// ============================================
export async function generateSpeech(
  text: string,
  voiceId: string
): Promise<TTSResponse> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY is not configured");

  const response = await fetch(
    `${ELEVENLABS_BASE_URL}/v1/text-to-speech/${voiceId}`,
    {
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
          stability: 0.4, similarity_boost: 0.8,
          style: 0.5, use_speaker_boost: true,
        },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`ElevenLabs API error (${response.status}): ${err}`);
  }

  const audioBuffer = await response.arrayBuffer();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `tts_${timestamp}_${voiceId.substring(0, 8)}.mp3`;

  let audioUrl: string;

  if (isVercel()) {
    // Vercel Blob 存储
    const { put } = await import("@vercel/blob");
    const blob = await put(`audio/${fileName}`, Buffer.from(audioBuffer), {
      access: "public",
      contentType: "audio/mpeg",
    });
    audioUrl = blob.url;
  } else {
    // 本地文件存储
    const fs = await import("fs/promises");
    const path = await import("path");
    const audioDir = path.join(process.cwd(), "public", "audio");
    await fs.mkdir(audioDir, { recursive: true });
    const filePath = path.join(audioDir, fileName);
    await fs.writeFile(filePath, Buffer.from(audioBuffer));
    audioUrl = `/audio/${fileName}`;
  }

  const wordCount = text.split(/\s+/).length;
  const estimatedDurationMs = Math.round((wordCount / 2.5) * 1000);
  const voice = DEFAULT_VOICES.find((v) => v.voiceId === voiceId);
  const costUsd = Math.round((text.length / 1000) * 0.03 * 10000) / 10000;

  return {
    audioUrl,
    durationMs: estimatedDurationMs,
    voiceName: voice?.name ?? voiceId,
    costUsd,
  };
}

export async function generateMultiSpeech(
  text: string,
  voiceIds: string[]
): Promise<TTSResponse[]> {
  const results = await Promise.allSettled(
    voiceIds.map((voiceId) => generateSpeech(text, voiceId))
  );
  return results.map((result, index) => {
    if (result.status === "fulfilled") return result.value;
    return {
      audioUrl: "", durationMs: 0,
      voiceName: DEFAULT_VOICES.find((v) => v.voiceId === voiceIds[index])?.name ?? "Unknown",
      costUsd: 0, _error: result.reason?.message ?? "Unknown error",
    } as TTSResponse & { _error: string };
  });
}

export function getVoices(): Voice[] { return DEFAULT_VOICES; }
export function recommendVoice(style: string): Voice {
  const name = VOICE_STYLE_MAP[style] ?? DEFAULT_RECOMMENDED_VOICE;
  return DEFAULT_VOICES.find((v) => v.name === name) ?? DEFAULT_VOICES[0];
}
