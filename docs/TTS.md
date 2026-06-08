# ElevenLabs TTS 语音合成方案

## 模型选择

使用 **eleven_multilingual_v2** 模型，原因：
- 支持多语言（含英文），口音自然
- 对营销文案有较好的语调处理
- 延迟适中，生成速度快

## 音色库

项目预置 6 个高质量英文音色：

| 音色 | Voice ID | 分类 | 风格描述 |
|------|----------|------|----------|
| Adam | pNInz6obpgDQGcFmaJgB | male | 深沉有力的美式男声，适合广告和促销 |
| Rachel | 21m00Tcm4TlvDq8ikWAM | female | 温暖自然的美国女声，适合旁白和教程 |
| Bella | EXAVITQu4vr4xnSDxMaL | female | 年轻活泼的美国女声，适合 TikTok |
| Sam | yoZ06aMxZJJ28mfd3POQ | male | 沉稳平静的男声，适合企业介绍 |
| Domi | AZnzlk1XvdvUeBnXmlld | female | 高能量美式女声，适合促销导购 |
| Emily | MF3mGyEYCl7XYWbV9V6O | female | 温柔亲切的美国女声，适合生活类内容 |

## 语音参数

```json
{
  "stability": 0.4,
  "similarity_boost": 0.8,
  "style": 0.5,
  "use_speaker_boost": true
}
```

| 参数 | 值 | 说明 |
|------|------|------|
| stability | 0.4 | 较低的值让语音更有表现力和变化 |
| similarity_boost | 0.8 | 较高的值保持音色的一致性 |
| style | 0.5 | 适中的风格夸张度 |
| use_speaker_boost | true | 启用扬声器增强，提升清晰度 |

## API 调用方式

```typescript
const response = await fetch(
  `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
  {
    method: "POST",
    headers: {
      "Accept": "audio/mpeg",
      "Content-Type": "application/json",
      "xi-api-key": apiKey,
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.4, similarity_boost: 0.8, ... },
    }),
  }
);
```

## 音频文件管理

- **存储位置**：`public/audio/` 目录
- **命名规则**：`tts_{时间戳}_{voiceId前8位}.mp3`
- **生命周期**：随关联的历史记录一起删除
- **Git**：`public/audio/*.mp3` 在 `.gitignore` 中排除

## 成本

ElevenLabs Multilingual v2 约 **$0.03 / 1000 字符**

示例：150 字符英文文本 → 约 **$0.0045**
