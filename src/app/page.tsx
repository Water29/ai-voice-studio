"use client";

import { useState, useCallback, useEffect } from "react";
import { ScriptInput } from "@/components/ScriptInput";
import { TranslationResult } from "@/components/TranslationResult";
import { VoicePlayer } from "@/components/VoicePlayer";
import { HistoryPanel } from "@/components/HistoryPanel";
import { useTranslation } from "@/hooks/useTranslation";
import { useVoice } from "@/hooks/useVoice";
import { useHistory } from "@/hooks/useHistory";
import type {
  TranslationStyle,
  HistoryRecord,
  TranslateResponse,
  TTSResponse,
} from "@/types";

type WorkflowState = "idle" | "translating" | "generating" | "done";

export default function Home() {
  const translation = useTranslation();
  const voice = useVoice();
  const historyStore = useHistory();

  const [workflowState, setWorkflowState] = useState<WorkflowState>("idle");
  const [sourceText, setSourceText] = useState("");
  const [translationResult, setTranslationResult] =
    useState<TranslateResponse | null>(null);
  const [ttsResult, setTTSResult] = useState<TTSResponse | null>(null);

  useEffect(() => {
    voice.loadVoices();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGenerate = useCallback(
    async (text: string, style: TranslationStyle) => {
      setSourceText(text);
      setWorkflowState("translating");
      setTranslationResult(null);
      setTTSResult(null);

      const translateResult = await translation.translate(text, style);
      if (!translateResult) {
        setWorkflowState("idle");
        return;
      }
      setTranslationResult(translateResult);

      setWorkflowState("generating");
      const vid = voice.selectedVoice?.voiceId ?? "pNInz6obpgDQGcFmaJgB";
      const ttsR = await voice.generate(translateResult.translatedText, vid);
      if (ttsR) setTTSResult(ttsR);
      setWorkflowState("done");

      // 保存历史
      const rid = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      try {
        await fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: rid, sourceText: text,
            translatedText: translateResult.translatedText,
            translationStyle: style,
            audioUrl: ttsR?.audioUrl ?? null,
            voiceName: ttsR?.voiceName ?? voice.selectedVoice?.name ?? null,
            voiceId: vid, durationMs: ttsR?.durationMs ?? null,
            costUsd: (translateResult.costUsd ?? 0) + (ttsR?.costUsd ?? 0),
            createdAt: new Date().toISOString(),
          }),
        });
        historyStore.refresh();
      } catch { console.warn("保存失败"); }
    },
    [translation, voice, historyStore]
  );

  const handleSelectHistory = useCallback(
    (r: HistoryRecord) => {
      setSourceText(r.sourceText);
      translation.reset(); voice.reset();
      setTranslationResult({ translatedText: r.translatedText, style: r.translationStyle, tokensUsed: 0, costUsd: 0 });
      if (r.audioUrl) setTTSResult({ audioUrl: r.audioUrl, durationMs: r.durationMs ?? 0, voiceName: r.voiceName ?? "", costUsd: 0 });
      setWorkflowState("done");
    },
    [translation, voice]
  );

  const handleDeleteHistory = useCallback(
    async (id: string) => { await historyStore.deleteItem(id); },
    [historyStore]
  );

  const handleSearchHistory = useCallback(
    (q: string) => historyStore.loadHistory(q),
    [historyStore]
  );

  const handleReset = useCallback(() => {
    setSourceText(""); setTranslationResult(null); setTTSResult(null);
    setWorkflowState("idle"); translation.reset(); voice.reset();
  }, [translation, voice]);

  const handleDownload = useCallback(() => {
    if (ttsResult?.audioUrl) {
      const a = document.createElement("a");
      a.href = ttsResult.audioUrl; a.download = `ai-voice-${Date.now()}.mp3`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    }
  }, [ttsResult]);

  const isProc = workflowState === "translating" || workflowState === "generating";

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <header
        className="mb-6 flex items-center justify-between rounded-2xl px-5 py-4 text-white shadow-md"
        style={{ background: "linear-gradient(135deg, #9b87d0 0%, #8498c8 35%, #90b0d8 65%, #b090c8 100%)" }}
      >
        <div>
          <h1 className="text-lg font-bold drop-shadow-sm">🎙️ AI Voice Studio</h1>
          <p className="mt-0.5 text-xs text-white/65">DeepSeek 翻译 · ElevenLabs 配音</p>
        </div>
        {workflowState !== "idle" && (
          <button onClick={handleReset}
            className="rounded-xl bg-white/20 px-4 py-1.5 text-xs font-medium text-white hover:bg-white/30 transition-all">
            + 新建
          </button>
        )}
      </header>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* 输入卡片 */}
          <section className="rounded-2xl border border-purple-200/60 bg-white/75 shadow-sm p-5">
            <ScriptInput onGenerate={handleGenerate} isGenerating={isProc} />
          </section>

          <div className="min-h-[120px] space-y-4">
            {/* 翻译中 */}
            {workflowState === "translating" && (
              <div className="rounded-xl border border-purple-200/50 p-4"
                style={{ background: "linear-gradient(135deg, #ede5f8 0%, #e8e0f5 100%)" }}>
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-300 border-t-purple-500" />
                  <span className="text-sm text-purple-500 font-medium">DeepSeek 翻译中...</span>
                </div>
              </div>
            )}
            {/* 翻译结果 */}
            {(workflowState === "generating" || workflowState === "done") && translationResult && (
              <section className="rounded-2xl border border-purple-200/60 bg-white/75 shadow-sm p-5">
                <h2 className="mb-2 text-[11px] font-semibold text-purple-400 uppercase tracking-wider">英文翻译</h2>
                <TranslationResult
                  translatedText={translationResult.translatedText}
                  style={translationResult.style}
                  costUsd={translationResult.costUsd}
                  onRegenerate={workflowState === "done" ? () => handleGenerate(sourceText, translationResult.style) : undefined}
                />
              </section>
            )}
            {/* 语音生成中 */}
            {workflowState === "generating" && (
              <div className="rounded-xl border border-violet-200/50 p-4"
                style={{ background: "linear-gradient(135deg, #ede5f8 0%, #f8e0ee 100%)" }}>
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-violet-300 border-t-violet-500" />
                  <span className="text-sm text-violet-500 font-medium">ElevenLabs 语音生成中...</span>
                </div>
              </div>
            )}
            {/* 语音结果 */}
            {ttsResult && workflowState === "done" && (
              <section className="rounded-2xl border border-purple-200/60 bg-white/75 shadow-sm p-5">
                <h2 className="mb-2 text-[11px] font-semibold text-purple-400 uppercase tracking-wider">语音预览</h2>
                <VoicePlayer audioUrl={ttsResult.audioUrl} voiceName={ttsResult.voiceName} durationMs={ttsResult.durationMs} onDownload={handleDownload} />
              </section>
            )}
            {/* 空闲 */}
            {workflowState === "idle" && (
              <div className="rounded-xl border border-dashed border-purple-200/50 p-8 text-center"
                style={{ background: "linear-gradient(180deg, #ede5f8 0%, #f8e0ee 100%)" }}>
                <p className="text-sm text-purple-400/70">输入中文文案，选择风格，开始生成 ✨</p>
              </div>
            )}
          </div>
        </div>

        <aside className="lg:col-span-1">
          <div className="rounded-2xl border border-purple-200/60 bg-white/75 shadow-sm p-5 lg:sticky lg:top-6">
            <HistoryPanel records={historyStore.records} isLoading={historyStore.isLoading}
              onSelect={handleSelectHistory} onDelete={handleDeleteHistory} onSearch={handleSearchHistory} />
          </div>
        </aside>
      </div>

      <footer className="mt-8 pb-6 text-center">
        <p className="text-xs text-purple-300/80">Powered by{" "}
          <a href="https://platform.deepseek.com" target="_blank" rel="noopener noreferrer"
            className="text-purple-400 hover:text-purple-500 transition-colors">DeepSeek</a>{" "}+{" "}
          <a href="https://elevenlabs.io" target="_blank" rel="noopener noreferrer"
            className="text-purple-400 hover:text-purple-500 transition-colors">ElevenLabs</a>
        </p>
      </footer>
    </div>
  );
}
