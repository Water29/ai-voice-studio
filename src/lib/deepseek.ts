// ============================================
// DeepSeek API 翻译客户端
// API 文档：https://platform.deepseek.com/api-docs
// ============================================

import type { TranslateResponse, TranslationStyle } from "@/types";

const DEEPSEEK_BASE_URL = "https://api.deepseek.com";
const MODEL = "deepseek-chat";

/** 每种翻译风格对应的 System Prompt */
const TRANSLATION_PROMPTS: Record<TranslationStyle, string> = {
  tiktok: `You are a professional TikTok marketing translator.
Translate Chinese scripts into natural spoken English.
Requirements:
- Sound like a native English speaker
- Suitable for short-form videos (TikTok, Reels, Shorts)
- Avoid literal translation — prioritize natural conversational flow
- Keep a persuasive, engaging, energetic tone
- Use short sentences that are easy to speak aloud
- Output ONLY the translated English text, no explanations, no notes.`,

  professional: `You are a professional business translator.
Translate Chinese scripts into formal yet natural spoken English.
Requirements:
- Professional business tone, suitable for corporate presentations
- Clear, articulate, well-structured sentences
- Maintain the original meaning precisely
- Avoid slang and casual expressions
- Output ONLY the translated English text, no explanations.`,

  casual: `You are a casual conversation translator.
Translate Chinese scripts into everyday conversational English.
Requirements:
- Sound like a friend talking to another friend
- Use simple, approachable language
- Natural rhythm and flow for speaking aloud
- Use everyday expressions and contractions where natural
- Output ONLY the translated English text, no explanations.`,

  sales: `You are an American sales copywriter and translator.
Translate Chinese scripts into high-conversion English sales copy for voiceover.
Requirements:
- Aggressive but natural American sales style
- Create urgency and excitement
- Use power words that drive action
- Sound like a professional TV shopping host or infomercial
- Short punchy sentences that hit hard when spoken
- Output ONLY the translated English text, no explanations.`,
};

/**
 * 调用 DeepSeek API 进行翻译
 */
export async function translate(
  text: string,
  style: TranslationStyle = "tiktok"
): Promise<TranslateResponse> {
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY is not configured");
  }

  const systemPrompt = TRANSLATION_PROMPTS[style];

  const response = await fetch(`${DEEPSEEK_BASE_URL}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text },
      ],
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `DeepSeek API error (${response.status}): ${errorBody}`
    );
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
    usage: { total_tokens: number };
  };

  const translatedText = data.choices[0]?.message?.content?.trim() ?? "";

  // 成本计算（DeepSeek 价格，单位：美元/1M tokens）
  // deepseek-chat: 输入 $0.27/1M, 输出 $1.10/1M
  const inputTokens = data.usage?.total_tokens
    ? Math.ceil(data.usage.total_tokens * 0.6) // 估算输入 token 占比
    : text.length;
  const outputTokens = translatedText.length;
  const costUsd =
    (inputTokens / 1_000_000) * 0.27 +
    (outputTokens / 1_000_000) * 1.1;

  return {
    translatedText,
    style,
    tokensUsed: data.usage?.total_tokens ?? 0,
    costUsd: Math.round(costUsd * 10000) / 10000,
  };
}

/**
 * AI 分析文本风格，推荐最合适的音色
 * 用于 Phase 2：AI 推荐最佳音色
 */
export async function analyzeTextStyle(
  text: string
): Promise<{ style: string; description: string }> {
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY is not configured");
  }

  const response = await fetch(`${DEEPSEEK_BASE_URL}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: `Analyze the given script and output JSON with:
- "style": one of ["advertisement", "storytelling", "tutorial", "news", "casual_vlog"]
- "description": one-line summary of the tone (max 15 words)
Output ONLY valid JSON, no markdown.`,
        },
        { role: "user", content: text },
      ],
      temperature: 0.3,
      max_tokens: 200,
    }),
  });

  if (!response.ok) {
    throw new Error(`DeepSeek text analysis failed (${response.status})`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };

  const raw = data.choices[0]?.message?.content?.trim() ?? "{}";
  return JSON.parse(raw) as { style: string; description: string };
}
