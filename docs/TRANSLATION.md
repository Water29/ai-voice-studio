# DeepSeek 翻译方案

## 为什么选择 DeepSeek

| 对比维度 | DeepSeek | GPT-4o-mini | Google Translate |
|---------|----------|-------------|------------------|
| 翻译质量 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| 口语自然度 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| 中文理解 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| 价格（$/1M tokens） | 输入 $0.27 输出 $1.10 | 输入 $0.15 输出 $0.60 | 免费 |
| API 兼容性 | OpenAI SDK 完全兼容 | 原生 | 独立 SDK |

**结论**：DeepSeek 在翻译质量和成本之间取得了最佳平衡。相比 Google Translate 更自然，相比 GPT-4o-mini 更便宜且中文理解更强。

## API 调用方式

DeepSeek API 完全兼容 OpenAI SDK 格式：

```typescript
const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`,
  },
  body: JSON.stringify({
    model: "deepseek-chat",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: text },
    ],
    temperature: 0.7,
    max_tokens: 2048,
  }),
});
```

## 翻译 Prompt 设计

项目提供 4 种翻译风格，每种有独立的 System Prompt：

### 1. TikTok 风格（默认）
```
You are a professional TikTok marketing translator.
- Sound like a native English speaker
- Suitable for short-form videos (TikTok, Reels, Shorts)
- Avoid literal translation — prioritize natural conversational flow
- Keep a persuasive, engaging, energetic tone
- Use short sentences that are easy to speak aloud
- Output ONLY the translated English text
```

### 2. 专业商务
```
You are a professional business translator.
- Professional business tone, suitable for corporate presentations
- Clear, articulate, well-structured sentences
- Maintain the original meaning precisely
- Avoid slang and casual expressions
- Output ONLY the translated English text
```

### 3. 日常闲聊
```
You are a casual conversation translator.
- Sound like a friend talking to another friend
- Use simple, approachable language
- Natural rhythm and flow for speaking aloud
- Use everyday expressions and contractions where natural
- Output ONLY the translated English text
```

### 4. 美式促销
```
You are an American sales copywriter and translator.
- Aggressive but natural American sales style
- Create urgency and excitement
- Use power words that drive action
- Sound like a professional TV shopping host or infomercial
- Short punchy sentences that hit hard when spoken
- Output ONLY the translated English text
```

## 参数说明

| 参数 | 值 | 说明 |
|------|------|------|
| model | deepseek-chat | DeepSeek 主力对话模型 |
| temperature | 0.7 | 适中的创造性，保持翻译一致性 |
| max_tokens | 2048 | 支持足够长的输出 |

## 成本估算

```
输入费用 = 中文字符数 × 0.6 token/字符 × $0.27/1M tokens
输出费用 = 英文字符数 × 0.3 token/字符 × $1.10/1M tokens
总费用 = 输入费用 + 输出费用
```

示例：100 字中文输入 → 约 400 字符英文输出 → 总费用约 **$0.0003**
